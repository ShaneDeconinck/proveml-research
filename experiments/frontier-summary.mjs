#!/usr/bin/env node
/**
 * The August 2026 frontier runs, summarised from the artifacts.
 *
 * One table per benchmark, one row per model, aggregated over runs:
 * first-pass verification rate, rate after one correction, queries converged,
 * coverage (the verifier's own definition), and what the residual errors are.
 * Prints and writes nothing else; the paper's numbers are read from here.
 *
 * Usage: node experiments/frontier-summary.mjs [--tag frontier]
 */
import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { verifyProveml } from 'proveml/verify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const tag = argv.find((_, i) => argv[i - 1] === '--tag') || 'frontier';
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
const sd = (xs) => xs.length < 2 ? 0 : Math.sqrt(xs.reduce((s, v) => s + (v - mean(xs)) ** 2, 0) / (xs.length - 1));
const r1 = (x) => Number.isNaN(x) ? 'n/a' : (Math.round(x * 10) / 10).toFixed(1);

const groups = {};
for (const f of readdirSync(__dirname)) {
    const m = f.match(new RegExp(`^convergence-results-(finance-)?${tag}-(.+)-run(\\d+)\\.json$`));
    if (!m) continue;
    const doc = JSON.parse(readFileSync(join(__dirname, f), 'utf8'));
    const bench = m[1] ? 'finance' : 'education';
    ((groups[bench] ||= {})[doc.model] ||= []).push({ file: f, doc });
}

function stripTrailingPartialConstruct(text) {
    return text.replace(/[@%?]\[[^\]]*(\]\{[^}]*)?$/, '');
}

for (const [bench, models] of Object.entries(groups)) {
    console.log(`\n== ${bench} ==`);
    console.log('model'.padEnd(36), 'runs', 'first%'.padStart(11), 'final%'.padStart(11), 'conv'.padStart(6), 'cover%'.padStart(7), 'empty', 'noCorr', ' residual errors (addressability / value / other)');
    for (const [model, runs] of Object.entries(models)) {
        const first = [], final = [], conv = [];
        let marked = 0, unmarked = 0, empty = 0, failedCorrections = 0, n = 0;
        const residual = { reference: 0, value: 0, context: 0, other: 0 };
        for (const { doc } of runs) {
            const qs = doc.results.filter(Boolean);
            first.push(mean(qs.map(q => q.initialRate)));
            final.push(mean(qs.map(q => q.finalRate)));
            conv.push(qs.filter(q => q.converged).length);
            for (const q of qs) {
                n++;
                if (q.emptyResponse) empty++;
                if (q.steps.length === 1 && q.steps[0].errors > 0 && doc.maxLoops > 0) failedCorrections++;
                const c = verifyProveml(stripTrailingPartialConstruct(q.finalResponse || ''), {}).coverage;
                marked += c.marked; unmarked += c.unmarked;
                if (!q.converged) {
                    const last = q.steps[q.steps.length - 1];
                    for (const e of last.errorDetails || []) residual[e.errorClass in residual ? e.errorClass : 'other']++;
                }
            }
        }
        const cover = marked + unmarked ? 100 * marked / (marked + unmarked) : NaN;
        const resid = residual.reference + residual.value + residual.context + residual.other;
        const share = (k) => resid ? `${Math.round(100 * residual[k] / resid)}%` : '-';
        console.log(model.padEnd(36), String(runs.length).padStart(4),
            `${r1(mean(first))} ± ${r1(sd(first))}`.padStart(11), `${r1(mean(final))} ± ${r1(sd(final))}`.padStart(11),
            `${r1(mean(conv))}/${runs[0].doc.results.length}`.padStart(6), r1(cover).padStart(7),
            String(empty).padStart(5), String(failedCorrections).padStart(6),
            ` ${share('reference')} / ${share('value')} / ${resid ? Math.round(100 * (residual.context + residual.other) / resid) + '%' : '-'}  (n=${resid})`);
    }
}
console.log('\nfirst%/final%: mean over runs of the per-run mean verification rate (per query), ± sample sd over runs.');
console.log('conv: queries verifying every claim after at most one correction. cover%: numbers inside a claim / all numbers.');
console.log('noCorr: queries with errors where no correction was attempted or the call failed (should be 0).');
