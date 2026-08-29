#!/usr/bin/env node
/**
 * The numbers in the Deployment section, computed from the preserved runs.
 *
 * The tables regenerate from the artifacts (generate-paper-tables.mjs); the
 * Deployment paragraph did not, and two of its figures turned out to be stale
 * (a store size from the withdrawn dataset, a timing nobody could reproduce).
 * This script closes that gap: every figure in that paragraph is printed here,
 * with the scope it was computed over, so a re-run cannot leave one behind.
 *
 * Usage: node experiments/deployment-numbers.mjs
 * Reads: data/mastery-layers-demo.json, convergence-results-{model}-run{n}.json
 *        (Dutch education runs only: no en-, finance- or fullctx- prefix).
 */

import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { stripProveml, verifyProveml } from 'proveml/verify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (x) => Math.round(x * 100);

// ── Fact store: the same flattening as test-convergence.js ──
const ml = JSON.parse(readFileSync(join(__dirname, '../data/mastery-layers-demo.json'), 'utf8'));
const factStore = {};
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

// ── Runs ──
// --tag <t> selects a study: the default is the July 2026 local-model study
// (untagged Dutch education runs); `--tag frontier` the August 2026 runs.
const argv = process.argv.slice(2);
const tag = argv.find((_, i) => argv[i - 1] === '--tag') || '';
const pattern = tag
    ? new RegExp(`^convergence-results-${tag}-(.+)-run\\d\\.json$`)
    : /^convergence-results-(phi3:mini|qwen2\.5:3b|qwen2\.5:7b|haiku)-run\d\.json$/;
const runs = readdirSync(__dirname)
    .filter(f => pattern.test(f))
    .map(f => JSON.parse(readFileSync(join(__dirname, f), 'utf8')));
if (runs.length === 0) throw new Error(`No runs match ${pattern}`);
const byModel = {};
for (const r of runs) (byModel[r.model] ||= []).push(r);
const LOCAL = tag ? Object.keys(byModel) : ['phi3:mini', 'qwen2.5:3b', 'qwen2.5:7b'];
const STABLE = tag ? Object.keys(byModel) : ['qwen2.5:3b', 'qwen2.5:7b', 'haiku'];
const maxLoops = runs[0].maxLoops;

// ── Cost of verification: all stored final responses, verified once each ──
const responses = runs.flatMap(r => r.results.map(q => q.finalResponse || ''));
let claims = 0;
for (const text of responses) claims += verifyProveml(text, factStore).total; // warm-up + count
const REPS = 20;
const t0 = performance.now();
for (let i = 0; i < REPS; i++) for (const text of responses) verifyProveml(text, factStore);
const totalMs = (performance.now() - t0) / REPS;

console.log(`fact store: ${Object.keys(factStore).length} keys (${ml.offerings.length} offerings, ${ml.offerings.reduce((n, o) => n + o.students.length, 0)} students)`);
console.log(`verification: ${claims} claims in ${responses.length} responses (${runs.length} runs x ${runs[0].results.length} queries${tag ? `, tag ${tag}` : ''})`);
console.log(`  ${totalMs.toFixed(1)} ms per pass over all responses (mean of ${REPS}), ${(totalMs / responses.length).toFixed(3)} ms per response, ${(totalMs / claims).toFixed(4)} ms per claim`);

// ── Generation latency: sum of step times per query, local models ──
console.log(`generation latency (s per query, mean over queries and runs; sum of all loop steps, max ${maxLoops} correction pass${maxLoops === 1 ? '' : 'es'}):`);
for (const m of LOCAL) {
    const per = byModel[m].flatMap(r => r.results.map(q => q.steps.reduce((s, st) => s + (st.time || 0), 0)));
    console.log(`  ${m}: ${mean(per).toFixed(1)}`);
}

// ── Markup overhead: characters with markup vs stripped, pooled per model ──
console.log('markup overhead (pooled characters, marked-up vs stripped):');
for (const m of Object.keys(byModel)) {
    const texts = byModel[m].flatMap(r => r.results.map(q => q.finalResponse || ''));
    const withM = texts.reduce((s, t) => s + t.length, 0);
    const without = texts.reduce((s, t) => s + stripProveml(t).length, 0);
    console.log(`  ${m}: +${pct(withM / without - 1)}%`);
}

// ── Correction loop: convergence without a pass, exhaustion, generations ──
function loopStats(models) {
    const qs = models.flatMap(m => byModel[m].flatMap(r => r.results));
    const noPass = qs.filter(q => q.converged && q.loopsToConverge === 0).length / qs.length;
    const exhausted = qs.filter(q => !q.converged).length / qs.length;
    const generations = mean(qs.map(q => q.steps.length));
    return { n: qs.length, noPass: pct(noPass), exhausted: pct(exhausted), generations: generations.toFixed(2) };
}
if (tag) {
    for (const m of Object.keys(byModel)) console.log(`correction loop, ${m}: ${JSON.stringify(loopStats([m]))}`);
    console.log(`correction loop, all models: ${JSON.stringify(loopStats(Object.keys(byModel)))}`);
} else {
    console.log(`correction loop, three stable models (${STABLE.join(', ')}): ${JSON.stringify(loopStats(STABLE))}`);
    console.log(`correction loop, all four models: ${JSON.stringify(loopStats(Object.keys(byModel)))}`);
}
