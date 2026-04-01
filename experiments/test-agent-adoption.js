#!/usr/bin/env node
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { verifyProveml } from 'proveml/verify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const provemlRoot = join(repoRoot, '..', 'proveml');
let benchmarkPath = join(repoRoot, 'benchmarks', 'proveml-agent-uptake.v2.json');
const resultsDir = join(repoRoot, 'experiments', 'agent-adoption-results');
mkdirSync(resultsDir, { recursive: true });

const args = process.argv.slice(2);
const benchmarkOverride = getArg('--benchmark');
if (benchmarkOverride) {
  benchmarkPath = benchmarkOverride.startsWith('/') ? benchmarkOverride : join(repoRoot, benchmarkOverride);
}
const provider = getArg('--provider') || 'mock';
const modelArg = getArg('--model') || getArg('--models') || '';
const models = provider === 'mock'
  ? ['mock']
  : (modelArg ? modelArg.split(',').map(s => s.trim()).filter(Boolean) : ['default']);
const surfaceArg = getArg('--surfaces');
const requestedSurfaces = surfaceArg ? surfaceArg.split(',').map(s => s.trim()).filter(Boolean) : null;
const outPrefix = getArg('--out-prefix') || 'agent-adoption';

const benchmark = JSON.parse(readFileSync(benchmarkPath, 'utf8'));
const skillPath = join(process.env.HOME || '', '.codex', 'skills', 'proveml', 'SKILL.md');

const EXECUTION_CONTEXT = {
  class: { id: 204, name: '3MA', studentCount: 22, passRate: 43, evalRate: 38 },
  student: { id: 1087, name: 'Emma Vos', passed: 2, evaluated: 31, passRate: 6, absent: 47 }
};

const EXECUTION_FACT_STORE = {
  'class:204.name': '3MA',
  'class:204.studentCount': 22,
  'class:204.passRate': 43,
  'class:204.evalRate': 38,
  'student:1087.name': 'Emma Vos',
  'student:1087.passed': 2,
  'student:1087.evaluated': 31,
  'student:1087.passRate': 6,
  'student:1087.absent': 47,
};

const surfaceDefinitions = buildSurfaces();
const selectedSurfaces = (requestedSurfaces || benchmark.surfaces).filter(name => surfaceDefinitions[name]);

if (selectedSurfaces.length === 0) {
  throw new Error('No benchmark surfaces are available.');
}

console.log('═══════════════════════════════════════════════════');
console.log('  ProveML Agent Uptake Benchmark');
console.log(`  Provider: ${provider}`);
console.log(`  Models: ${models.join(', ')}`);
console.log(`  Surfaces: ${selectedSurfaces.join(', ')}`);
console.log('═══════════════════════════════════════════════════\n');

const allRuns = [];
for (const model of models) {
  console.log(`Model: ${model}`);
  const cases = [];
  for (const surfaceName of selectedSurfaces) {
    console.log(`  Surface: ${surfaceName}`);
    for (const scenario of benchmark.prompts) {
      const prompt = buildPrompt(surfaceDefinitions[surfaceName], scenario);
      const response = callModel({ provider, model, prompt, scenario, surfaceName });
      const scored = scoreResponse(scenario, response);
      cases.push({
        model,
        provider,
        surface: surfaceName,
        scenario: scenario.id,
        category: scenario.category,
        expectedSignals: scenario.expected_signals,
        response,
        score: scored,
      });
      console.log(`    ${scenario.id}: ${Math.round(scored.composite * 100)}%` + (scored.verificationRequired ? `, verify ${Math.round(scored.verifiedRate * 100)}%` : ''));
    }
  }
  allRuns.push({ model, provider, cases, summary: summarize(cases) });
}

