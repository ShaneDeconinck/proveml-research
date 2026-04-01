#!/usr/bin/env node
/**
 * ProveML Finance Convergence Experiment
 *
 * Same methodology as test-convergence.js but against SEC EDGAR financial data.
 * Tests ProveML's domain-agnostic claim: real regulated data, unit-bearing quantities.
 *
 * Usage:
 *   node test-convergence-finance.js --provider ollama --model qwen2.5:7b --run 1
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { verifyProveml } from 'proveml/verify';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const maxLoops = parseInt(args.find((_, i) => args[i - 1] === '--max-loops') || '3');
const runId = args.find((_, i) => args[i - 1] === '--run') || '1';
const model = args.find((_, i) => args[i - 1] === '--model') || '';
const provider = args.find((_, i) => args[i - 1] === '--provider') || 'claude';

// Load SEC EDGAR data
const dataPath = join(__dirname, 'public/data/sec-edgar-finance.json');
const data = JSON.parse(readFileSync(dataPath, 'utf8'));

// Build fact store from SEC data
const factStore = {};
for (const c of data.companies) {
    factStore[`company:${c.id}.name`] = c.name;
    factStore[`company:${c.id}.cik`] = c.cik;
    for (const [key, val] of Object.entries(c)) {
        if (['id', 'name', 'cik'].includes(key)) continue;
        if (key.endsWith('._unit')) {
            factStore[`company:${c.id}.${key}`] = val;
        } else {
            factStore[`company:${c.id}.${key}`] = val;
        }
    }
}

// Verify using the real verifier
function verify(markdown) {
    const result = verifyProveml(markdown, factStore);
    result.rate = result.total > 0 ? Math.round(result.verified / result.total * 100) : 0;
    result.claims = result.total;
    result.hasMarkup = result.total > 0;
    return result;
}

// Build context for prompts
const companySummary = data.companies.map(c => ({
    id: c.id, name: c.name,
    revenue: c.revenue, revenue_unit: c['revenue._unit'],
    assets: c.assets, assets_unit: c['assets._unit'],
    liabilities: c.liabilities, liabilities_unit: c['liabilities._unit'],
    netIncome: c.netIncome, netIncome_unit: c['netIncome._unit'],
    eps: c.eps, eps_unit: c['eps._unit'],
    cash: c.cash, cash_unit: c['cash._unit'],
    equity: c.equity, equity_unit: c['equity._unit'],
    sharesOutstanding: c.sharesOutstanding, sharesOutstanding_unit: c['sharesOutstanding._unit'],
    longTermDebt: c.longTermDebt, longTermDebt_unit: c['longTermDebt._unit'],
    debtToEquity: c.debtToEquity,
    currentRatio: c.currentRatio,
}));
const companyByName = new Map(companySummary.map(c => [c.name, c]));

function buildPromptContext(spec) {
    const refs = [...(spec.context_refs || [])];
    const companies = refs.map(r => companyByName.get(r)).filter(Boolean);
    return { companies: companies.length > 0 ? companies : companySummary };
}

// LLM call
function callLLM(prompt) {
    const tmpFile = join(__dirname, '.tmp-convergence-finance.txt');
    writeFileSync(tmpFile, prompt);
    try {
        let cmd;
        if (provider === 'ollama') {
            cmd = `ollama run ${model} --nowordwrap < "${tmpFile}" 2>/dev/null`;
        } else {
            const modelFlag = model ? ` --model ${model}` : '';
            cmd = `cat "${tmpFile}" | claude -p${modelFlag}`;
        }
        return execSync(cmd, {
            encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 300000,
        }).trim();
    } catch (e) {
        console.error(`    LLM error: ${e.message.slice(0, 100)}`);
        return null;
    }
}

const benchmark = JSON.parse(readFileSync(join(__dirname, 'benchmarks/proveml-finance.v1.json'), 'utf8'));
const queries = benchmark.prompts;

const SYSTEM = `You are a financial analyst. Answer in ProveML markdown.
RULES:
- @[company:id]{exact name} for every company reference
- %[field]{value} for every number — MUST be preceded by @[company] (context carries forward)
- Include units where the data specifies them: %[revenue]{416161000000 USD}
- Use EXACT values from the data — do not round or approximate
- Keep it concise — focus on the data
- Do not wrap the answer in code fences or triple backticks

EXAMPLE OUTPUT:
@[company:aapl]{Apple Inc.} reported revenue of %[revenue]{416161000000 USD} with net income of %[netIncome]{112010000000 USD}.
@[company:msft]{Microsoft Corporation} earned %[eps]{13.7 USD/shares} per share.
`;

// Run
console.log('═══════════════════════════════════════════════════');
console.log('  ProveML Finance Convergence Experiment');
console.log(`  Provider: ${provider}, Model: ${model || '(default)'}, Max loops: ${maxLoops}, Run: ${runId}`);
console.log(`  Benchmark: ${benchmark.name} (${benchmark.version})`);
console.log(`  Snapshot: ${data.snapshot}`);
console.log('═══════════════════════════════════════════════════\n');

const results = [];

for (let qi = 0; qi < queries.length; qi++) {
    const { id, prompt, category, expected_mode: expectedMode } = queries[qi];
    const promptContext = buildPromptContext(queries[qi]);
    const promptContextJson = JSON.stringify(promptContext, null, 2);
    console.log(`Q${qi + 1} [${category}] ${id}`);
    console.log(`  "${prompt}"`);

    const t0 = Date.now();
    let response = callLLM(`${SYSTEM}\n\nDATA:\n${promptContextJson}\n\nQuestion: ${prompt}`);
    const genTime = ((Date.now() - t0) / 1000).toFixed(1);
    if (!response) { console.log('  ✗ Failed\n'); results.push(null); continue; }

    let v = verify(response);
    const steps = [{ loop: 0, verified: v.verified, total: v.total, errors: v.errors.length, rate: v.rate, time: +genTime }];
    console.log(`  Loop 0: ${v.verified}/${v.total} (${v.rate}%) — ${v.errors.length} errors [${genTime}s]`);

    for (let loop = 1; loop <= maxLoops && v.errors.length > 0; loop++) {
        const fixPrompt = `Your ProveML answer had ${v.errors.length} verification errors.

VERIFICATION ERRORS:
${v.errors.slice(0, 15).map(e => '- ' + e).join('\n')}

DATA:
${promptContextJson}

YOUR ANSWER TO CORRECT:
${response}

Fix the errors using the EXACT values from the data. Include units where specified. Return the FULL corrected answer with all @[...] and %[...] syntax.`;

        const tLoop = Date.now();
        const fixed = callLLM(fixPrompt);
        const loopTime = ((Date.now() - tLoop) / 1000).toFixed(1);
        if (!fixed) { console.log(`  Loop ${loop}: correction failed`); break; }

        const fv = verify(fixed);
        const better = fv.verified > v.verified || (fv.verified === v.verified && fv.errors.length < v.errors.length);
        const notWorse = fv.total >= v.total;
        const accepted = better && notWorse && fv.hasMarkup;

        if (accepted) { response = fixed; v = fv; }
        steps.push({ loop, verified: v.verified, total: v.total, errors: v.errors.length, rate: v.rate, time: +loopTime, accepted });
        console.log(`  Loop ${loop}: ${fv.verified}/${fv.total} (${fv.rate}%) → ${accepted ? '✓' : '✗'} [${loopTime}s]`);

        if (v.errors.length === 0) break;
    }

    const converged = v.errors.length === 0 && v.hasMarkup;
    const loopsToConverge = converged ? steps.length - 1 : null;
    results.push({
        query: qi + 1, id, category, expectedMode,
        converged, loopsToConverge,
        initialRate: steps[0].rate, finalRate: v.rate,
        initialClaims: steps[0].total, finalClaims: v.total,
        finalResponse: response.slice(0, 2000),
        steps,
    });

    const icon = converged ? '✅' : '⚠️';
    console.log(`  ${icon} ${steps[0].rate}% → ${v.rate}%${converged ? ` (converged in ${loopsToConverge})` : ''}\n`);
}

// Summary
const valid = results.filter(Boolean);
const conv = valid.filter(r => r.converged);
const avgInitial = valid.length > 0 ? Math.round(valid.reduce((s, r) => s + r.initialRate, 0) / valid.length) : 0;
const avgFinal = valid.length > 0 ? Math.round(valid.reduce((s, r) => s + r.finalRate, 0) / valid.length) : 0;
console.log('═══════════════════════════════════════════════════');
console.log('  Finance Results');
console.log('═══════════════════════════════════════════════════');
console.log(`  Queries:              ${valid.length}`);
console.log(`  Avg initial rate:     ${avgInitial}%`);
console.log(`  Avg final rate:       ${avgFinal}%`);
console.log(`  Converged to 100%:    ${conv.length}/${valid.length}`);
console.log('═══════════════════════════════════════════════════');

const outFile = join(__dirname, `convergence-results-finance-${model || 'default'}-run${runId}.json`);
writeFileSync(outFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    domain: 'finance',
    provider, model: model || 'default', run: +runId,
    maxLoops,
    benchmark: { name: benchmark.name, version: benchmark.version, snapshot: data.snapshot },
    results: valid,
    summary: { avgInitial, avgFinal, converged: conv.length, total: valid.length },
}, null, 2));
console.log(`\nSaved to ${outFile}`);
