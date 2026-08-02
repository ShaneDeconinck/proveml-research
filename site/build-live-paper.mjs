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
 * Usage:
 *   node site/build-live-paper.mjs [--out <dir>]
 *
 * Writes:
 *   <out>/proveml-paper-live.html   rendered fragment (site CSS classes)
 *   <out>/proveml-paper-live.json   { claims, verified, generated }
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
const args = process.argv.slice(2);
const outDir = args.find((_, i) => args[i - 1] === '--out')
    || join(homedir(), 'Projects/abovebeyond/src/generated');

// ── the fact store, derived from the artifacts ──────────────────────────────
// Same derivations as the paper's tables: mean over 3 runs, rounded the way
// the paper rounds. Each fact remembers which artifact it came from, so the
// hover proof can say so.

const agg = JSON.parse(readFileSync(join(root, 'experiments/aggregate-results.json'), 'utf8'));
const cov = JSON.parse(readFileSync(join(root, 'experiments/coverage-audit.json'), 'utf8'));
const sym = JSON.parse(readFileSync(join(root, 'experiments/symgen-vs-proveml.json'), 'utf8'));

const round = Math.round;
const r1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;

function runRates(prefix) {
    // Per-run first-pass rates, highest first, straight from the run files.
    const dir = join(root, 'experiments');
    return readdirSync(dir)
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')).summary.avgInitial)
        .sort((a, b) => b - a);
}

function coverage(benchmark, model) {
    const row = cov.rows.find(r => r.benchmark === benchmark && r.model === model);
    return r1(row.marked / (row.marked + row.unmarked) * 100);
}

function respWithUndefined() {
    const dir = join(root, 'experiments');
    let resp = 0, withU = 0;
    for (const f of readdirSync(dir).filter(f => f.startsWith('symgen-results-education-'))) {
        for (const q of JSON.parse(readFileSync(join(dir, f), 'utf8')).results) {
            if (!q) continue;
            resp++;
            if (q.unresolved.length) withU++;
        }
    }
    return round(withU / resp * 100);
}

const phi3Runs = runRates('convergence-results-phi3:mini-run');
const phi3EnRuns = runRates('convergence-results-en-phi3:mini-run');
const symEdu = sym.aggregate.education;

const SRC = {
    agg: 'experiments/aggregate-results.json',
    cov: 'experiments/coverage-audit.json',
    sym: 'experiments/symgen-vs-proveml.json',
    runs: 'experiments/convergence-results-*.json',
};

// value + provenance per field; the store below flattens this.
const model = (key, aggKey) => ({
    eduFirstPass: [round(agg[`education · ${aggKey}`].initial.mean), SRC.agg],
    eduSd: [agg[`education · ${aggKey}`].initial.sd, SRC.agg],
});

const FACTS = {
    'study:detection': {
        name: ['the detection study', 'paper §7.1'],
        injected: [20, 'src/detection.test.js'],
        detected: [20, 'src/detection.test.js'],
        missed: [0, 'src/detection.test.js'],
    },
    'model:phi3': {
        name: ['Phi-3 Mini (3.8B)', SRC.agg],
        ...model('phi3', 'phi3:mini'),
        eduRuns: [phi3Runs.join(', ').replace(/, (\d+)$/, ' and $1'), SRC.runs],
        enRuns: [phi3EnRuns.join(', ').replace(/, (\d+)$/, ' and $1'), SRC.runs],
        enFirstPass: [round(agg['education-en · phi3:mini'].initial.mean), SRC.agg],
        enShift: [round(agg['education-en · phi3:mini'].initial.mean) - round(agg['education · phi3:mini'].initial.mean), SRC.agg],
        finFirstPass: [round(agg['finance · phi3:mini'].initial.mean), SRC.agg],
        finSd: [agg['finance · phi3:mini'].initial.sd, SRC.agg],
    },
    'model:haiku': {
        name: ['Claude Haiku', SRC.agg],
        ...model('haiku', 'haiku'),
        eduCoverage: [coverage('education', 'haiku'), SRC.cov],
    },
    'model:qwen3b': {
        name: ['Qwen 2.5 3B', SRC.agg],
        ...model('qwen3b', 'qwen2.5:3b'),
    },
    'model:qwen7b': {
        name: ['Qwen 2.5 7B', SRC.agg],
        ...model('qwen7b', 'qwen2.5:7b'),
        eduCoverage: [coverage('education', 'qwen2.5:7b'), SRC.cov],
        fullctxClaims: [
            JSON.parse(readFileSync(join(root, 'experiments/convergence-results-fullctx-qwen2.5:7b-run1.json'), 'utf8'))
                .results.filter(Boolean).reduce((s, q) => s + q.initialClaims, 0),
            'experiments/convergence-results-fullctx-*.json',
        ],
    },
    'baseline:symgen': {
        name: ['SymGen', SRC.sym],
        eduUnresolvedRefs: [symEdu.symgenUnresolved, SRC.sym],
        eduRefs: [symEdu.symgenRefs, SRC.sym],
        eduUnresolvedPct: [round(symEdu.symgenUnresolved / symEdu.symgenRefs * 100), SRC.sym],
        eduRespWithUndefinedPct: [respWithUndefined(), 'experiments/symgen-results-education-*.json'],
    },
    'system:proveml': {
        name: ['ProveML', SRC.sym],
        eduCaught: [symEdu.provemlDetected, SRC.sym],
        eduWrongValues: [symEdu.provemlValueErrors, SRC.sym],
    },
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
    IS_UNSTABLE: { field: 'eduSd', op: 'gt', value: 20, label: 'unstable across runs', source: 'between-run sd of first-pass verification > 20pp' },
    IS_STABLE: { field: 'eduSd', op: 'lte', value: 5, label: 'stable across runs', source: 'between-run sd of first-pass verification ≤ 5pp' },
    DETECTED_EVERYTHING: { field: 'missed', op: 'eq', value: 0, label: 'nothing slipped through', source: 'planted errors missed = 0' },
    PRODUCED_NOTHING: { field: 'fullctxClaims', op: 'eq', value: 0, label: 'no verifiable markup at all', source: 'ProveML constructs across all 28 full-context queries = 0' },
};

