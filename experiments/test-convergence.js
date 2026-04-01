#!/usr/bin/env node
/**
 * ProveML Convergence Experiment
 *
 * Measures: how many verify-fix iterations does the LLM need to reach
 * 100% verification? This tests the core value of the loop.
 *
 * The baseline comparison is implicit: without ProveML, you cannot
 * automate this check at all. That IS the contribution.
 *
 * Usage:
 *   node test-convergence.js
 *   node test-convergence.js --max-loops 5
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { verifyProveml } from 'proveml/verify';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const maxLoops = parseInt(args.find((_, i) => args[i - 1] === '--max-loops') || '3');
const benchmarkArg = args.find((_, i) => args[i - 1] === '--benchmark');
const contextMode = args.find((_, i) => args[i - 1] === '--context-mode') || 'slice';
const runId = args.find((_, i) => args[i - 1] === '--run') || '1';
const benchmarkPath = benchmarkArg
    ? join(__dirname, benchmarkArg)
    : join(__dirname, 'benchmarks/proveml-pilot.v1.json');

// Load data
const demoPath = join(__dirname, 'public/data/mastery-layers-demo.json');
const realPath = join(__dirname, 'public/data/mastery-layers.json');
const dataPath = existsSync(demoPath) ? demoPath : realPath;
const ml = JSON.parse(readFileSync(dataPath));

// Build fact store
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

// Verify using the real verifier (not regex shortcuts)
function verify(markdown) {
    const result = verifyProveml(markdown, factStore);
    // Rate is 0 if no markup at all (not 100 — zero markup is a failure)
    result.rate = result.total > 0 ? Math.round(result.verified / result.total * 100) : 0;
    result.claims = result.total;
    result.hasMarkup = result.total > 0;
    return result;
}

// Build data context (same as server.js)
const offSummary = ml.offerings.map(o => {
    const avg = o.students.length ? Math.round(o.students.reduce((s, st) => s + st.rate, 0) / o.students.length) : 0;
    const evAvg = o.students.length ? Math.round(o.students.reduce((s, st) => s + (st.total ? st.ev / st.total * 100 : 0), 0) / o.students.length) : 0;
    return { id: o.id, name: o.name, stream: o.stream, students: o.students.length, passRate: avg, evalRate: evAvg };
}).sort((a, b) => a.passRate - b.passRate);

const stuAll = [];
for (const o of ml.offerings) for (const s of o.students) stuAll.push({ ...s, offeringId: o.id, offering: o.name, stream: o.stream });
const struggling = stuAll.filter(s => s.ev >= 5).sort((a, b) => a.rate - b.rate).slice(0, 20)
    .map(s => ({ id: s.id, name: s.name, offeringId: s.offeringId, offering: s.offering, passed: s.pass, evaluated: s.ev, total: s.total, rate: s.rate, absent: s.grijs || 0 }));

const FULL_CONTEXT = { offerings: offSummary, strugglingStudents: struggling };
const offeringByName = new Map(offSummary.map(o => [o.name, o]));
const studentByName = new Map(struggling.map(s => [s.name, s]));

function uniqueById(items) {
    const seen = new Set();
    return items.filter(item => {
        if (!item || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}

function buildPromptContext(spec) {
    if (contextMode === 'full') {
        return FULL_CONTEXT;
    }

    const refs = [...(spec.must_reference || []), ...(spec.context_refs || [])];
    const offerings = [];
    const students = [];

    for (const ref of refs) {
        if (offeringByName.has(ref)) offerings.push(offeringByName.get(ref));
        if (studentByName.has(ref)) students.push(studentByName.get(ref));
    }

    // Student prompts benefit from a little local offering context too.
    if ((spec.context_source === 'strugglingStudents' || spec.context_source === 'unsupported') && students.length > 0) {
        for (const student of students) {
            if (offeringByName.has(student.offering)) {
                offerings.push(offeringByName.get(student.offering));
            }
        }
    }

    const sliced = {
        offerings: uniqueById(offerings),
        strugglingStudents: uniqueById(students),
    };

    // If slicing produced an empty context, keep a minimal schema instead of falling back silently.
    return sliced;
}

// LLM call — supports both claude -p and ollama
const model = args.find((_, i) => args[i - 1] === '--model') || '';
const provider = args.find((_, i) => args[i - 1] === '--provider') || 'claude';

function callLLM(prompt) {
    const tmpFile = join(__dirname, '.tmp-convergence.txt');
    writeFileSync(tmpFile, prompt);
    try {
        let cmd;
        if (provider === 'ollama') {
            // Ollama: use the ollama run command
            cmd = `ollama run ${model} --nowordwrap < "${tmpFile}" 2>/dev/null`;
        } else {
            // Claude CLI
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

const benchmark = JSON.parse(readFileSync(benchmarkPath, 'utf8'));
const queries = benchmark.prompts;

const SYSTEM = `You are a curriculum analytics expert. Answer in ProveML markdown.
RULES:
- @[entity_type:id]{exact name} for every entity reference
- %[field]{value} for every number — MUST be preceded by @[entity] (context carries forward until a new entity is declared)
- Use EXACT values from the data — do not round or approximate
- Keep it concise — focus on the data
- Do not wrap the answer in code fences or triple backticks

EXAMPLE OUTPUT:
@[offering:10212]{3BW} has %[studentCount]{8} students with a pass rate of %[passRate]{41}%.
@[student:10217]{Manon Maes} scored %[passRate]{10}% on %[evaluated]{56} attainment levels.
`;

// Run
console.log('═══════════════════════════════════════════════════');
console.log('  ProveML Convergence Experiment');
console.log(`  Provider: ${provider}, Model: ${model || '(default)'}, Max loops: ${maxLoops}`);
console.log(`  Context mode: ${contextMode}`);
console.log(`  Benchmark: ${benchmark.name} (${benchmark.version})`);
console.log('═══════════════════════════════════════════════════\n');

const results = [];

for (let qi = 0; qi < queries.length; qi++) {
    const { id, prompt, category, expected_mode: expectedMode } = queries[qi];
    const promptContext = buildPromptContext(queries[qi]);
    const promptContextJson = JSON.stringify(promptContext, null, 2);
    console.log(`Q${qi + 1} [${category}/${expectedMode}] ${id}`);
    console.log(`  "${prompt}"`);
    console.log(`  context: ${promptContext.offerings.length} offerings, ${promptContext.strugglingStudents.length} students`);

    // Initial generation
    const t0 = Date.now();
    let response = callLLM(`${SYSTEM}\n\nDATA:\n${promptContextJson}\n\nQuestion: ${prompt}`);
    const genTime = ((Date.now() - t0) / 1000).toFixed(1);
    if (!response) { console.log('  ✗ Failed\n'); results.push(null); continue; }

    let v = verify(response);
    const errorDetails = v.details ? v.details.filter(d => d.status !== 'verified').map(d => ({ status: d.status, errorClass: d.errorClass, path: d.path, field: d.field, expected: d.expected })) : [];
    const steps = [{ loop: 0, verified: v.verified, total: v.total, errors: v.errors.length, errorDetails, rate: v.rate, time: +genTime }];
    console.log(`  Loop 0: ${v.verified}/${v.total} (${v.rate}%) — ${v.errors.length} errors [${genTime}s]`);

    // Correction loops
    for (let loop = 1; loop <= maxLoops && v.errors.length > 0; loop++) {
        const fixPrompt = `Your ProveML answer had ${v.errors.length} verification errors. The verifier checked each @[entity] name and %[field]{value} against the data and found mismatches.

VERIFICATION ERRORS (from deterministic verifier):
${v.errors.slice(0, 15).map(e => '- ' + e).join('\n')}

DATA (use these exact values):
${promptContextJson}

YOUR ANSWER TO CORRECT:
${response}

Fix the errors using the EXACT values from the data. Return the FULL corrected answer with all @[...] and %[...] syntax.`;

        const tLoop = Date.now();
        const fixed = callLLM(fixPrompt);
        const loopTime = ((Date.now() - tLoop) / 1000).toFixed(1);
        if (!fixed) { console.log(`  Loop ${loop}: correction failed`); break; }

        const fv = verify(fixed);
        // Accept correction only if it improves verification WITHOUT dropping claims.
        const better = fv.verified > v.verified ||
            (fv.verified === v.verified && fv.errors.length < v.errors.length);
        const notWorse = fv.total >= v.total;
        const accepted = better && notWorse && fv.hasMarkup;

        // Log candidate vs current, whether accepted, and why
        const reason = !fv.hasMarkup ? 'no-markup'
            : !better ? 'not-better'
            : !notWorse ? 'claims-dropped'
            : 'accepted';

        if (accepted) { response = fixed; v = fv; }

        const loopErrorDetails = fv.details ? fv.details.filter(d => d.status !== 'verified').map(d => ({ status: d.status, errorClass: d.errorClass, path: d.path, field: d.field, expected: d.expected })) : [];
        steps.push({ loop, verified: v.verified, total: v.total, errors: v.errors.length, errorDetails: accepted ? loopErrorDetails : errorDetails, rate: v.rate, time: +loopTime,
            candidate: { verified: fv.verified, total: fv.total, rate: fv.rate, errorDetails: loopErrorDetails }, accepted, reason });
        console.log(`  Loop ${loop}: ${fv.verified}/${fv.total} (${fv.rate}%) → ${accepted ? '✓ accepted' : '✗ ' + reason} [${loopTime}s]`);

        if (v.errors.length === 0) break;
    }

    const converged = v.errors.length === 0 && v.hasMarkup;
    const loopsToConverge = converged ? steps.length - 1 : null;
    results.push({
        query: qi + 1,
        id,
        category,
        expectedMode,
        contextMode,
        converged,
        loopsToConverge,
        initialRate: steps[0].rate,
        finalRate: v.rate,
        initialClaims: steps[0].total,
        finalClaims: v.total,
        initialErrorDetails: steps[0].errorDetails,
        contextOfferings: promptContext.offerings.length,
        contextStudents: promptContext.strugglingStudents.length,
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
const avgLoops = conv.length > 0 ? (conv.reduce((s, r) => s + r.loopsToConverge, 0) / conv.length).toFixed(1) : 'N/A';
const zeroShot = valid.filter(r => r.loopsToConverge === 0).length;
const oneLoop = valid.filter(r => r.loopsToConverge !== null && r.loopsToConverge <= 1).length;

console.log('═══════════════════════════════════════════════════');
console.log('  Results');
console.log('═══════════════════════════════════════════════════');
console.log(`  Queries:              ${valid.length}`);
console.log(`  Avg initial rate:     ${avgInitial}%`);
console.log(`  Avg final rate:       ${avgFinal}%`);
console.log(`  Converged to 100%:    ${conv.length}/${valid.length}`);
console.log(`  Avg loops to 100%:    ${avgLoops}`);
console.log(`  Perfect on first try: ${zeroShot}/${valid.length}`);
console.log(`  ≤1 loop sufficient:   ${oneLoop}/${valid.length}`);

// Per-category breakdown
console.log('\n  Per category:');
const cats = [...new Set(valid.map(r => r.category))];
for (const cat of cats) {
    const catR = valid.filter(r => r.category === cat);
    const catInit = Math.round(catR.reduce((s, r) => s + r.initialRate, 0) / catR.length);
    const catFinal = Math.round(catR.reduce((s, r) => s + r.finalRate, 0) / catR.length);
    const catConv = catR.filter(r => r.converged).length;
    console.log(`    ${cat}: ${catInit}% → ${catFinal}% (${catConv}/${catR.length} converged)`);
}

console.log('═══════════════════════════════════════════════════');

const outFile = join(__dirname, `convergence-results${model ? '-' + model : ''}-run${runId}.json`);
writeFileSync(outFile,
    JSON.stringify({
        timestamp: new Date().toISOString(),
        provider,
        model: model || 'default',
        run: +runId,
        maxLoops,
        contextMode,
        benchmark: {
            name: benchmark.name,
            version: benchmark.version,
            path: benchmarkArg || 'benchmarks/proveml-pilot.v1.json',
        },
        results: valid,
        summary: { avgInitial, avgFinal, converged: conv.length, total: valid.length, avgLoops, zeroShot, oneLoop },
    }, null, 2));
console.log(`\nSaved to ${outFile}`);
