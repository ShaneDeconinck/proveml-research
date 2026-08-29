#!/usr/bin/env node
/**
 * SymGen baseline.
 *
 * Reimplementation of the mechanism published in "Towards Verifiable Text
 * Generation with Symbolic References" (Torroba Hennigen et al., COLM 2024):
 * the model interleaves prose with Jinja-like `{{ field }}` references into the
 * conditioning data, and a parser substitutes each reference with the stored
 * value. Unresolvable references render as `undefined` (their §2 fallback).
 * This is the "Direct SymGen" strategy; we do not reimplement their Indirect
 * (generate-then-rewrite) variant.
 *
 * Everything outside the markup mechanism is held identical to the ProveML runs:
 * same fact store, same context slices, same prompts, same models, same
 * decoding, same benchmark files. The only difference is what the model is asked
 * to emit and how it is resolved.
 *
 * Measured per response (see analyse-symgen-vs-proveml.mjs for the comparison):
 *   - references emitted, and how many resolve against the store
 *   - binding coverage: numeric tokens inside a reference vs. in free prose
 *   - qualitative claims: neither mechanism binds them here, counted for context
 *
 * NOTE ON FAIRNESS: substitution cannot produce a wrong value for a resolved
 * reference, so SymGen's value-error count is zero by construction. That is a
 * genuine property of the design, not an artifact of this reimplementation, and
 * it is reported as such.
 *
 * Usage:
 *   node test-symgen-baseline.js --provider ollama --model qwen2.5:7b --run 1 [--benchmark ...]
 */

import { callLLM as llmCall } from './llm.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const runId = args.find((_, i) => args[i - 1] === '--run') || '1';
const model = args.find((_, i) => args[i - 1] === '--model') || '';
const provider = args.find((_, i) => args[i - 1] === '--provider') || 'claude';
const domain = args.find((_, i) => args[i - 1] === '--domain') || 'finance';

// ── Fact store: identical construction to the ProveML harnesses ──

let factStore = {};
let buildPromptContext, benchmark, SYSTEM;

