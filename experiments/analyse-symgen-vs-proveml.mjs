#!/usr/bin/env node
/**
 * SymGen baseline vs ProveML: the comparison behind Section 7.4 of the technical report.
 *
 * The two systems have different goals, so a single "which is better" number
 * would be dishonest. What IS comparable is what each mechanism does with the
 * same models, prompts and data:
 *
 *   binding coverage   how much of the numeric output is bound to the data at all
 *   resolution         do the paths the model chose exist in the store
 *   detected errors    what the mechanism can mechanically flag
 *   undetectable       what passes unnoticed by construction
 *
 * SymGen substitutes, so a resolved reference cannot carry a wrong value — its
 * value-error count is zero by design, and that is reported as its property,
 * not as a defeat. What it also cannot do is notice a wrong-but-resolvable
 * reference, or check a document it did not generate.
 *
 * Usage: node analyse-symgen-vs-proveml.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(__dirname);

const MODELS = ['phi3:mini', 'qwen2.5:3b', 'haiku', 'qwen2.5:7b'];
const DOMAINS = ['finance', 'education'];

// ── SymGen side ──

function symgenRuns(domain, model) {
    return files
        .filter(f => f.startsWith(`symgen-results-${domain}-${model}-run`) && f.endsWith('.json'))
        .map(f => JSON.parse(readFileSync(join(__dirname, f), 'utf8')));
}

function symgenStats(domain, model) {
    const runs = symgenRuns(domain, model);
    if (!runs.length) return null;
    const refs = runs.reduce((s, r) => s + r.summary.refs, 0);
    const resolved = runs.reduce((s, r) => s + r.summary.resolved, 0);
    const bound = runs.reduce((s, r) => s + r.summary.boundNumeric, 0);
    const free = runs.reduce((s, r) => s + r.summary.freeNumeric, 0);
    const noMarkup = runs.reduce((s, r) => s + r.summary.noMarkup, 0);
    const queries = runs.reduce((s, r) => s + r.summary.queries, 0);
    return {
        runs: runs.length, queries, refs,
        resolutionRate: refs ? +(100 * resolved / refs).toFixed(1) : 0,
        unresolved: refs - resolved,
        coverage: bound + free ? +(100 * bound / (bound + free)).toFixed(1) : 0,
        noMarkup,
    };
}

// ── ProveML side (same benchmarks, from the convergence artifacts) ──

function provemlRuns(domain, model) {
    const prefix = domain === 'finance'
        ? `convergence-results-finance-${model}-run`
        : `convergence-results-${model}-run`;
    return files
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .map(f => JSON.parse(readFileSync(join(__dirname, f), 'utf8')));
}

const FACT_RE = /%\[[^\]]*\]\{([^}]*)\}/g;
const ENTITY_RE = /@\[[^\]]*\]\{[^{}]*\}/g;
const INFERENCE_RE = /\?\[[^\]]*\]\{[^{}]*\}/g;
const NUM_TOKEN_RE = /(?<![A-Za-z0-9.,])\d+(?:[.,]\d+)*(?![A-Za-z0-9])/g;

function provemlCoverage(text) {
    text = text.replace(/[@%?]\[[^\]]*(\]\{[^}]*)?$/, '');
    let marked = 0;
    for (const m of text.matchAll(FACT_RE)) if (/\d/.test(m[1])) marked++;
    let prose = text.replace(FACT_RE, ' ').replace(INFERENCE_RE, ' ').replace(ENTITY_RE, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/^\s*\d+[.)]\s/gm, ' ')
        .replace(/\bFY\s?(19|20)\d{2}\b/g, ' ')
        .replace(/\b(19|20)\d{2}\b/g, ' ');
    return { marked, unmarked: [...prose.matchAll(NUM_TOKEN_RE)].length };
}

function provemlStats(domain, model) {
    const runs = provemlRuns(domain, model);
    if (!runs.length) return null;
    let marked = 0, unmarked = 0, addr = 0, ctx = 0, value = 0, caught = 0, claims = 0, noMarkup = 0, queries = 0;
    for (const run of runs) {
        for (const r of run.results) {
            if (!r) continue;
            queries++;
            claims += r.finalClaims || 0;
            if (!r.finalClaims) noMarkup++;
            if (r.finalResponse) {
                const c = provemlCoverage(r.finalResponse);
                marked += c.marked; unmarked += c.unmarked;
            }
            // First-pass errors: what the mechanism CAUGHT. Residual errors
            // (after the loop) measure something else — what it could not
            // repair — and would undercount detection on benchmarks where the
            // loop fixes almost everything.
            const details = r.initialErrorDetails;
            if (details && details.length) {
                for (const e of details) {
                    const cls = e.errorClass || e.status;
                    if (cls === 'value') value++;
                    else if (cls === 'reference') addr++;
                    else if (cls === 'context') ctx++;
                }
                caught += details.length;
            } else {
                // The finance harness stored error counts but not their classes,
                // so those runs contribute to the total and not to the split.
                caught += (r.steps && r.steps[0] && r.steps[0].errors) || 0;
            }
        }
    }
    return {
        runs: runs.length, queries, claims,
        coverage: marked + unmarked ? +(100 * marked / (marked + unmarked)).toFixed(1) : 0,
        // reference (wrong path) and context (no entity binding) reported
        // separately: the paper's addressability counts are reference-only,
        // and printing them merged made the script disagree with the paper.
        caught, detectedAddressability: addr, detectedContext: ctx, detectedValue: value, noMarkup,
    };
}

function round1(x) {
    return Math.round((x + Number.EPSILON) * 10) / 10;
}

// ── Report ──

const table = [];
console.log('SymGen (reimplementation, Direct) vs ProveML — same models, prompts and data\n');

for (const domain of DOMAINS) {
    const rows = [];
    for (const model of MODELS) {
        const sg = symgenStats(domain, model);
        const pm = provemlStats(domain, model);
        if (!sg && !pm) continue;
        rows.push({ domain, model, symgen: sg, proveml: pm });
    }
    if (!rows.length) continue;

    console.log(`── ${domain} ──`);
    console.log('model         | SymGen cov | SymGen res | ProveML cov | ProveML caught on first pass');
    for (const r of rows) {
        const s = r.symgen, p = r.proveml;
        console.log(
            `${r.model.padEnd(13)} | ${s ? (s.coverage + '%').padStart(10) : '        —'} ` +
            `| ${s ? (s.resolutionRate + '%').padStart(10) : '         —'} ` +
            `| ${p ? (p.coverage + '%').padStart(11) : '          —'} ` +
            `| ${p ? String(p.caught).padStart(6) + (p.detectedAddressability + p.detectedContext + p.detectedValue ? ` (${p.detectedAddressability} addr, ${p.detectedContext} ctx, ${p.detectedValue} val)` : '') : '—'}`
        );
    }
    console.log();
    table.push(...rows);
}

// Aggregate statements the paper can make.
const agg = {};
for (const domain of DOMAINS) {
    const rows = table.filter(r => r.domain === domain && r.symgen && r.proveml);
    if (!rows.length) continue;
    agg[domain] = {
        // Round half away from zero: toFixed(1) on 85.85 yields "85.8" because
        // the value is stored as 85.8499…, which silently understates a column.
        symgenCoverage: round1(rows.reduce((s, r) => s + r.symgen.coverage, 0) / rows.length),
        provemlCoverage: round1(rows.reduce((s, r) => s + r.proveml.coverage, 0) / rows.length),
        symgenUnresolved: rows.reduce((s, r) => s + r.symgen.unresolved, 0),
        symgenRefs: rows.reduce((s, r) => s + r.symgen.refs, 0),
        provemlDetected: rows.reduce((s, r) => s + r.proveml.caught, 0),
        provemlValueErrors: rows.reduce((s, r) => s + r.proveml.detectedValue, 0),
    };
}

console.log('── what each mechanism can say ──\n');
for (const [domain, a] of Object.entries(agg)) {
    console.log(`${domain}:`);
    console.log(`  binding coverage      SymGen ${a.symgenCoverage}%  vs  ProveML ${a.provemlCoverage}%`);
    console.log(`  SymGen unresolved     ${a.symgenUnresolved}/${a.symgenRefs} references rendered as "undefined"`);
    console.log(`  ProveML caught        ${a.provemlDetected} claims on first pass, of which ${a.provemlValueErrors} were wrong values`);
    console.log(`  SymGen value errors   0 by construction — and 0 detectable, including wrong-but-resolvable paths`);
    console.log();
}

writeFileSync(join(__dirname, 'symgen-vs-proveml.json'),
    JSON.stringify({ perModel: table, aggregate: agg }, null, 2));
console.log('Saved to symgen-vs-proveml.json');
