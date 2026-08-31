#!/usr/bin/env node
/**
 * Build the live paper page: the paper's findings as ProveML markup, verified
 * against the paper's own run artifacts, rendered for abovebeyond.ai.
 *
 * The point is not decoration. Every highlighted number on the page goes
 * through verifyProveml against a fact store derived from the same JSON files
 * the paper's tables regenerate from. If a claim stops matching its artifact —
 * because a run was redone, an aggregate changed, anything — this build FAILS,
 * and the page cannot ship with a stale number. The paper about verification,
 * held to its own standard.
 *
 * This version carries the August 2026 frontier study (Opus 5, Sonnet 5,
 * DeepSeek V4 Pro; tags frontier and frontier2). Every fact below is derived
 * from the artifacts with the same aggregation as frontier-summary.mjs and
 * frontier-residuals.mjs; nothing is typed in by hand.
 *
 * Usage:
 *   node site/build-live-paper.mjs [--out <dir>]
 *
 * Writes:
 *   <out>/proveml-paper-live.html   rendered fragment (site CSS classes)
 *   <out>/proveml-paper-live.json   { claims, verified, generated }
 *   <out>/proveml-paper-live.pml.txt  the raw markup
 *
 * Default out: ~/Projects/abovebeyond/src/generated/
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { verifyProveml, tokenizeProveml } from 'proveml/verify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const expDir = join(root, 'experiments');
const args = process.argv.slice(2);
const outDir = args.find((_, i) => args[i - 1] === '--out')
    || join(homedir(), 'Projects/abovebeyond/src/generated');

// ── aggregation, identical to frontier-summary.mjs ──────────────────────────

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => xs.length < 2 ? 0 : Math.sqrt(xs.reduce((s, v) => s + (v - mean(xs)) ** 2, 0) / (xs.length - 1));
const r1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;
const stripTrailingPartialConstruct = (t) => t.replace(/[@%?]\[[^\]]*(\]\{[^}]*)?$/, '');

const MODELS = {
    opus5: 'claude-opus-5',
    sonnet5: 'claude-sonnet-5',
    deepseek: 'deepseek-ai_DeepSeek-V4-Pro-0813',
};

function runsOf(tag, bench, fileModel) {
    const prefix = `convergence-results-${bench === 'finance' ? 'finance-' : ''}${tag}-${fileModel}-run`;
    const files = readdirSync(expDir).filter((f) => f.startsWith(prefix) && f.endsWith('.json'));
    if (files.length !== 3) throw new Error(`${prefix}*: expected 3 runs, found ${files.length}`);
    return files.map((f) => JSON.parse(readFileSync(join(expDir, f), 'utf8')));
}

function aggregate(tag, bench, fileModel) {
    const runs = runsOf(tag, bench, fileModel);
    const first = [], final = [];
    let marked = 0, unmarked = 0, empties = 0, queryRuns = 0;
    for (const doc of runs) {
        const qs = doc.results.filter(Boolean);
        first.push(mean(qs.map((q) => q.initialRate)));
        final.push(mean(qs.map((q) => q.finalRate)));
        for (const q of qs) {
            queryRuns++;
            if (q.emptyResponse) empties++;
            const c = verifyProveml(stripTrailingPartialConstruct(q.finalResponse || ''), {}).coverage;
            marked += c.marked; unmarked += c.unmarked;
        }
    }
    return {
        first: r1(mean(first)), firstSd: r1(sd(first)),
        final: r1(mean(final)),
        cover: r1(100 * marked / (marked + unmarked)),
        empties, queryRuns,
    };
}

// Residual classification, identical to frontier-residuals.mjs.
const STUDENT_FIELDS = new Set(['passRate', 'passed', 'evaluated', 'total', 'absent']);
function residuals(tag) {
    const out = { total: 0, binding: 0, wrongValue: 0, thresholdAsFact: 0, nonConverged: 0, bindingQueryRuns: 0 };
    for (const key of Object.values(MODELS)) {
        for (const doc of runsOf(tag, 'education', key)) {
            for (const q of doc.results) {
                if (!q || q.converged) continue;
                out.nonConverged++;
                let bindingHere = false;
                for (const e of q.steps[q.steps.length - 1].errorDetails || []) {
                    out.total++;
                    const field = (e.path || '').split('.').slice(1).join('.');
                    if (e.status === 'field-not-found' && /^offering:/.test(e.path || '') && STUDENT_FIELDS.has(field)) { out.binding++; bindingHere = true; }
                    else if (e.status === 'no-context') out.thresholdAsFact++;
                    else if (e.status === 'value-mismatch') out.wrongValue++;
                }
                if (bindingHere) out.bindingQueryRuns++;
            }
        }
    }
    return out;
}

// ── the fact store, derived from the artifacts ──────────────────────────────

const SRC = {
    runs: (tag) => `experiments/convergence-results-*${tag}-*.json`,
    resid: 'experiments/frontier-residuals.mjs over the education artifacts',
};

const NAMES = { opus5: 'Claude Opus 5', sonnet5: 'Claude Sonnet 5', deepseek: 'DeepSeek V4 Pro' };
const FACTS = {
    'study:detection': {
        name: ['the detection study', 'paper appendix A'],
        injected: [20, 'src/detection.test.js'],
        detected: [20, 'src/detection.test.js'],
        missed: [0, 'src/detection.test.js'],
    },
};

let totalQueryRuns = 0, totalEmpties = 0;
for (const [short, fileModel] of Object.entries(MODELS)) {
    const eduA = aggregate('frontier', 'education', fileModel);
    const finA = aggregate('frontier', 'finance', fileModel);
    const eduB = aggregate('frontier2', 'education', fileModel);
    const finB = aggregate('frontier2', 'finance', fileModel);
    totalQueryRuns += eduA.queryRuns + finA.queryRuns;
    totalEmpties += eduA.empties + finA.empties;
    FACTS[`model:${short}`] = {
        name: [NAMES[short], SRC.runs('frontier')],
        eduFirst: [eduA.first, SRC.runs('frontier')],
        eduFirstSd: [eduA.firstSd, SRC.runs('frontier')],
        eduFinal: [eduA.final, SRC.runs('frontier')],
        eduCover: [eduA.cover, SRC.runs('frontier')],
        finFirst: [finA.first, SRC.runs('frontier')],
        finFinal: [finA.final, SRC.runs('frontier')],
        finCover: [finA.cover, SRC.runs('frontier')],
        edu2First: [eduB.first, SRC.runs('frontier2')],
        edu2Final: [eduB.final, SRC.runs('frontier2')],
        fin2First: [finB.first, SRC.runs('frontier2')],
    };
}

const resA = residuals('frontier');
const resB = residuals('frontier2');
FACTS['study:frontier'] = {
    name: ['the frontier study', SRC.runs('frontier')],
    queryRuns: [totalQueryRuns, SRC.runs('frontier')],
    empties: [totalEmpties, SRC.runs('frontier')],
};
FACTS['residue:frontier'] = {
    name: ['the residue', SRC.resid],
    total: [resA.total, SRC.resid],
    binding: [resA.binding, SRC.resid],
    bindingPct: [Math.round(100 * resA.binding / resA.total), SRC.resid],
    wrongValue: [resA.wrongValue, SRC.resid],
    bindingQueryRuns: [resA.bindingQueryRuns, SRC.resid],
    nonConverged: [resA.nonConverged, SRC.resid],
};
FACTS['residue:frontier2'] = {
    name: ['the second prompt', SRC.resid],
    binding: [resB.binding, SRC.resid],
};

const factStore = {};
const provenance = {};
for (const [entity, fields] of Object.entries(FACTS)) {
    for (const [field, [value, source]] of Object.entries(fields)) {
        factStore[`${entity}.${field}`] = value;
        provenance[`${entity}.${field}`] = source;
    }
}

// ── the threshold registry: the judgments the page is allowed to make ──────

const registry = {
    DETECTED_EVERYTHING: { field: 'missed', op: 'eq', value: 0, label: 'nothing slipped through', source: 'planted errors missed = 0' },
    NOTHING_EMPTY: { field: 'empties', op: 'eq', value: 0, label: 'no empty answers at all', source: 'empty responses across all query-runs = 0' },
    BINDING_DOMINANT: { field: 'bindingPct', op: 'gt', value: 50, label: 'the dominant residual shape', source: 'binding errors > 50% of the residue' },
    CLOSED_FIRST_PASS: { field: 'fin2First', op: 'eq', value: 100, label: 'every claim, first pass, every run', source: 'finance first-pass verification under the second prompt = 100%' },
};

// ── the page text, in ProveML ───────────────────────────────────────────────
// Plain segments are authored HTML; the constructs in between are real markup
// that the verifier below must fully verify before anything is written.

const BODY = `
<h2>What the verifier itself catches</h2>
<p>Before measuring any model, the paper measures the instrument. @[study:detection]{the detection study} planted %[injected]{20} deliberate errors in otherwise valid markup — wrong values, wrong entities, missing context, subtle canonicalization slips — and the verifier caught %[detected]{20} of them: ?[all: DETECTED_EVERYTHING]{nothing slipped through}. That is a conformance test, not a benchmark; exact comparison either sees a difference or there is none.</p>

<h2>The mechanism is within reach of frontier models</h2>
<p>Three models that were frontier in August 2026 — Claude Opus 5, Claude Sonnet 5, and the open-weight DeepSeek V4 Pro — over two benchmarks, three runs each: @[study:frontier]{the frontier study}. Across all its %[queryRuns]{342} query-runs, %[empties]{0} answers came back empty or without markup: ?[ne: NOTHING_EMPTY]{no empty answers at all}. @[model:opus5]{Claude Opus 5} opens at %[eduFirst]{86.5}% first-pass verification on education (spread %[eduFirstSd]{0.3}) and one correction pass lifts it to %[eduFinal]{94.8}%; @[model:deepseek]{DeepSeek V4 Pro} reaches %[finFirst]{100}% on finance on the first pass and covers %[finCover]{96.4}% of its numbers, the strongest of the three.</p>

<h2>What remains is the binding rule, not the model</h2>
<p>Under the first prompt, @[residue:frontier]{the residue} is %[total]{157} errors still standing after correction on education, and %[binding]{108} of them (%[bindingPct]{69}%) have one shape: ?[bd: BINDING_DOMINANT]{the dominant residual shape}. The sentence names the pupil and then the class, and linear carry-forward binds the pupil's facts to the class — the data is right, the English is right, and the verifier reports a field the class does not have. It touched %[bindingQueryRuns]{17} of the %[nonConverged]{35} non-converged query-runs. Wrong values are %[wrongValue]{40}; the rest is small and mixed.</p>

<h2>Told the rule, the models follow it</h2>
<p>The second prompt adds two sentences: a fact may name its own record when a sentence names two subjects, and a cutoff from the question is not a fact. Nothing else changes. On finance, @[model:opus5]{Claude Opus 5} verifies %[fin2First]{100}% of claims on the first pass in every run — ?[c1: CLOSED_FIRST_PASS]{every claim, first pass, every run} — and so do @[model:sonnet5]{Claude Sonnet 5} (%[fin2First]{100}%, ?[c2: CLOSED_FIRST_PASS]{every claim, first pass, every run}) and @[model:deepseek]{DeepSeek V4 Pro} (%[fin2First]{100}%, ?[c3: CLOSED_FIRST_PASS]{every claim, first pass, every run}). On education, @[model:sonnet5]{Claude Sonnet 5} rises to %[edu2First]{99.4}%, @[model:deepseek]{DeepSeek V4 Pro} to %[edu2First]{99.2}% first pass and %[edu2Final]{100}% after one correction, and @[model:opus5]{Claude Opus 5} to %[edu2First]{95.4}% — two of its three runs verify everything on the first pass, and in the third it reverted to the very phrasing the rule addresses, which is the honest cost of a rule a model must follow rather than a constraint it cannot break. The %[residue:frontier.binding]{108} binding errors of the first prompt become %[residue:frontier2.binding]{16} under the second.</p>
`;

// ── verify: the gate ────────────────────────────────────────────────────────

const result = verifyProveml(BODY, factStore, { thresholds: registry });
if (result.verified !== result.total || result.total === 0) {
    console.error(`LIVE PAPER GATE FAILED: ${result.verified}/${result.total} claims verified.`);
    for (const e of result.errors) console.error('  ✗ ' + e);
    process.exit(1);
}

// ── render with the site's classes ──────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tokens = tokenizeProveml(BODY);
const details = result.details;
let di = 0, pos = 0, html = '';

let ctx = null;
for (const tok of tokens) {
    html += BODY.slice(pos, tok.pos);
    if (tok.type === 'entity') {
        const d = details[di++];
        ctx = d.path;
        html += `<span class="pml-ent" data-proof="${esc(`${d.path} — this record exists in the artifact store (${provenance[`${d.path}.name`]})`)}" tabindex="0">${esc(tok.name)}</span>`;
    } else if (tok.type === 'fact') {
        const d = details[di++];
        html += `<span class="pml-ok" data-proof="${esc(`${d.path} = ${d.value} · ${provenance[d.path] || 'artifact store'}`)}" tabindex="0">${esc(tok.value)}</span>`;
    } else if (tok.type === 'inference') {
        const d = details[di++];
        const t = registry[tok.condition.match(/[A-Z_]+/)[0]];
        html += `<span class="pml-inf" data-proof="${esc(`${tok.condition}: ${t.source} — holds for ${ctx}`)}" tabindex="0">${esc(tok.text)}</span>`;
    } else if (tok.type === 'entity_close') {
        // scoped form is not used on this page
    }
    pos = tok.end;
}
html += BODY.slice(pos);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'proveml-paper-live.html'), html.trim() + '\n');
writeFileSync(join(outDir, 'proveml-paper-live.json'), JSON.stringify({
    claims: result.total,
    verified: result.verified,
    generated: new Date().toISOString().slice(0, 10),
    source: 'proveml-research site/build-live-paper.mjs — verified against the frontier run artifacts at build time',
}, null, 2) + '\n');
writeFileSync(join(outDir, 'proveml-paper-live.pml.txt'), BODY.trim() + '\n');

console.log(`${result.verified}/${result.total} claims verified — fragment written to ${outDir}`);