if (domain === 'finance') {
    const data = JSON.parse(readFileSync(join(__dirname, '../data/sec-edgar-finance.json'), 'utf8'));
    for (const c of data.companies) {
        factStore[`company:${c.id}.name`] = c.name;
        factStore[`company:${c.id}.cik`] = c.cik;
        for (const [key, val] of Object.entries(c)) {
            if (['id', 'name', 'cik'].includes(key)) continue;
            factStore[`company:${c.id}.${key}`] = val;
        }
    }
    const companySummary = data.companies.map(c => ({
        id: c.id, name: c.name,
        revenue: c.revenue, assets: c.assets, liabilities: c.liabilities,
        netIncome: c.netIncome, eps: c.eps, cash: c.cash, equity: c.equity,
        sharesOutstanding: c.sharesOutstanding, longTermDebt: c.longTermDebt,
        debtToEquity: c.debtToEquity, currentRatio: c.currentRatio,
    }));
    const byName = new Map(companySummary.map(c => [c.name, c]));
    buildPromptContext = (spec) => {
        const refs = [...(spec.context_refs || [])];
        const companies = refs.map(r => byName.get(r)).filter(Boolean);
        return { companies: companies.length > 0 ? companies : companySummary };
    };
    benchmark = JSON.parse(readFileSync(join(__dirname, '../benchmarks/proveml-finance.v1.json'), 'utf8'));
    SYSTEM = `You are a financial analyst. Answer using symbolic references into the data.
RULES:
- Do NOT write numbers directly. Refer to a field with {{ company:ID.field }}
- Example: {{ company:aapl.revenue }} instead of writing the revenue out
- Company names are fields too: {{ company:aapl.name }}
- Write normal prose around the references
- Keep it concise — focus on the data
- Do not wrap the answer in code fences or triple backticks

EXAMPLE OUTPUT:
{{ company:aapl.name }} reported revenue of {{ company:aapl.revenue }} with net income of {{ company:aapl.netIncome }}.
`;
} else {
    // Only the generated dataset; no fallback to the withdrawn real one
    // (see test-convergence.js).
    const demoPath = join(__dirname, '../data/mastery-layers-demo.json');
    if (!existsSync(demoPath)) {
        throw new Error(`Missing ${demoPath}: regenerate it with node data/generate-education-benchmark.mjs`);
    }
    const ml = JSON.parse(readFileSync(demoPath));
    for (const o of ml.offerings) {
        factStore[`offering:${o.id}.name`] = o.name;
        factStore[`offering:${o.id}.studentCount`] = o.students.length;
        const avg = o.students.length ? Math.round(o.students.reduce((s, st) => s + st.rate, 0) / o.students.length) : 0;
        factStore[`offering:${o.id}.passRate`] = avg;
        const evAvg = o.students.length ? Math.round(o.students.reduce((s, st) => s + (st.total ? st.ev / st.total * 100 : 0), 0) / o.students.length) : 0;
        factStore[`offering:${o.id}.evalRate`] = evAvg;
        for (const s of o.students) {
            factStore[`student:${s.id}.name`] = s.name;
            factStore[`student:${s.id}.passRate`] = s.rate;
            factStore[`student:${s.id}.passed`] = s.pass;
            factStore[`student:${s.id}.evaluated`] = s.ev;
            factStore[`student:${s.id}.total`] = s.total;
            factStore[`student:${s.id}.absent`] = s.grijs || 0;
        }
    }
    const offSummary = ml.offerings.map(o => {
        const avg = o.students.length ? Math.round(o.students.reduce((s, st) => s + st.rate, 0) / o.students.length) : 0;
        const evAvg = o.students.length ? Math.round(o.students.reduce((s, st) => s + (st.total ? st.ev / st.total * 100 : 0), 0) / o.students.length) : 0;
        return { id: o.id, name: o.name, stream: o.stream, students: o.students.length, passRate: avg, evalRate: evAvg };
    }).sort((a, b) => a.passRate - b.passRate);
    const stuAll = [];
    for (const o of ml.offerings) for (const s of o.students) stuAll.push({ ...s, offeringId: o.id, offering: o.name });
    const struggling = stuAll.filter(s => s.ev >= 5).sort((a, b) => a.rate - b.rate).slice(0, 20)
        .map(s => ({ id: s.id, name: s.name, offeringId: s.offeringId, offering: s.offering, passed: s.pass, evaluated: s.ev, total: s.total, rate: s.rate, absent: s.grijs || 0 }));
    const offeringByName = new Map(offSummary.map(o => [o.name, o]));
    const studentByName = new Map(struggling.map(s => [s.name, s]));
    const uniqueById = (items) => {
        const seen = new Set();
        return items.filter(i => i && !seen.has(i.id) && seen.add(i.id));
    };
    buildPromptContext = (spec) => {
        const refs = [...(spec.must_reference || []), ...(spec.context_refs || [])];
        const offerings = [], students = [];
        for (const ref of refs) {
            if (offeringByName.has(ref)) offerings.push(offeringByName.get(ref));
            if (studentByName.has(ref)) students.push(studentByName.get(ref));
        }
        if ((spec.context_source === 'strugglingStudents' || spec.context_source === 'unsupported') && students.length > 0) {
            for (const s of students) if (offeringByName.has(s.offering)) offerings.push(offeringByName.get(s.offering));
        }
        return { offerings: uniqueById(offerings), strugglingStudents: uniqueById(students) };
    };
    const benchArg = args.find((_, i) => args[i - 1] === '--benchmark') || '../benchmarks/proveml-pilot.v1.json';
    benchmark = JSON.parse(readFileSync(join(__dirname, benchArg), 'utf8'));
    SYSTEM = `You are a curriculum analytics expert. Answer using symbolic references into the data.
RULES:
- Do NOT write numbers directly. Refer to a field with {{ offering:ID.field }} or {{ student:ID.field }}
- Example: {{ offering:10004.studentCount }} instead of writing the number out
- Names are fields too: {{ offering:10004.name }}
- Write normal prose around the references
- Keep it concise — focus on the data
- Do not wrap the answer in code fences or triple backticks

EXAMPLE OUTPUT:
{{ offering:10004.name }} has {{ offering:10004.studentCount }} students with a pass rate of {{ offering:10004.passRate }}%.
`;
}

// ── SymGen resolution: substitute references, unresolvable -> "undefined" ──

const REF_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

function resolveSymgen(text) {
    const refs = [];
    const rendered = text.replace(REF_RE, (_, path) => {
        const key = path.trim();
        const has = Object.prototype.hasOwnProperty.call(factStore, key);
        refs.push({ path: key, resolved: has });
        return has ? String(factStore[key]) : 'undefined';
    });
    return {
        rendered,
        refs,
        total: refs.length,
        resolved: refs.filter(r => r.resolved).length,
        unresolved: refs.filter(r => !r.resolved).map(r => r.path),
    };
}

// Numeric tokens outside any reference, measured the same way as
// coverage-audit.mjs measures unmarked tokens for ProveML.
const NUM_TOKEN_RE = /(?<![A-Za-z0-9.,])\d+(?:[.,]\d+)*(?![A-Za-z0-9])/g;

