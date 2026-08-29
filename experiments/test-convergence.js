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

import { callLLM as llmCall } from './llm.mjs';
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
const tag = args.find((_, i) => args[i - 1] === '--tag') || '';
const benchmarkPath = benchmarkArg
    ? join(__dirname, benchmarkArg)
    : join(__dirname, '../benchmarks/proveml-pilot.v1.json');

// Load data
// Only the generated dataset. The real one was withdrawn on 31 July 2026
// (EXPLORATIONS.md); a silent fallback to it would put figures derived from
// real pupil records into a run that looks like every other run.
const dataPath = join(__dirname, '../data/mastery-layers-demo.json');
if (!existsSync(dataPath)) {
    throw new Error(`Missing ${dataPath}: regenerate it with node data/generate-education-benchmark.mjs`);
}
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
    // Field names here are the store's field names: what the model sees is
    // what it can address. A context that said `students` while the store
    // said `studentCount` produced "field not found" on every model and
    // counted as a model error.
    return { id: o.id, name: o.name, stream: o.stream, studentCount: o.students.length, passRate: avg, evalRate: evAvg };
}).sort((a, b) => a.passRate - b.passRate);

const stuAll = [];
for (const o of ml.offerings) for (const s of o.students) stuAll.push({ ...s, offeringId: o.id, offering: o.name, stream: o.stream });
const struggling = stuAll.filter(s => s.ev >= 5).sort((a, b) => a.rate - b.rate).slice(0, 20)
    .map(s => ({ id: s.id, name: s.name, offeringId: s.offeringId, offering: s.offering, passed: s.pass, evaluated: s.ev, total: s.total, passRate: s.rate, absent: s.grijs || 0 }));

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

// LLM call: claude (CLI), ollama, or together; see llm.mjs
const model = args.find((_, i) => args[i - 1] === '--model') || '';
const provider = args.find((_, i) => args[i - 1] === '--provider') || 'claude';

// How long a single generation may take before we give up on it.
//
// This is a harness limit, not a measurement: a call that is killed at the wall
// clock leaves the query out of the run and quietly shrinks the denominator, so
// the number would then partly describe our patience. It is set well above the
// slowest observed generation (a small model rambling through a correction loop
// on a large slice) so that it fires only on a genuinely stuck call. Override
// with --timeout <seconds>.
const CALL_TIMEOUT_MS = (Number(args.find((_, i) => args[i - 1] === '--timeout')) || 900) * 1000;

let timedOut = 0;

function callLLM(prompt) {
    try {
        return llmCall(provider, model, prompt, { timeoutMs: CALL_TIMEOUT_MS, tmpFile: join(__dirname, '.tmp-convergence.txt') });
    } catch (e) {
        if (/ETIMEDOUT/.test(e.message)) timedOut++;
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
- A fact binds to the NEAREST preceding entity. If a sentence names a second entity before a fact (e.g. "Amir of 3BS has a pass rate of 53%"), write the fact with its own record: %[student:20414.passRate]{53}
- A threshold or cutoff from the question (e.g. "below 60%") is not a fact: do not write it as %[...]
- Use EXACT values from the data — do not round or approximate
- Keep it concise — focus on the data
- Do not wrap the answer in code fences or triple backticks

EXAMPLE OUTPUT:
@[offering:10004]{3BS} has %[studentCount]{8} students with a pass rate of %[passRate]{60}%.
@[student:20653]{Rune Verstraete} scored %[passRate]{0}% on %[evaluated]{6} attainment levels.
@[student:20414]{Amir Janssens} of @[offering:10056]{5OL} has a pass rate of %[student:20414.passRate]{53}% with %[student:20414.absent]{0} absences.
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
    const timedOutBefore = timedOut;
    const t0 = Date.now();
    let response = callLLM(`${SYSTEM}\n\nDATA:\n${promptContextJson}\n\nQuestion: ${prompt}`);
    const genTime = ((Date.now() - t0) / 1000).toFixed(1);
    // An empty answer is not a missing measurement, it is a model that produced
    // nothing verifiable — the extreme case of the zero-markup rule applied a few
    // lines down. Dropping it would shrink the denominator and flatter the model
    // that stayed silent. A call the harness killed at the wall clock is
    // different: there we have no answer at all, so that one is left out and
    // counted in timedOutCalls.
    if (!response) {
        const killed = timedOut > timedOutBefore;
        console.log(killed ? '  ✗ Call timed out — query left out\n' : '  ✗ Empty answer — scored 0%\n');
        if (killed) { results.push(null); continue; }
        results.push({
            query: qi + 1, id, category, expectedMode, contextMode,
            converged: false, loopsToConverge: null,
            initialRate: 0, finalRate: 0, initialClaims: 0, finalClaims: 0,
            initialErrorDetails: [], coverage: 0, emptyResponse: true,
            contextOfferings: promptContext.offerings.length,
            contextStudents: promptContext.strugglingStudents.length,
            finalResponse: '',
            steps: [{ loop: 0, verified: 0, total: 0, errors: 0, errorDetails: [], rate: 0, coverage: 0, time: +genTime }],
        });
        continue;
    }

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

// A model string may contain a slash (deepseek-ai/DeepSeek-V4-Pro-0813); the
// file name must not.
const modelSlug = model ? model.replace(/\//g, '_') : '';
const outFile = join(__dirname, `convergence-results${tag ? '-' + tag : ''}${modelSlug ? '-' + modelSlug : ''}-run${runId}.json`);
writeFileSync(outFile,
    JSON.stringify({
        timestamp: new Date().toISOString(),
        provider,
        model: model || 'default',
        run: +runId,
        maxLoops,
        contextMode,
        callTimeoutMs: CALL_TIMEOUT_MS,
        // Calls the harness killed at the wall clock. Any number above zero
        // means the run is missing queries and its denominator is short.
        timedOutCalls: timedOut,
        benchmark: {
            name: benchmark.name,
            version: benchmark.version,
            path: benchmarkArg || 'benchmarks/proveml-pilot.v1.json',
        },
        results: valid,
        summary: { avgInitial, avgFinal, converged: conv.length, total: valid.length, avgLoops, zeroShot, oneLoop, timedOutCalls: timedOut, emptyResponses: valid.filter(r => r.emptyResponse).length },
    }, null, 2));
console.log(`\nSaved to ${outFile}`);