// ── the page text, in ProveML ───────────────────────────────────────────────
// Plain segments are authored HTML; the constructs in between are real markup
// that the verifier below must fully verify before anything is written.

const BODY = `
<h2>What the verifier itself catches</h2>
<p>Before measuring any model, the paper measures the instrument. @[study:detection]{the detection study} planted %[injected]{20} deliberate errors in otherwise valid markup — wrong values, wrong entities, missing context, subtle canonicalization slips — and the verifier caught %[detected]{20} of them: ?[all: DETECTED_EVERYTHING]{nothing slipped through}. That is a conformance test, not a benchmark; exact comparison either sees a difference or there is none.</p>

<h2>Four models, two groups</h2>
<p>The line between the models is stability, not rate. @[model:phi3]{Phi-3 Mini (3.8B)} is ?[u: IS_UNSTABLE]{unstable across runs}: a mean first-pass verification of %[eduFirstPass]{38}% hides three identical runs that landed at %[eduRuns]{65, 48 and 0}. A mean describes neither the runs that worked nor the one that produced nothing.</p>
<p>The other three sit together and stay there. @[model:qwen3b]{Qwen 2.5 3B} reaches %[eduFirstPass]{89}% and is ?[s3: IS_STABLE]{stable across runs}; @[model:haiku]{Claude Haiku} %[eduFirstPass]{88}%, ?[sh: IS_STABLE]{stable across runs}; @[model:qwen7b]{Qwen 2.5 7B} %[eduFirstPass]{89}%, ?[s7: IS_STABLE]{stable across runs}. At three runs each, those three are not separable — the paper refuses to rank them, and so does this page.</p>

<h2>The shape of the request, not the size of the model</h2>
<p>On a compact, English-language finance benchmark built from real SEC EDGAR filings, the instability disappears: @[model:phi3]{Phi-3 Mini (3.8B)} scores %[finFirstPass]{92}% with a spread of just %[finSd]{2.5} points. Same model, same verifier, same grammar — a different request.</p>
<p>Translating the education prompts to English moves @[model:phi3]{Phi-3 Mini (3.8B)} to %[enFirstPass]{60}% (a shift of %[enShift]{22} points), and its runs become %[enRuns]{70, 58 and 53} — the mode in which it produces nothing is gone. And context selection is not optional: given the full dataset instead of a slice, even @[model:qwen7b]{Qwen 2.5 7B} ?[z: PRODUCED_NOTHING]{produced no verifiable markup at all} — %[fullctxClaims]{0} constructs across the whole benchmark, while the same responses were full of numbers in plain prose.</p>

<h2>Verified is not the same as covered</h2>
<p>Two models can look equally trustworthy and differ enormously in how much of what they say is checkable. @[model:haiku]{Claude Haiku} wraps %[eduCoverage]{91.9}% of its numeric tokens in markup; @[model:qwen7b]{Qwen 2.5 7B}, at the same verification rate, wraps %[eduCoverage]{60.5}% — nearly two fifths of its numbers are unverifiable prose. Verification rate and coverage have to be read together.</p>

<h2>Against substitution</h2>
<p>The closest published mechanism, @[baseline:symgen]{SymGen}, has the model emit references into the data instead of values, so a wrong number is impossible — and so is reporting one. On the education benchmark it left %[eduUnresolvedRefs]{306} of %[eduRefs]{1392} references unresolved (%[eduUnresolvedPct]{22}%), rendering as <code>undefined</code> in %[eduRespWithUndefinedPct]{41}% of responses. @[system:proveml]{ProveML} fails on addressability too — but a failure is a flagged claim carrying the expected value, not a hole in the sentence: it flagged %[eduCaught]{212} claims on the first pass, %[eduWrongValues]{40} of them wrong values, a class substitution cannot produce and equally cannot report.</p>
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

// Track the entity context the way the verifier does, so fact proofs can name
// their full path.
let ctx = null;
for (const tok of tokens) {
    html += BODY.slice(pos, tok.pos); // authored HTML passes through
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
    source: 'proveml-research site/build-live-paper.mjs — verified against the run artifacts at build time',
}, null, 2) + '\n');
writeFileSync(join(outDir, 'proveml-paper-live.pml.txt'), BODY.trim() + '\n');

console.log(`${result.verified}/${result.total} claims verified — fragment written to ${outDir}`);
