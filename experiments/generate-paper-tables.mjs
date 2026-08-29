#!/usr/bin/env node
/**
 * Emit the paper's data tables as LaTeX, straight from the run artifacts.
 *
 * The paper says every table regenerates from the preserved runs. This is what
 * makes that literally true: the rows below are computed, not transcribed, so a
 * re-run cannot leave a stale number behind in the manuscript.
 *
 * Usage:
 *   node experiments/generate-paper-tables.mjs            # all tables
 *   node experiments/generate-paper-tables.mjs --dir <d>  # read runs from elsewhere
 *
 * Reads convergence-results-*.json, symgen-results-*.json and coverage-audit.json.
 * Writes nothing: paste the output into paper/proveml-spec.tex and paper/proveml-technical-report.tex, or diff it
 * against what is already there.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const dir = argv.find((_, i) => argv[i - 1] === '--dir') || __dirname;

const LABEL = {
    'phi3:mini': 'Phi-3 Mini (3.8B)',
    'qwen2.5:3b': 'Qwen 2.5 3B',
    'qwen2.5:7b': 'Qwen 2.5 7B',
    'haiku': 'Claude Haiku',
};

// ── helpers ──

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
/** Sample sd: three runs are a sample, not a population. */
const sd = (xs) => xs.length < 2 ? 0
    : Math.sqrt(xs.reduce((s, v) => s + (v - mean(xs)) ** 2, 0) / (xs.length - 1));
const r1 = (x) => (Math.round((x + Number.EPSILON) * 10) / 10).toFixed(1).replace(/\.0$/, '');
// Spreads keep their trailing zero (± 3.0, not ± 3): the paper's tables use one
// decimal for every sd, and the generator has to produce rows that match them
// byte for byte — that equality is the whole point of generating them.
const sd1 = (x) => (Math.round((x + Number.EPSILON) * 10) / 10).toFixed(1);

function load(pattern) {
    const groups = {};
    for (const f of readdirSync(dir)) {
        const m = f.match(pattern);
        if (!m) continue;
        const data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
        (groups[data.model] ||= []).push(data);
    }
    return groups;
}

/**
 * Residual error classes: the errors still standing after the last correction
 * loop, on the queries that never converged, averaged over runs.
 *
 * Counted per error rather than per query, which means a single wrong entity id
 * that cascades into several field-not-found errors is counted several times.
 * That inflates the addressability share, and the paper says so where it reads
 * the numbers. The alternative — one vote per query — understates a failure mode
 * that genuinely produces more broken claims per mistake.
 */
function residualClasses(runs) {
    const perRun = runs.map(run => {
        const counts = { reference: 0, value: 0, context: 0 };
        for (const q of run.results) {
            if (!q || q.converged) continue;
            const last = q.steps[q.steps.length - 1];
            for (const e of last.errorDetails || []) {
                if (e.errorClass in counts) counts[e.errorClass]++;
            }
        }
        return counts;
    });
    // Rounded first, then shared out, so the printed counts and the printed
    // percentages describe the same numbers.
    const avg = (k) => Math.round(mean(perRun.map(c => c[k])));
    const total = avg('reference') + avg('value') + avg('context');
    const cell = (k) => total === 0 ? '0' : `${avg(k)} (${Math.round(avg(k) / total * 100)}\\%)`;
    return { addr: cell('reference'), value: cell('value'), context: cell('context') };
}

function rows(groups, { withClasses = false } = {}) {
    return Object.entries(groups)
        .map(([model, runs]) => {
            const initial = runs.map(r => r.summary.avgInitial);
            const final = runs.map(r => r.summary.avgFinal);
            const conv = runs.map(r => r.summary.converged);
            const n = runs[0].summary.total;
            const cls = withClasses ? residualClasses(runs) : null;
            return {
                model, sortKey: mean(initial),
                cells: [
                    LABEL[model] || model,
                    `${Math.round(mean(initial))}\\% $\\pm$ ${sd1(sd(initial))}`,
                    `${Math.round(mean(final))}\\% $\\pm$ ${sd1(sd(final))}`,
                    `${r1(mean(conv))}/${n}`,
                    ...(cls ? [cls.addr, cls.value] : []),
                ],
            };
        })
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(r => `    ${r.cells.join(' & ')} \\\\`)
        .join('\n');
}

// ── coverage, from the audit ──

function coverage() {
    const path = join(dir, 'coverage-audit.json');
    if (!existsSync(path)) return {};
    const out = {};
    for (const row of JSON.parse(readFileSync(path, 'utf8')).rows) {
        out[`${row.benchmark}|${row.model}`] = row.marked + row.unmarked === 0
            ? null
            : row.marked / (row.marked + row.unmarked) * 100;
    }
    return out;
}

// ── output ──

const edu = load(/^convergence-results-([a-z0-9.:]+)-run\d+\.json$/);
const fin = load(/^convergence-results-finance-/);
const en = load(/^convergence-results-en-/);
const full = load(/^convergence-results-fullctx-/);
const cov = coverage();

console.log('%% Table: capability (education, Dutch prompts)  — tab:capability');
console.log(rows(edu, { withClasses: true }));

console.log('\n%% Table: finance — tab:finance');
console.log(rows(fin));

console.log('\n%% Table: language ablation — tab:langablation');
{
    const both = Object.keys(edu).filter(m => en[m]);
    const line = both.map(m => {
        const nl = edu[m].map(r => r.summary.avgInitial);
        const eng = en[m].map(r => r.summary.avgInitial);
        const cNl = cov[`education|${m}`], cEn = cov[`education-en|${m}`];
        return `    ${LABEL[m] || m} & ${Math.round(mean(nl))}\\% $\\pm$ ${sd1(sd(nl))} & ${Math.round(mean(eng))}\\% $\\pm$ ${sd1(sd(eng))}`
            + ` & ${cNl == null ? '--' : r1(cNl) + '\\%'} & ${cEn == null ? '--' : r1(cEn) + '\\%'} \\\\`;
    });
    console.log(line.sort().join('\n'));
}

console.log('\n%% Full-context ablation (1 run per local model)');
for (const [m, runs] of Object.entries(full)) {
    const claims = runs.map(r => r.results.filter(Boolean).reduce((s, q) => s + q.initialClaims, 0));
    console.log(`%%   ${LABEL[m] || m}: ${r1(mean(runs.map(r => r.summary.avgInitial)))}\\% verification, `
        + `${r1(mean(claims))} claims produced across the benchmark`);
}

console.log('\n%% Table: coverage — tab:coverage (education & finance columns)');
{
    const order = ['phi3:mini', 'haiku', 'qwen2.5:3b', 'qwen2.5:7b'];
    for (const m of order) {
        const edu = cov[`education|${m}`], fin = cov[`finance|${m}`];
        if (edu == null && fin == null) continue;
        console.log(`    ${LABEL[m] || m} & ${edu == null ? '--' : r1(edu) + '\\%'} & ${fin == null ? '--' : r1(fin) + '\\%'} \\\\`);
    }
}

console.log('\n%% Coverage, all cells — tab:coverage');
for (const [key, value] of Object.entries(cov).sort()) {
    const [bench, model] = key.split('|');
    console.log(`%%   ${bench} · ${LABEL[model] || model}: ${value == null ? '--' : r1(value) + '%'}`);
}