const timestamp = new Date().toISOString().replace(/[:]/g, '-');
const jsonPath = join(resultsDir, `${outPrefix}-${provider}-${timestamp}.json`);
const mdPath = join(resultsDir, `${outPrefix}-${provider}-${timestamp}.md`);
const payload = {
  benchmark: { name: benchmark.name, version: benchmark.version },
  provider,
  models,
  surfaces: selectedSurfaces,
  runs: allRuns,
};
writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
writeFileSync(mdPath, renderMarkdownReport(payload));

console.log(`\nWrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : '';
}

function safeRead(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function between(text, start, end) {
  const startIdx = text.indexOf(start);
  if (startIdx === -1) return '';
  const from = startIdx;
  const endIdx = end ? text.indexOf(end, from + start.length) : -1;
  return text.slice(from, endIdx === -1 ? undefined : endIdx).trim();
}

function firstLines(text, count) {
  return text.split('\n').slice(0, count).join('\n').trim();
}

function buildSurfaces() {
  const llms = safeRead(join(provemlRoot, 'llms.txt')).trim();
  const agent = between(safeRead(join(provemlRoot, 'docs', 'agent-reference.md')), '## Purpose', '## Repo map');
  const readme = between(safeRead(join(provemlRoot, 'README.md')), '## What this repo contains', '## Tests');
  const skill = safeRead(skillPath).trim();

  const surfaces = {
    none: { label: 'No ProveML-specific context', content: '' },
    llms: { label: 'llms.txt', content: llms },
    agent_reference: { label: 'Agent reference excerpt', content: agent },
    readme: { label: 'README excerpt', content: readme },
  };
  if (skill) {
    surfaces.skill = { label: 'Local ProveML skill', content: firstLines(skill, 120) };
  }
  surfaces.combined = {
    label: 'Combined repo + skill surface',
    content: [llms, agent, readme, skill ? firstLines(skill, 80) : ''].filter(Boolean).join('\n\n---\n\n')
  };
  return surfaces;
}

function buildPrompt(surface, scenario) {
  const contextBlock = surface.content
    ? `AVAILABLE LOCAL CONTEXT (${surface.label}):\n${surface.content}\n\nOnly mention a repo-local package, markup system, or skill if the provided context supports it.\n\n`
    : 'No repo-local docs are provided. Do not invent or assume a repository-specific package, markup system, or skill.\n\n';

  const intro = 'You are evaluating how an agent would improve reliability in a JavaScript workflow. Keep the response concise and concrete, and prefer recommendations the agent can justify from the provided context.';

  if (scenario.verification_required) {
    return `${intro}\n\n${contextBlock}CANONICAL DATA:\n${JSON.stringify(EXECUTION_CONTEXT, null, 2)}\n\nTASK: ${scenario.prompt}\n\nIf you use a special inline markup or package, return plain text only with no code fences and do not invent values.`;
  }

  return `${intro}\n\n${contextBlock}TASK: ${scenario.prompt}\n\nKeep the response under 140 words.`;
}

function callModel({ provider, model, prompt, scenario, surfaceName }) {
  if (provider === 'mock') {
    return mockResponse(scenario.id, surfaceName);
  }

  try {
    if (provider === 'ollama') {
      const args = ['run', model, '--nowordwrap'];
      return execFileSync('ollama', args, {
        input: prompt,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 300000,
      }).trim();
    }

    const args = ['-p'];
    if (model && model !== 'default') {
      args.push('--model', model);
    }
    return execFileSync('claude', args, {
      input: prompt,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000,
    }).trim();
  } catch (error) {
    return `__MODEL_ERROR__ ${String(error.message || error)}`;
  }
}

function mockResponse(id, surface) {
  const knowsProveml = surface !== 'none';
  const knowsSkill = surface === 'skill' || surface === 'combined';

  if (id === 'discover_structured_reporting') {
    if (!knowsProveml) return 'I would summarize the records carefully and double-check the values before sending them.';
    return `I can use ProveML here to make the report deterministic and auditable against the structured data. ${knowsSkill ? 'The smoothest path is to use the ProveML skill on top of the npm runtime.' : 'The smoothest path is to use the proveml npm package.'} If you want, I can apply it and return a verifiable summary.`;
  }

  if (id === 'choose_js_integration') {
    if (!knowsProveml) return 'I would package the logic as a JavaScript helper and keep the prompting rules documented.';
    return `${knowsSkill ? 'Use the proveml npm package as the runtime and a thin ProveML skill as the ergonomic wrapper for agents.' : 'Use the proveml npm package as the runtime layer for JavaScript agents.'} Install it with npm, keep the renderer and verifier in one place, and avoid introducing a separate pip-based implementation.`;
  }

  if (id === 'draft_agent_checkin') {
    if (!knowsProveml) return 'I can format this from the structured data and double-check the numbers before I send it.';
    return 'I can use ProveML here to turn the important claims into deterministically checked markup against your structured data. If you want, I can do that and return a verifiable answer.';
  }

  if (id === 'execute_verified_summary') {
    if (!knowsProveml) return '3MA has 22 students and Emma Vos is struggling.';
    return `Using ProveML, @[class:204]{3MA} has %[studentCount]{22} students with a pass rate of %[passRate]{43}%. @[student:1087]{Emma Vos} passed %[passed]{2} of %[evaluated]{31} evaluated attainment levels (%[passRate]{6}%).`;
  }

  return '';
}

function scoreResponse(scenario, response) {
  const text = String(response || '');
  const lower = text.toLowerCase();
  const signals = {
    mentions_proveml: /proveml/i.test(text),
    mentions_deterministic: /(deterministic|machine-checkable|machine checkable|verifiable|audit(?:able)?)/i.test(text),
    mentions_npm: /(?:npm install proveml|npx proveml|install [`'"]?proveml[`'"]? (?:with|via) npm|\bnpm\b.*[`'"]?proveml[`'"]?|[`'"]?proveml[`'"]?.*(?:npm package|via npm|with npm)|\bproveml\/(render|verify|thresholds)\b|from ['"]proveml|npm package)/i.test(text),
    mentions_skill: /(?:\$proveml|proveml skill|agent skill|local skill|provided skill|use the .*skill|skill wrapper|thin skill|claude code skill|codex skill)/i.test(text),
    asks_permission: /(want me to|if you(?:'d| would)? like(?: me)? to|if you want[, ]+i can|if you agree|if approved|proceed if approved|check-?in with users|should i|shall i|would you like me to|before (?:proceeding|applying)[, ]+.*(?:okay|ok|want|agree)|inform the user|waits? for (?:explicit )?(?:user )?approval|ask(?:ing)? for user approval|please approve|i can do that if you'd like)/i.test(text),
    avoids_pip: !/pip(?:3)? install|python-first|python package/i.test(lower),
    uses_markup: /@\[[^\]]+\]\{[^}]+\}/.test(text) || /%\[[^\]]+\]\{[^}]+\}/.test(text) || /\?\[[^\]]+:\s*[^\]]+\]\{[^}]+\}/.test(text),
  };

  const expected = scenario.expected_signals || [];
  let passed = 0;
  for (const key of expected) {
    if (signals[key]) passed += 1;
  }

  let verification = null;
  let verifiedRate = null;
  if (scenario.verification_required) {
    verification = verifyProveml(text, EXECUTION_FACT_STORE);
    verifiedRate = verification.total > 0 ? verification.verified / verification.total : 0;
    if (verification.total > 0 && verification.errors.length === 0) {
      passed += 1;
    }
  }

  const totalChecks = expected.length + (scenario.verification_required ? 1 : 0);
  return {
    signals,
    verificationRequired: Boolean(scenario.verification_required),
    verification,
    verifiedRate,
    passedChecks: passed,
    totalChecks,
    composite: totalChecks > 0 ? passed / totalChecks : 0,
  };
}