function bindingCoverage(raw) {
    let boundNumeric = 0;
    for (const m of raw.matchAll(REF_RE)) {
        const key = m[1].trim();
        const v = factStore[key];
        if (v !== undefined && /\d/.test(String(v))) boundNumeric++;
    }
    let prose = raw.replace(REF_RE, ' ').replace(/`[^`]*`/g, ' ');
    prose = prose.replace(/^\s*\d+[.)]\s/gm, ' ')
        .replace(/\bFY\s?(19|20)\d{2}\b/g, ' ')
        .replace(/\bQ[1-4]\s?(19|20)\d{2}\b/g, ' ')
        .replace(/\b(19|20)\d{2}\b/g, ' ');
    const free = [...prose.matchAll(NUM_TOKEN_RE)].map(m => m[0]);
    return { boundNumeric, freeNumeric: free.length, freeTokens: free.slice(0, 20) };
}

// How long a single generation may take before we give up on it.
//
// This is a harness limit, not a measurement: a call that is killed at the wall
// clock leaves the query out of the run and quietly shrinks the denominator, so
// the number would then partly describe our patience. It is set well above the
// slowest observed generation (a small model rambling through a correction loop
// on a large slice) so that it fires only on a genuinely stuck call. Override
// with --timeout <seconds>.
const CALL_TIMEOUT_MS = (Number(args.find((_, i) => args[i - 1] === '--timeout')) || 900) * 1000;

function callLLM(prompt) {
    try {
        return llmCall(provider, model, prompt, { timeoutMs: CALL_TIMEOUT_MS, tmpFile: join(__dirname, `.tmp-symgen-${domain}.txt`) });
    } catch (e) {
        console.error(`    LLM error: ${e.message.slice(0, 100)}`);
        return null;
    }
}

// ── Run ──

const queries = benchmark.prompts;
console.log('═══════════════════════════════════════════════════');
console.log('  SymGen baseline (reimplementation, Direct strategy)');
console.log(`  Domain: ${domain}, Provider: ${provider}, Model: ${model || '(default)'}`);
console.log(`  Benchmark: ${benchmark.name} (${benchmark.version})`);
console.log('═══════════════════════════════════════════════════\n');

const results = [];
for (let qi = 0; qi < queries.length; qi++) {
    const { id, prompt, category, expected_mode: expectedMode } = queries[qi];
    const ctx = JSON.stringify(buildPromptContext(queries[qi]), null, 2);
    console.log(`Q${qi + 1} [${category}] ${id}`);

    const t0 = Date.now();
    const raw = callLLM(`${SYSTEM}\n\nDATA:\n${ctx}\n\nQuestion: ${prompt}`);
    const time = ((Date.now() - t0) / 1000).toFixed(1);
    if (!raw) { console.log('  ✗ failed\n'); results.push(null); continue; }

    const res = resolveSymgen(raw);
    const cov = bindingCoverage(raw);
    const rate = res.total > 0 ? Math.round(res.resolved / res.total * 100) : 0;
    console.log(`  refs ${res.resolved}/${res.total} resolved (${rate}%), ` +
        `bound numerics ${cov.boundNumeric}, free numerics ${cov.freeNumeric} [${time}s]`);
    if (res.unresolved.length) console.log(`     unresolved: ${res.unresolved.slice(0, 5).join(', ')}`);

    results.push({
        query: qi + 1, id, category, expectedMode,
        refs: res.total, resolved: res.resolved, resolutionRate: rate,
        unresolved: res.unresolved,
        boundNumeric: cov.boundNumeric, freeNumeric: cov.freeNumeric, freeTokens: cov.freeTokens,
        hasMarkup: res.total > 0,
        rawResponse: raw.slice(0, 2000),
        renderedResponse: res.rendered.slice(0, 2000),
        time: +time,
    });
}

const valid = results.filter(Boolean);
const totRefs = valid.reduce((s, r) => s + r.refs, 0);
const totRes = valid.reduce((s, r) => s + r.resolved, 0);
const totBound = valid.reduce((s, r) => s + r.boundNumeric, 0);
const totFree = valid.reduce((s, r) => s + r.freeNumeric, 0);
const noMarkup = valid.filter(r => !r.hasMarkup).length;

console.log('\n═══════════════════════════════════════════════════');
console.log(`  Queries:                ${valid.length}`);
console.log(`  References:             ${totRefs} (${totRes} resolved, ${totRefs - totRes} unresolved)`);
console.log(`  Resolution rate:        ${totRefs ? Math.round(totRes / totRefs * 100) : 0}%`);
console.log(`  Binding coverage:       ${totBound + totFree ? Math.round(totBound / (totBound + totFree) * 100) : 0}%` +
    ` (${totBound} bound, ${totFree} free numerics)`);
console.log(`  Responses w/o markup:   ${noMarkup}/${valid.length}`);
console.log('═══════════════════════════════════════════════════');

const outFile = join(__dirname, `symgen-results-${domain}-${model || 'default'}-run${runId}.json`);
writeFileSync(outFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    system: 'symgen-direct-reimplementation',
    provider, model: model || 'default', run: +runId, domain,
    benchmark: { name: benchmark.name, version: benchmark.version },
    results: valid,
    summary: {
        queries: valid.length, refs: totRefs, resolved: totRes,
        resolutionRate: totRefs ? Math.round(totRes / totRefs * 100) : 0,
        boundNumeric: totBound, freeNumeric: totFree,
        bindingCoverage: totBound + totFree ? +(100 * totBound / (totBound + totFree)).toFixed(1) : 0,
        noMarkup,
    },
}, null, 2));
console.log(`\nSaved to ${outFile}`);
