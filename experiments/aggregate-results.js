#!/usr/bin/env node
/**
 * Aggregate multiple convergence runs per model.
 * Reports: mean, std dev, min, max for key metrics.
 *
 * Usage: node aggregate-results.js
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(__dirname).filter(f => f.match(/^convergence-results-.*-run\d+\.json$/));

if (files.length === 0) {
    console.log('No run files found. Run experiments first: ./run-experiments.sh');
    process.exit(1);
}

// Group by model
const byModel = {};
for (const f of files) {
    const data = JSON.parse(readFileSync(join(__dirname, f), 'utf8'));
    const key = data.model;
    if (!byModel[key]) byModel[key] = [];
    byModel[key].push(data);
}

function stats(values) {
    const n = values.length;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const sd = Math.sqrt(variance);
    return {
        mean: +mean.toFixed(1),
        sd: +sd.toFixed(1),
        min: +Math.min(...values).toFixed(1),
        max: +Math.max(...values).toFixed(1),
        n,
    };
}

console.log('═══════════════════════════════════════════════════');
console.log('  Aggregated Results');
console.log('═══════════════════════════════════════════════════\n');

const aggregate = {};

for (const [model, runs] of Object.entries(byModel).sort((a, b) => a[1][0].summary.avgInitial - b[1][0].summary.avgInitial)) {
    const initials = runs.map(r => r.summary.avgInitial);
    const finals = runs.map(r => r.summary.avgFinal);
    const converged = runs.map(r => r.summary.converged);
    const zeroShots = runs.map(r => r.summary.zeroShot);

    const s = {
        model,
        runs: runs.length,
        initial: stats(initials),
        final: stats(finals),
        converged: stats(converged),
        zeroShot: stats(zeroShots),
    };
    aggregate[model] = s;

    console.log(`  ${model} (${runs.length} runs)`);
    console.log(`    Initial:    ${s.initial.mean}% ± ${s.initial.sd}  [${s.initial.min}–${s.initial.max}]`);
    console.log(`    Final:      ${s.final.mean}% ± ${s.final.sd}  [${s.final.min}–${s.final.max}]`);
    console.log(`    Converged:  ${s.converged.mean}/28 ± ${s.converged.sd}  [${s.converged.min}–${s.converged.max}]`);
    console.log(`    Zero-shot:  ${s.zeroShot.mean}/28 ± ${s.zeroShot.sd}  [${s.zeroShot.min}–${s.zeroShot.max}]`);

    // Per-category breakdown across runs
    const cats = [...new Set(runs.flatMap(r => r.results.map(q => q.category)))];
    for (const cat of cats) {
        const catFinals = runs.map(r => {
            const catR = r.results.filter(q => q.category === cat);
            return catR.length > 0 ? Math.round(catR.reduce((s, q) => s + q.finalRate, 0) / catR.length) : 0;
        });
        const cs = stats(catFinals);
        console.log(`      ${cat}: ${cs.mean}% ± ${cs.sd}`);
    }
    console.log('');
}

console.log('═══════════════════════════════════════════════════');

// LaTeX-ready table
console.log('\nLaTeX table row format (mean ± sd):');
for (const [model, s] of Object.entries(aggregate)) {
    console.log(`  ${model} & ${s.initial.mean}\\% $\\pm$ ${s.initial.sd} & ${s.final.mean}\\% $\\pm$ ${s.final.sd} & ${s.converged.mean}/28 \\\\`);
}

writeFileSync(join(__dirname, 'aggregate-results.json'), JSON.stringify(aggregate, null, 2));
console.log('\nSaved to aggregate-results.json');