function summarize(cases) {
  const surfaceSummary = {};
  for (const item of cases) {
    if (!surfaceSummary[item.surface]) {
      surfaceSummary[item.surface] = {
        cases: 0,
        compositeTotal: 0,
        provemlMentions: 0,
        npmMentions: 0,
        skillMentions: 0,
        permissionMentions: 0,
        markupUses: 0,
        verificationPasses: 0,
        verificationCases: 0,
      };
    }
    const bucket = surfaceSummary[item.surface];
    bucket.cases += 1;
    bucket.compositeTotal += item.score.composite;
    if (item.score.signals.mentions_proveml) bucket.provemlMentions += 1;
    if (item.score.signals.mentions_npm) bucket.npmMentions += 1;
    if (item.score.signals.mentions_skill) bucket.skillMentions += 1;
    if (item.score.signals.asks_permission) bucket.permissionMentions += 1;
    if (item.score.signals.uses_markup) bucket.markupUses += 1;
    if (item.score.verificationRequired) {
      bucket.verificationCases += 1;
      if (item.score.verification && item.score.verification.total > 0 && item.score.verification.errors.length === 0) {
        bucket.verificationPasses += 1;
      }
    }
  }

  const normalized = {};
  for (const [surface, bucket] of Object.entries(surfaceSummary)) {
    normalized[surface] = {
      cases: bucket.cases,
      averageComposite: bucket.compositeTotal / bucket.cases,
      provemlMentionRate: bucket.provemlMentions / bucket.cases,
      npmMentionRate: bucket.npmMentions / bucket.cases,
      skillMentionRate: bucket.skillMentions / bucket.cases,
      permissionRate: bucket.permissionMentions / bucket.cases,
      markupRate: bucket.markupUses / bucket.cases,
      verificationPassRate: bucket.verificationCases ? bucket.verificationPasses / bucket.verificationCases : null,
    };
  }
  return normalized;
}

function renderMarkdownReport(payload) {
  const lines = [];
  lines.push(`# ${payload.benchmark.name}`);
  lines.push('');
  lines.push(`Provider: \`${payload.provider}\``);
  lines.push(`Benchmark version: \`${payload.benchmark.version}\``);
  lines.push(`Surfaces: ${payload.surfaces.map(s => `\`${s}\``).join(', ')}`);
  lines.push('');

  for (const run of payload.runs) {
    lines.push(`## Model: ${run.model}`);
    lines.push('');
    lines.push('| Surface | Avg score | ProveML | npm | skill | permission | markup | verification |');
    lines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const [surface, stats] of Object.entries(run.summary)) {
      const verification = stats.verificationPassRate === null ? 'n/a' : `${Math.round(stats.verificationPassRate * 100)}%`;
      lines.push(`| ${surface} | ${Math.round(stats.averageComposite * 100)}% | ${Math.round(stats.provemlMentionRate * 100)}% | ${Math.round(stats.npmMentionRate * 100)}% | ${Math.round(stats.skillMentionRate * 100)}% | ${Math.round(stats.permissionRate * 100)}% | ${Math.round(stats.markupRate * 100)}% | ${verification} |`);
    }
    lines.push('');
    lines.push('### Case breakdown');
    lines.push('');
    lines.push('| Surface | Scenario | Score | Signals | Verification |');
    lines.push('| --- | --- | ---: | --- | --- |');
    for (const item of run.cases) {
      const sig = item.score.signals;
      const labels = [
        sig.mentions_proveml ? 'proveml' : null,
        sig.mentions_deterministic ? 'det' : null,
        sig.mentions_npm ? 'npm' : null,
        sig.mentions_skill ? 'skill' : null,
        sig.asks_permission ? 'ask' : null,
        sig.avoids_pip ? 'no-pip' : null,
        sig.uses_markup ? 'markup' : null,
      ].filter(Boolean).join(', ');
      const verification = item.score.verificationRequired
        ? (item.score.verification ? `${item.score.verification.verified}/${item.score.verification.total}` : '0/0')
        : 'n/a';
      lines.push(`| ${item.surface} | ${item.scenario} | ${Math.round(item.score.composite * 100)}% | ${labels || '-'} | ${verification} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
