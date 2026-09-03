import { reviewPage, evidenceReviewId } from 'proveml/review-page';
import { buildManifest } from 'proveml/manifest';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
// A paragraph is addressed by what it says, not where it sits: its checks follow it
// through renumbering and rebuilds, and expire only when its text changes.
const pid = (text) => 'p' + createHash('sha256').update(String(text)).digest('hex').slice(0, 12);
import { auditStore, auditSnapshots, auditSubjects, auditTitles, referenceEvidence, auditCheck, htmlToText } from './audit-sources.mjs';
import { houseCss } from './house-css.mjs';
import { readFileSync as rf } from 'node:fs';
const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');   // the research repository
const AUDIT_RW = JSON.parse(rf(ROOT + '/audit/references/related-work-claims.json', 'utf8'));
const AUDIT_BY_KEY = Object.fromEntries(AUDIT_RW.map((c) => [c.id, c]));

// Paper 1, the whole paper, from the TeX adapter. Every block is a reading in
// order: headings, paragraphs, tables, listings. Blocks with checkable numbers
// get marks inserted into the paper's own sentences and their sources bound.
// Nothing is rewritten; nothing is dropped.
const read = (f) => readFileSync('report/sources/raw/' + f, 'utf8').trimEnd();
const snapshots = {
  benchmarks: read('benchmarks.txt'), dataset: read('dataset-meta.txt'), finance: read('finance.txt'),
  summary: read('frontier-summary.txt'), residuals: read('frontier-residuals.txt'),
  deployment: read('deployment-numbers.txt'), package: read('package.txt'), summary2: read('frontier2-summary.txt'),
  ...(existsSync('report/sources/raw/pdpp-students.txt') ? { 'pdpp-students': read('pdpp-students.txt') } : {}),
  magesh2025: htmlToText(read('magesh2025-arxiv.html')), liu2026citations: htmlToText(read('liu2026citations.html')), omnibus2026: htmlToText(read('omnibus2026.html')),
  ...auditSnapshots,
};

const store = {
  ...auditStore,
  'study:frontier.name': 'the frontier study', 'study:frontier.queryRuns': 342,
  'study:frontier.residualErrors': 157, 'study:frontier.bindingErrors': 108, 'study:frontier.bindingShare': 69,
  'study:frontier.bindingQueryRuns': 17, 'study:frontier.nonConverged': 35, 'study:frontier.wrongValues': 40, 'study:frontier.wrongShare': 25,
  'bench:education.name': 'the education benchmark', 'bench:education.prompts': 28, 'bench:education.pupils': 741, 'bench:education.offerings': 95, 'bench:education.synthetic': 'generated',
  'bench:finance.name': 'the finance benchmark', 'bench:finance.prompts': 10, 'bench:finance.entities': 2, 'bench:finance.fields': 11,
  'model:opus5.name': 'Claude Opus 5', 'model:opus5.eduFirst': 86.5, 'model:opus5.eduFinal': 94.8, 'model:opus5.eduCoverage': 91.4,
  'model:opus5.finFirst': 97.9, 'model:opus5.finFinal': 100, 'model:opus5.finCoverage': 95.8, 'model:opus5.latency': 11.8, 'model:opus5.overhead': 49, 'model:opus5.generations': 1.33,
  'model:sonnet5.name': 'Claude Sonnet 5', 'model:sonnet5.eduFirst': 89.3, 'model:sonnet5.eduFinal': 92.2, 'model:sonnet5.eduCoverage': 92.3,
  'model:sonnet5.finFirst': 96.5, 'model:sonnet5.finFinal': 96.5, 'model:sonnet5.finCoverage': 89.8, 'model:sonnet5.latency': 7.9, 'model:sonnet5.overhead': 66,
  'model:deepseek.name': 'DeepSeek V4 Pro', 'model:deepseek.eduFirst': 97.2, 'model:deepseek.eduFinal': 99.5, 'model:deepseek.eduCoverage': 94.2,
  'model:deepseek.finFirst': 100, 'model:deepseek.finFinal': 100, 'model:deepseek.finCoverage': 96.4, 'model:deepseek.latency': 3.4, 'model:deepseek.overhead': 79, 'model:deepseek.generations': 1.06,
  'deploy:frontier.name': 'the educational runs', 'deploy:frontier.claims': 2185, 'deploy:frontier.responses': 252, 'deploy:frontier.storeKeys': 4826,
  'deploy:frontier.msTotalClaimed': 3.4, 'deploy:frontier.msPerResponseClaimed': 0.013, 'deploy:frontier.usPerClaimClaimed': 1.5,
  'deploy:frontier.noCorrectionPct': 77, 'deploy:frontier.generations': 1.23,
  'impl:proveml.name': 'The reference implementation', 'impl:proveml.runtimeDeps': 'no',
  'reg:euaiact.name': 'the EU AI Act', 'reg:euaiact.appliedFrom': '2 August 2026',
  'reg:omnibus.name': 'the Digital Omnibus', 'reg:omnibus.deferredTo': '2 December 2026',
  'study:magesh.name': 'Magesh et al.', 'study:magesh.hallucinationRange': '17–33',
  'study:liu.name': 'Liu et al.', 'study:liu.filings': 'more than a thousand',
  'study:frontier.coverageRange': '90–96', 'study:frontier.firstPassRange': '87–100', 'study:frontier.correctedRange': '92–100',
  'deploy:frontier.overheadRange': '49–79',
  'study:frontier2.name': 'the second study', 'study:frontier2.firstPassRange': '95–100', 'study:frontier2.bindingErrors': 16,
  'model:opus5.edu2First': 95.4, 'model:opus5.edu2Final': 97.1, 'model:opus5.edu2Coverage': 97.9, 'model:opus5.fin2First': 100, 'model:opus5.fin2Final': 100, 'model:opus5.fin2Coverage': 98.2,
  'model:sonnet5.edu2First': 99.4, 'model:sonnet5.edu2Final': 99.4, 'model:sonnet5.edu2Coverage': 91.1, 'model:sonnet5.fin2First': 100, 'model:sonnet5.fin2Final': 100, 'model:sonnet5.fin2Coverage': 94.4,
  'model:deepseek.edu2First': 99.2, 'model:deepseek.edu2Final': 100, 'model:deepseek.edu2Coverage': 95.1, 'model:deepseek.fin2First': 100, 'model:deepseek.fin2Final': 100, 'model:deepseek.fin2Coverage': 97.6,
};

// The paper's literal ProveML examples must read as examples, never parse as
// claims. The adapter already emits \texttt and listings as code, which the
// verifier skips; this catches the rest (an example set in italics or quotes)
// by wrapping any construct that is not already inside backticks. It runs
// before marks are inserted, so the marks themselves are never touched.
const CONSTRUCT = /(@\[[^\]]*\]\{[^}]*\}|%\[[^\]]*\]\{[^}]*\}|\?\[[^\]]*\]\{[^}]*\})/g;
const neutralize = (t) => t.split(/(```[\s\S]*?```|`[^`\n]*`)/).map((part, i) =>
  i % 2 === 1 ? part : part.replace(CONSTRUCT, '`$1`')).join('');
const mark = (t, pairs, id) => {
  for (const [find, repl] of pairs) {
    const c = t.split(find).length - 1;
    if (c !== 1) { console.error(`MARK in ${id} not unique (${c}):`, JSON.stringify(find)); process.exit(4); }
    t = t.replace(find, repl);
  }
  return t;
};
// Every citation is a claim about another source, so every citation is a
// reading: the label the paper prints is the marked value, the archived
// quotes from the cited work are the evidence, and the sentence around the
// citation is what the reader judges the quotes against. No archived quote:
// the reading still exists, as an inference the author must stand behind.
const CITE = /\u27e6c:([^\u27e7]+)\u27e7([^\u27e6]*)\u27e6\/c\u27e7/g;
const sentenceAround = (text, idx) => {
  const a = Math.max(text.lastIndexOf('. ', idx), text.lastIndexOf('; ', idx), 0);
  const bEnd = text.indexOf('. ', idx); return text.slice(a ? a + 2 : 0, bEnd < 0 ? text.length : bEnd + 1).replace(/\u27e6c:[^\u27e7]*\u27e7|\u27e6\/c\u27e7/g, '').trim();
};
const citify = (text, blockId, evidence) => {
  const seen = new Set();
  return text.replace(CITE, (whole, key, label, offset) => {
    if (seen.has(key)) return label;
    seen.add(key);
    const field = 'citation:' + key + '.cited_' + String(blockId).replace(/[^A-Za-z0-9_]/g, '_');   // one reading per use of the work
    if (!store['citation:' + key + '.name']) store['citation:' + key + '.name'] = label;
    store[field] = label;
    const sent = sentenceAround(text, offset);
    const a = AUDIT_BY_KEY[key];
    const quotes = a ? a.evidence.filter((e) => e.basis === 'quote' && e.sourceQuote) : [];
    const absences = a ? a.evidence.filter((e) => e.basis === 'absence' && e.note).map((e) => e.note) : [];
    if (quotes.length) {
      evidence.push({ field, claimValue: label, basis: 'quote', source: 'cite-' + key,
        ...(quotes.length === 1 ? { sourceQuote: quotes[0].sourceQuote, sourceLocator: quotes[0].sourceLocator || 'archived copy of the cited work' } : { sourceQuotes: quotes.map((e) => ({ sourceQuote: e.sourceQuote, sourceLocator: e.sourceLocator || 'archived copy of the cited work' })) }),
        note: 'The paper uses this work for: "' + sent + '" Does the cited work support that?' + (absences.length ? ' ' + absences.join(' ') : '') });
    } else if (snapshots['cite-' + key]) {
      evidence.push({ field, claimValue: label, basis: 'derived', source: 'cite-' + key, note: 'The paper uses this work for: "' + sent + '" An archived copy exists but no passage was curated for this characterisation yet; read the source and confirm, or flag.' });
    } else {
      evidence.push({ field, claimValue: label, basis: 'derived', note: 'The paper uses this work for: "' + sent + '" No archived copy of the cited work; do you stand behind this characterisation, or should it be sourced?' });
    }
    return '%[' + field + ']{' + label + '}';
  });
};
const q = (field, claimValue, source, sourceQuote, sourceLocator, note) => ({ field, claimValue, basis: 'quote', source, sourceQuote, sourceLocator, ...(note ? { note } : {}) });
const d = (field, claimValue, source, note) => ({ field, claimValue, basis: 'derived', source, note });

// Bound blocks, located by a sentence of the paper, never by position.
const bound = [
  { anchor: 'Hallucination is structural', id: 'intro-regulation', marks: [
      ['since 2 August 2026', 'since %[reg:euaiact.appliedFrom]{2 August 2026}'],
      ['to 2 December 2026', 'to %[reg:omnibus.deferredTo]{2 December 2026}'],
      ['on 17–33% of queries', 'on %[study:magesh.hallucinationRange]{17–33}% of queries'],
      ['found more than a thousand containing', 'found %[study:liu.filings]{more than a thousand} containing'],
    ], evidence: [
      q('reg:euaiact.appliedFrom', '2 August 2026', 'cite-euaiact', 'From 2 August 2026', 'Commission press release of 31 July 2026, archived in the paper audit', 'The archived page is the Commission press release announcing the duties, not the Regulation text itself.'),
      q('reg:omnibus.deferredTo', '2 December 2026', 'omnibus2026', 'comply with Article 50(2) by 2 December 2026', 'Regulation (EU) 2026/1744, EUR-Lex, amended Article 113'),
      q('study:magesh.hallucinationRange', '17–33', 'magesh2025', 'each hallucinate between 17% and 33% of the time', 'arXiv 2405.20362 abstract', 'The abstract says "between 17% and 33% of the time"; the paper writes "17–33% of queries". Fair reading?'),
      q('study:liu.filings', 'more than a thousand', 'liu2026citations', 'we found over 1,000 filings containing fabricated citations', 'arXiv 2606.21155 abstract', 'The abstract says "over 1,000 filings"; the paper writes "more than a thousand". Fair?'),
    ] },
  { anchor: 'We evaluate three frontier models of August 2026', id: 'abstract-results', marks: [
      ['put 90–96% of their numbers inside a claim', 'put %[study:frontier.coverageRange]{90–96}% of their numbers inside a claim'],
      ['verify 87–100% of those claims on the first pass and 92–100% after one correction', 'verify %[study:frontier.firstPassRange]{87–100}% of those claims on the first pass and %[study:frontier.correctedRange]{92–100}% after one correction'],
      ['69% of the residual errors', '%[study:frontier.bindingShare]{69}% of the residual errors'],
      ['verify 95–100% of their claims on the first pass', 'verify %[study:frontier2.firstPassRange]{95–100}% of their claims on the first pass'],
    ], evidence: [
      d('study:frontier.coverageRange', '90–96', 'summary', 'Coverage in Table 2 runs from 89.8 (Sonnet 5, finance) to 96.4 (DeepSeek, finance); the abstract rounds the endpoints to 90–96. Fair to round?'),
      d('study:frontier.firstPassRange', '87–100', 'summary', 'First pass in Table 2 runs from 86.5 (Opus 5, education) to 100.0 (DeepSeek, finance); the abstract rounds 86.5 up to 87. Fair to round?'),
      d('study:frontier.correctedRange', '92–100', 'summary', 'After one correction, Table 2 runs from 92.2 (Sonnet 5, education) to 100.0; rounded to 92–100.'),
      d('study:frontier.bindingShare', '69', 'residuals', '108 of 157 residual errors are binding errors: 68.8%, written 69%.'),
      d('study:frontier2.firstPassRange', '95–100', 'summary2', 'Second study first pass runs from 95.4 (Opus 5, education) to 100.0 (all three on finance); rounded to 95–100.'),
    ] },
  { anchor: 'What it requires, costs and cannot do', id: 'abstract-costs', marks: [
      ['ran 49–79% longer in characters', 'ran %[deploy:frontier.overheadRange]{49–79}% longer in characters'],
    ], evidence: [
      d('deploy:frontier.overheadRange', '49–79', 'deployment', 'Markup overhead per model: +49% (Opus 5), +66% (Sonnet 5), +79% (DeepSeek); the abstract states the range.'),
    ] },
  { anchor: 'says that the mechanism is within reach of current models', id: 'conclusion-results', marks: [
      ['cover 90–96% of their numbers with claims, and verify 92–100% of those claims after one correction', 'cover %[study:frontier.coverageRange]{90–96}% of their numbers with claims, and verify %[study:frontier.correctedRange]{92–100}% of those claims after one correction'],
    ], evidence: [
      d('study:frontier.coverageRange', '90–96', 'summary', 'Coverage endpoints 89.8 and 96.4 in Table 2, rounded.'),
      d('study:frontier.correctedRange', '92–100', 'summary', 'After-correction endpoints 92.2 and 100.0 in Table 2, rounded.'),
    ] },
  { anchor: 'Three models that were frontier', id: 'setup', marks: [
      ['Claude Opus 5 and Claude Sonnet 5', '@[model:opus5]{Claude Opus 5} and @[model:sonnet5]{Claude Sonnet 5}'],
      ['and DeepSeek V4 Pro (', 'and @[model:deepseek]{DeepSeek V4 Pro} ('],
      ['28 English prompts over a generated educational dataset of 741 pupils in 95 class offerings', '%[bench:education.prompts]{28} English prompts over a %[bench:education.synthetic]{generated} educational dataset of %[bench:education.pupils]{741} pupils in %[bench:education.offerings]{95} class offerings'],
      ['10 English prompts over real SEC EDGAR FY2025 filings (2 entities, 11 fields)', '%[bench:finance.prompts]{10} English prompts over real SEC EDGAR FY2025 filings (%[bench:finance.entities]{2} entities, %[bench:finance.fields]{11} fields)'],
    ], evidence: [
      q('bench:education.prompts', '28', 'benchmarks', 'education prompts: 28', 'pilot-en benchmark, prompts array'),
      q('bench:education.synthetic', 'generated', 'dataset', 'synthetic: true', 'meta.synthetic', 'The meta flag reads synthetic: true and its note says "Generated, not de-identified". Recorded as generated. Fair?'),
      q('bench:education.pupils', '741', 'dataset', 'totalStudents: 741', 'meta.totalStudents'),
      ...(existsSync('report/sources/raw/pdpp-students.txt') ? [q('bench:education.pupils', '741', 'pdpp-students', 'records: 741', 'line 1', 'The same count received as records under a purpose-bound grant, one record per pupil, names withheld. Does the study rest on this many pupils?')] : []),
      q('bench:education.offerings', '95', 'dataset', 'offerings: 95', 'meta.offerings'),
      q('bench:finance.prompts', '10', 'benchmarks', 'finance prompts: 10', 'finance benchmark, prompts array'),
      q('bench:finance.entities', '2', 'finance', 'companies: 2', 'companies array'),
      q('bench:finance.fields', '11', 'finance', 'fields per company: 11', 'per company, excluding id, name, cik and unit companions'),
    ] },
  { anchor: '86.5% ± 0.3', kind: 'table', id: 'table1', marks: [
      ['Education | Claude Opus 5 | 86.5% ± 0.3 | 94.8% ± 4.8 | 23.3/28 | 91.4%', 'Education | @[model:opus5]{Claude Opus 5} | %[model:opus5.eduFirst]{86.5}% ± 0.3 | %[model:opus5.eduFinal]{94.8}% ± 4.8 | 23.3/28 | %[model:opus5.eduCoverage]{91.4}%'],
      [' | Claude Sonnet 5 | 89.3% ± 2.1 | 92.2% ± 3.6 | 21.3/28 | 92.3%', ' | @[model:sonnet5]{Claude Sonnet 5} | %[model:sonnet5.eduFirst]{89.3}% ± 2.1 | %[model:sonnet5.eduFinal]{92.2}% ± 3.6 | 21.3/28 | %[model:sonnet5.eduCoverage]{92.3}%'],
      [' | DeepSeek V4 Pro | 97.2% ± 1.3 | 99.5% ± 0.8 | 27.7/28 | 94.2%', ' | @[model:deepseek]{DeepSeek V4 Pro} | %[model:deepseek.eduFirst]{97.2}% ± 1.3 | %[model:deepseek.eduFinal]{99.5}% ± 0.8 | 27.7/28 | %[model:deepseek.eduCoverage]{94.2}%'],
      ['Finance | Claude Opus 5 | 97.9% ± 0.6 | 100% ± 0.0 | 10/10 | 95.8%', 'Finance | @[model:opus5]{Claude Opus 5} | %[model:opus5.finFirst]{97.9}% ± 0.6 | %[model:opus5.finFinal]{100}% ± 0.0 | 10/10 | %[model:opus5.finCoverage]{95.8}%'],
      [' | Claude Sonnet 5 | 96.5% ± 1.2 | 96.5% ± 1.2 | 7/10 | 89.8%', ' | @[model:sonnet5]{Claude Sonnet 5} | %[model:sonnet5.finFirst]{96.5}% ± 1.2 | %[model:sonnet5.finFinal]{96.5}% ± 1.2 | 7/10 | %[model:sonnet5.finCoverage]{89.8}%'],
      [' | DeepSeek V4 Pro | 100% ± 0.0 | 100% ± 0.0 | 10/10 | 96.4%', ' | @[model:deepseek]{DeepSeek V4 Pro} | %[model:deepseek.finFirst]{100}% ± 0.0 | %[model:deepseek.finFinal]{100}% ± 0.0 | 10/10 | %[model:deepseek.finCoverage]{96.4}%'],
    ], evidence: [
      q('model:opus5.eduFirst', '86.5', 'summary', '86.5 ± 0.3', 'education, claude-opus-5, first%'),
      q('model:opus5.eduFinal', '94.8', 'summary', '94.8 ± 4.8', 'education, claude-opus-5, final%'),
      q('model:opus5.eduCoverage', '91.4', 'summary', '91.4', 'education, claude-opus-5, cover%'),
      q('model:sonnet5.eduFirst', '89.3', 'summary', '89.3 ± 2.1', 'education, claude-sonnet-5, first%'),
      q('model:sonnet5.eduFinal', '92.2', 'summary', '92.2 ± 3.6', 'education, claude-sonnet-5, final%'),
      q('model:sonnet5.eduCoverage', '92.3', 'summary', '92.3', 'education, claude-sonnet-5, cover%'),
      q('model:deepseek.eduFirst', '97.2', 'summary', '97.2 ± 1.3', 'education, DeepSeek, first%'),
      q('model:deepseek.eduFinal', '99.5', 'summary', '99.5 ± 0.8', 'education, DeepSeek, final%'),
      q('model:deepseek.eduCoverage', '94.2', 'summary', '94.2', 'education, DeepSeek, cover%'),
      q('model:opus5.finFirst', '97.9', 'summary', '97.9 ± 0.6', 'finance, claude-opus-5, first%'),
      q('model:opus5.finFinal', '100', 'summary', '100.0 ± 0.0', 'finance, claude-opus-5, final%', 'Printed 100.0, written 100.'),
      q('model:opus5.finCoverage', '95.8', 'summary', '95.8', 'finance, claude-opus-5, cover%'),
      q('model:sonnet5.finFirst', '96.5', 'summary', '96.5 ± 1.2', 'finance, claude-sonnet-5, first%'),
      q('model:sonnet5.finFinal', '96.5', 'summary', '96.5 ± 1.2', 'finance, claude-sonnet-5, final%'),
      q('model:sonnet5.finCoverage', '89.8', 'summary', '89.8', 'finance, claude-sonnet-5, cover%'),
      q('model:deepseek.finFirst', '100', 'summary', '100.0 ± 0.0', 'finance, DeepSeek, first%', 'Printed 100.0, written 100.'),
      q('model:deepseek.finFinal', '100', 'summary', '100.0 ± 0.0', 'finance, DeepSeek, final%', 'Printed 100.0, written 100.'),
      q('model:deepseek.finCoverage', '96.4', 'summary', '96.4', 'finance, DeepSeek, cover%'),
    ] },
  { anchor: '95.4% ± 7.5', kind: 'table', id: 'table3', marks: [
      ['Education | Claude Opus 5 | 95.4% ± 7.5 | 97.1% ± 4.7 | 25.7/28 | 97.9%', 'Education | @[model:opus5]{Claude Opus 5} | %[model:opus5.edu2First]{95.4}% ± 7.5 | %[model:opus5.edu2Final]{97.1}% ± 4.7 | 25.7/28 | %[model:opus5.edu2Coverage]{97.9}%'],
      [' | Claude Sonnet 5 | 99.4% ± 0.2 | 99.4% ± 0.2 | 25.7/28 | 91.1%', ' | @[model:sonnet5]{Claude Sonnet 5} | %[model:sonnet5.edu2First]{99.4}% ± 0.2 | %[model:sonnet5.edu2Final]{99.4}% ± 0.2 | 25.7/28 | %[model:sonnet5.edu2Coverage]{91.1}%'],
      [' | DeepSeek V4 Pro | 99.2% ± 1.5 | 100% ± 0.0 | 28/28 | 95.1%', ' | @[model:deepseek]{DeepSeek V4 Pro} | %[model:deepseek.edu2First]{99.2}% ± 1.5 | %[model:deepseek.edu2Final]{100}% ± 0.0 | 28/28 | %[model:deepseek.edu2Coverage]{95.1}%'],
      ['Finance | Claude Opus 5 | 100% ± 0.0 | 100% ± 0.0 | 10/10 | 98.2%', 'Finance | @[model:opus5]{Claude Opus 5} | %[model:opus5.fin2First]{100}% ± 0.0 | %[model:opus5.fin2Final]{100}% ± 0.0 | 10/10 | %[model:opus5.fin2Coverage]{98.2}%'],
      [' | Claude Sonnet 5 | 100% ± 0.0 | 100% ± 0.0 | 10/10 | 94.4%', ' | @[model:sonnet5]{Claude Sonnet 5} | %[model:sonnet5.fin2First]{100}% ± 0.0 | %[model:sonnet5.fin2Final]{100}% ± 0.0 | 10/10 | %[model:sonnet5.fin2Coverage]{94.4}%'],
      [' | DeepSeek V4 Pro | 100% ± 0.0 | 100% ± 0.0 | 10/10 | 97.6%', ' | @[model:deepseek]{DeepSeek V4 Pro} | %[model:deepseek.fin2First]{100}% ± 0.0 | %[model:deepseek.fin2Final]{100}% ± 0.0 | 10/10 | %[model:deepseek.fin2Coverage]{97.6}%'],
    ], evidence: [
      q('model:opus5.edu2First', '95.4', 'summary2', '95.4 ± 7.5', 'second study, education, claude-opus-5, first%'),
      q('model:opus5.edu2Final', '97.1', 'summary2', '97.1 ± 4.7', 'second study, education, claude-opus-5, final%'),
      q('model:opus5.edu2Coverage', '97.9', 'summary2', '97.9', 'second study, education, claude-opus-5, cover%'),
      q('model:sonnet5.edu2First', '99.4', 'summary2', '99.4 ± 0.2', 'second study, education, claude-sonnet-5, first%'),
      q('model:sonnet5.edu2Final', '99.4', 'summary2', '99.4 ± 0.2', 'second study, education, claude-sonnet-5, final%'),
      q('model:sonnet5.edu2Coverage', '91.1', 'summary2', '91.1', 'second study, education, claude-sonnet-5, cover%'),
      q('model:deepseek.edu2First', '99.2', 'summary2', '99.2 ± 1.5', 'second study, education, DeepSeek, first%'),
      q('model:deepseek.edu2Final', '100', 'summary2', '100.0 ± 0.0', 'second study, education, DeepSeek, final%', 'Printed 100.0, written 100.'),
      q('model:deepseek.edu2Coverage', '95.1', 'summary2', '95.1', 'second study, education, DeepSeek, cover%'),
      q('model:opus5.fin2First', '100', 'summary2', '100.0 ± 0.0', 'second study, finance, claude-opus-5, first%', 'Printed 100.0, written 100.'),
      q('model:opus5.fin2Final', '100', 'summary2', '100.0 ± 0.0', 'second study, finance, claude-opus-5, final%', 'Printed 100.0, written 100.'),
      q('model:opus5.fin2Coverage', '98.2', 'summary2', '98.2', 'second study, finance, claude-opus-5, cover%'),
      q('model:sonnet5.fin2First', '100', 'summary2', '100.0 ± 0.0', 'second study, finance, claude-sonnet-5, first%', 'Printed 100.0, written 100.'),
      q('model:sonnet5.fin2Final', '100', 'summary2', '100.0 ± 0.0', 'second study, finance, claude-sonnet-5, final%', 'Printed 100.0, written 100.'),
      q('model:sonnet5.fin2Coverage', '94.4', 'summary2', '94.4', 'second study, finance, claude-sonnet-5, cover%'),
      q('model:deepseek.fin2First', '100', 'summary2', '100.0 ± 0.0', 'second study, finance, DeepSeek, first%', 'Printed 100.0, written 100.'),
      q('model:deepseek.fin2Final', '100', 'summary2', '100.0 ± 0.0', 'second study, finance, DeepSeek, final%', 'Printed 100.0, written 100.'),
      q('model:deepseek.fin2Coverage', '97.6', 'summary2', '97.6', 'second study, finance, DeepSeek, cover%'),
    ] },
  { anchor: 'told the rule, the models follow it', id: 'finding3', marks: [
      ['rises from 89.3% to 99.4%', 'rises from %[model:sonnet5.eduFirst]{89.3}% to %[model:sonnet5.edu2First]{99.4}%'],
      ['DeepSeek from 97.2% to 99.2% and to 100% after one correction', 'DeepSeek from %[model:deepseek.eduFirst]{97.2}% to %[model:deepseek.edu2First]{99.2}% and to %[model:deepseek.edu2Final]{100}% after one correction'],
      ['Opus 5 from 86.5% to 95.4%', 'Opus 5 from %[model:opus5.eduFirst]{86.5}% to %[model:opus5.edu2First]{95.4}%'],
      ['are 16 in the second', 'are %[study:frontier2.bindingErrors]{16} in the second'],
    ], evidence: [
      q('model:sonnet5.eduFirst', '89.3', 'summary', '89.3 ± 2.1', 'first study, education, claude-sonnet-5'),
      q('model:sonnet5.edu2First', '99.4', 'summary2', '99.4 ± 0.2', 'second study, education, claude-sonnet-5'),
      q('model:deepseek.eduFirst', '97.2', 'summary', '97.2 ± 1.3', 'first study, education, DeepSeek'),
      q('model:deepseek.edu2First', '99.2', 'summary2', '99.2 ± 1.5', 'second study, education, DeepSeek'),
      q('model:deepseek.edu2Final', '100', 'summary2', '100.0 ± 0.0', 'second study, education, DeepSeek, final%', 'Printed 100.0, written 100.'),
      q('model:opus5.eduFirst', '86.5', 'summary', '86.5 ± 0.3', 'first study, education, claude-opus-5'),
      q('model:opus5.edu2First', '95.4', 'summary2', '95.4 ± 7.5', 'second study, education, claude-opus-5'),
      d('study:frontier2.bindingErrors', '16', 'summary2', 'CATCH. The published residuals script has no --tag option: under --tag frontier2 it reproduces the first study (71/82/4). The second study cannot be regenerated with it. The summary for the second study reports addressability errors of 80% of 25 (Opus 5) and 43% of 7 (Sonnet 5), about 23, a broader class than the binding pattern. The paper\'s 16 did not regenerate here. Your call.'),
    ] },
  { anchor: 'No model, on any of the', id: 'finding1', marks: [
      ['342 query-runs', '%[study:frontier.queryRuns]{342} query-runs'],
      ['runs from 86.5% to 100%', 'runs from %[model:opus5.eduFirst]{86.5}% to %[model:deepseek.finFirst]{100}%'],
      ['coverage from 89.8% to 96.4%', 'coverage from %[model:sonnet5.finCoverage]{89.8}% to %[model:deepseek.finCoverage]{96.4}%'],
      ['3.4 s per query against 7.9 and 11.8 s', '%[model:deepseek.latency]{3.4} s per query against %[model:sonnet5.latency]{7.9} and %[model:opus5.latency]{11.8} s'],
    ], evidence: [
      d('study:frontier.queryRuns', '342', 'benchmarks', '3 models x 3 runs x (28 + 10) prompts = 342. The benchmark files give 28 and 10; the summary lists three models with three runs each.'),
      q('model:opus5.eduFirst', '86.5', 'summary', '86.5 ± 0.3', 'the lowest first pass'),
      q('model:deepseek.finFirst', '100', 'summary', '100.0 ± 0.0', 'the highest first pass', 'Printed 100.0, written 100.'),
      q('model:sonnet5.finCoverage', '89.8', 'summary', '89.8', 'the lowest coverage'),
      q('model:deepseek.finCoverage', '96.4', 'summary', '96.4', 'the highest coverage'),
      q('model:deepseek.latency', '3.4', 'deployment', 'DeepSeek-V4-Pro-0813: 3.4', 'generation latency, s per query'),
      q('model:sonnet5.latency', '7.9', 'deployment', 'claude-sonnet-5: 7.9', 'generation latency'),
      q('model:opus5.latency', '11.8', 'deployment', 'claude-opus-5: 11.8', 'generation latency'),
    ] },
  { anchor: 'Of the 157 errors', id: 'finding2', marks: [
      ['Of the 157 errors', 'Of the %[study:frontier.residualErrors]{157} errors'],
      ['108 (69%)', '%[study:frontier.bindingErrors]{108} (%[study:frontier.bindingShare]{69}%)'],
      ['17 of the 35 non-converged', '%[study:frontier.bindingQueryRuns]{17} of the %[study:frontier.nonConverged]{35} non-converged'],
      ['Wrong values are 40 of the 157 (25%)', 'Wrong values are %[study:frontier.wrongValues]{40} of the 157 (%[study:frontier.wrongShare]{25}%)'],
    ], evidence: [
      d('study:frontier.residualErrors', '157', 'residuals', 'Pooled over the three models: 71 + 82 + 4 = 157 residual errors.'),
      d('study:frontier.bindingErrors', '108', 'residuals', 'Pooled binding errors: 47 + 58 + 3 = 108.'),
      d('study:frontier.bindingShare', '69', 'residuals', '108 / 157 = 68.8%, written as 69%. Fair to round?'),
      d('study:frontier.bindingQueryRuns', '17', 'residuals', 'Binding query-runs pooled: 6 + 10 + 1 = 17.'),
      d('study:frontier.nonConverged', '35', 'residuals', 'Non-converged query-runs pooled: 14 + 20 + 1 = 35.'),
      d('study:frontier.wrongValues', '40', 'residuals', 'Wrong values pooled: 20 + 19 + 1 = 40.'),
      d('study:frontier.wrongShare', '25', 'residuals', '40 / 157 = 25.5%, written as 25%. Fair to round?'),
    ] },
  { anchor: 'Verifying the 2,185 claims', id: 'cost-verify', marks: [
      ['2,185 claims', '%[deploy:frontier.claims]{2185} claims'],
      ['252 stored', '%[deploy:frontier.responses]{252} stored'],
      ['4,826-key', '%[deploy:frontier.storeKeys]{4826}-key'],
      ['takes 3.4 ms on a laptop — 0.013 ms per response, 1.5 µs per claim', 'takes %[deploy:frontier.msTotalClaimed]{3.4} ms on a laptop — %[deploy:frontier.msPerResponseClaimed]{0.013} ms per response, %[deploy:frontier.usPerClaimClaimed]{1.5} µs per claim'],
      ['(3.4 to 11.8 s per query', '(%[model:deepseek.latency]{3.4} to %[model:opus5.latency]{11.8} s per query'],
    ], evidence: [
      q('deploy:frontier.claims', '2185', 'deployment', '2185 claims in 252 responses', 'verification line', 'The paper writes 2,185; the comma is typographic.'),
      q('deploy:frontier.responses', '252', 'deployment', '2185 claims in 252 responses', 'verification line'),
      q('deploy:frontier.storeKeys', '4826', 'deployment', '4826 keys', 'fact store line', 'The paper writes 4,826.'),
      q('deploy:frontier.msTotalClaimed', '3.4', 'deployment', '7527.2 ms per pass over all responses', 'timing line',
        'CATCH. The paper says verifying all 2,185 claims takes 3.4 ms. The regeneration measured 7527.2 ms per pass over all responses, and 3.4449 ms PER CLAIM. The regenerated per-claim figure is almost exactly the number the paper prints as the total, which suggests a per-claim time was mislabeled as the whole. The paper figure did not reproduce here. Flag it, or tell me how 3.4 ms was measured.'),
      q('deploy:frontier.msPerResponseClaimed', '0.013', 'deployment', '29.870 ms per response', 'timing line', 'CATCH. Paper: 0.013 ms per response. Regeneration: 29.870 ms per response. Did not reproduce.'),
      q('deploy:frontier.usPerClaimClaimed', '1.5', 'deployment', '3.4449 ms per claim', 'timing line', 'CATCH. Paper: 1.5 microseconds per claim. Regeneration: 3.4449 milliseconds per claim, about 2300 times slower. Did not reproduce.'),
      q('model:deepseek.latency', '3.4', 'deployment', 'DeepSeek-V4-Pro-0813: 3.4', 'generation latency'),
      q('model:opus5.latency', '11.8', 'deployment', 'claude-opus-5: 11.8', 'generation latency'),
    ] },
  { anchor: 'Two overheads are real', id: 'cost-gen', marks: [
      ['ran 49% (Opus 5), 66% (Sonnet 5) and 79% (DeepSeek)', 'ran %[model:opus5.overhead]{49}% (Opus 5), %[model:sonnet5.overhead]{66}% (Sonnet 5) and %[model:deepseek.overhead]{79}% (DeepSeek)'],
      ['77% of query-runs needed none', '%[deploy:frontier.noCorrectionPct]{77}% of query-runs needed none'],
      ['1.23 generations per query (1.06 for DeepSeek, 1.33 for Opus 5)', '%[deploy:frontier.generations]{1.23} generations per query (%[model:deepseek.generations]{1.06} for DeepSeek, %[model:opus5.generations]{1.33} for Opus 5)'],
    ], evidence: [
      q('model:opus5.overhead', '49', 'deployment', 'claude-opus-5: +49%', 'markup overhead'),
      q('model:sonnet5.overhead', '66', 'deployment', 'claude-sonnet-5: +66%', 'markup overhead'),
      q('model:deepseek.overhead', '79', 'deployment', 'DeepSeek-V4-Pro-0813: +79%', 'markup overhead'),
      q('deploy:frontier.noCorrectionPct', '77', 'deployment', '"n":252,"noPass":77', 'correction loop, all models', 'noPass is a percentage of query-runs (DeepSeek reads 94 on n=84, so it cannot be a count).'),
      q('deploy:frontier.generations', '1.23', 'deployment', '"generations":"1.23"', 'correction loop, all models'),
      q('model:deepseek.generations', '1.06', 'deployment', '"generations":"1.06"', 'correction loop, DeepSeek'),
      q('model:opus5.generations', '1.33', 'deployment', '"generations":"1.33"', 'correction loop, claude-opus-5'),
    ] },
  { anchor: 'is an npm package whose verifier', id: 'integration', marks: [
      ['The reference implementation is an npm package whose verifier has no runtime dependencies', '@[impl:proveml]{The reference implementation} is an npm package whose verifier has %[impl:proveml.runtimeDeps]{no} runtime dependencies'],
    ], evidence: [
      q('impl:proveml.runtimeDeps', 'no', 'package', 'dependencies {}', 'package.json dependencies', 'The dependencies object is empty ({}); recorded as "no". Fair?'),
    ] },
];

const blocks = JSON.parse(readFileSync('paper1-blocks.json', 'utf8'));

// What the page's own inference pass produced. Two sources, merged by paragraph:
// report/infer-state.json (the db documents: state + proposed claims) and the
// judgements handed back (each carries the span it judged). A proposed reading
// becomes a real mark with the engine's key; the verdict is copied across.
const handed = existsSync('report/review.json') ? JSON.parse(readFileSync('report/review.json', 'utf8')) : null;
const inferState = existsSync('report/infer-state.json') ? JSON.parse(readFileSync('report/infer-state.json', 'utf8')) : {};
const proposed = {};   // pairId -> [{span, kind, why}]
for (const [pid, st] of Object.entries(inferState)) for (const c of (st.claims || [])) (proposed[pid] ||= []).push({ span: c.span, kind: c.kind || 'claim', why: c.why || '' });
const judgedByKey = {};   // pairId + '\u0001' + span -> judgement
if (handed && handed.judgements) for (const [rid, j] of Object.entries(handed.judgements)) if (j && j.inference && j.span) {
  judgedByKey[j.src + '\u0001' + j.span] = { ...j, clientRid: rid };
  if (!(proposed[j.src] || []).some((c) => c.span === j.span)) (proposed[j.src] ||= []).push({ span: j.span, kind: j.kind || 'claim', why: j.why || '' });
}
const migrated = handed ? { ...handed, judgements: { ...handed.judgements } } : null;
const QUESTION = ' Do you stand behind this as written, or should it be sourced or softened?';
const inferSubject = (pidv, text) => {
  const list = proposed[pidv]; if (!list || !list.length) return null;
  // Positions on the ORIGINAL text; a proposal that overlaps one already
  // placed is skipped (the model proposed a span inside a span once), and the
  // wrapping runs from the end so earlier positions stay valid.
  const evidence = []; const placed = [];
  for (const c of list) {
    if (!c.span) continue;
    const at = text.indexOf(c.span); if (at < 0) continue;
    const end = at + c.span.length;
    if (placed.some((p) => at < p.end && end > p.at)) continue;
    if ((text.slice(0, at).match(/`/g) || []).length % 2 === 1) continue;   // inside a code span: the verifier skips it, the reader would see raw markup
    if (/[%@?]\[|\]\{/.test(c.span)) continue;   // the span itself quotes markup
    if (/[%@?]\[[^\]]*$/.test(text.slice(Math.max(0, at - 80), at)) && text.slice(end).match(/^[^{]*\]\{/)) continue; // inside another construct's head
    placed.push({ at, end, c });
  }
  placed.sort((p, q) => p.at - q.at);
  let claim = text; let k = 0;
  const marks = placed.map((p) => { k++; return { ...p, field: 'para:' + pidv + '.inf' + k }; });
  for (const m of marks.slice().reverse()) claim = claim.slice(0, m.at) + '%[' + m.field + ']{' + m.c.span + '}' + claim.slice(m.end);
  for (const m of marks) {
    store['para:' + pidv + '.name'] = 'this paragraph'; store[m.field] = m.c.span;
    const e = { field: m.field, claimValue: m.c.span, basis: 'derived', note: (m.c.why || '') + QUESTION };
    evidence.push(e);
    const j = judgedByKey[pidv + '\u0001' + m.c.span];
    if (j && migrated) migrated.judgements[evidenceReviewId(pidv, e)] = { verdict: j.verdict, src: pidv, field: m.field, at: j.at, inference: true, span: m.c.span, kind: m.c.kind, why: m.c.why };
  }
  return k ? { claim, evidence } : null;
};
const subjects = [];
const used = new Set();
blocks.forEach((b, i) => {
  if (b.kind === 'heading') { subjects.push({ id: 'h' + i, heading: true, level: b.level || 1, title: b.text.replace(CITE, '$2'), claim: '', evidence: [] }); return; }
  if (b.kind === 'code' || b.kind === 'table') b.text = b.text.replace(CITE, '$2');
  if (b.kind === 'figure') {
    const PAPER = ROOT + '/paper/';
    const file = PAPER + b.file; let image = null;
    if (existsSync(file)) { const bytes = readFileSync(file); if (bytes.length < 4 * 1024 * 1024) { const ext = b.file.split('.').pop().toLowerCase(); image = { src: 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + bytes.toString('base64'), alt: b.text.slice(0, 120) }; } }
    const fm = b.text.match(/^(Figure \d+): ?/); const fbody = fm ? b.text.slice(fm[0].length) : b.text;
    const fid = 'f' + pid(b.text).slice(1);
    const fev = []; let ftext = citify(neutralize(fbody), fid, fev);
    // The caption is a claim about the figure: one reading, judged against the image.
    const first = ftext.match(/^[^%@?\[\]{}]+?[.:](?=\s|$)/);
    const capField = 'figure:' + fid + '.caption';
    store['figure:' + fid + '.name'] = 'this figure';
    if (first) { store[capField] = first[0]; ftext = '%[' + capField + ']{' + first[0] + '}' + ftext.slice(first[0].length); }
    else store[capField] = fbody;
    fev.push({ field: capField, claimValue: first ? first[0] : fbody, basis: 'derived', note: 'Does the figure show what this caption says? Look at the image, not the text.' + QUESTION });
    subjects.push({ id: fid, title: '', meta: '', image, capLead: fm ? fm[1] : 'Figure', scan: 'pending', claim: ftext, evidence: fev });
    return;
  }
  const hit = bound.find((x) => !used.has(x.id) && b.text.includes(x.anchor) && (!x.kind || x.kind === b.kind));
  if (hit) {
    used.add(hit.id);
    const ev = [...hit.evidence]; const claim = citify(mark(neutralize(b.text), hit.marks, hit.id), hit.id, ev);
    subjects.push({ id: hit.id, title: b.lead || hit.id, meta: '', pre: b.kind === 'table', claim, evidence: ev });
    return;
  }
  if (b.ref && b.refTitle && b.text.split(b.refTitle).length === 2) {
    const ev = referenceEvidence(b.ref, b.refTitle);
    if (ev) {
      store[`paperref:${b.ref}.name`] = b.refTitle;
      subjects.push({ id: 'ref-' + b.ref, title: '', meta: '', claim: neutralize(b.text).replace(b.refTitle, `@[paperref:${b.ref}]{${b.refTitle}}`), evidence: [ev] });
      return;
    }
  }
  // the page's own pass: proposed readings become marks; a paragraph it found clean stays clean
  const cm = b.kind === 'para' ? b.text.match(/^((?:Table|Figure) \d+): ?/) : null;
  if (cm) b.text = b.text.slice(cm[0].length);
  const id = pid(b.text);
  const cev = []; const ctext = citify(neutralize(b.text), id, cev);
  if (cev.length) { subjects.push({ id, title: b.lead || '', meta: '', pre: b.kind === 'table', capLead: cm ? cm[1] : undefined, claim: ctext, evidence: cev }); return; }
  const inf = inferSubject(id, neutralize(b.text));
  if (inf) { subjects.push({ id, title: b.lead || '', meta: '', pre: b.kind === 'table', claim: inf.claim, evidence: inf.evidence }); return; }
  const st = inferState[id];
  const scan = b.kind === 'code' ? 'clean' : (st && st.state === 'clean' ? 'clean' : 'pending');
  subjects.push({ id, title: b.lead || '', meta: '', pre: b.kind === 'table', capLead: cm ? cm[1] : undefined, scan, claim: neutralize(b.text), evidence: [] });
});
for (const x of bound) if (!used.has(x.id)) { console.error('ANCHOR not found:', x.id, x.anchor); process.exit(5); }

for (const s of subjects)
  for (const e of s.evidence)
    if (e.basis === 'quote') for (const qq of (e.sourceQuotes ? e.sourceQuotes.map((x) => x.sourceQuote) : [e.sourceQuote]))
      if (!(snapshots[e.source || s.id] || '').replace(/\s+/g, ' ').includes(String(qq).replace(/\s+/g, ' '))) {
        console.error('QUOTE NOT IN SNAPSHOT:', s.id, e.field, JSON.stringify(qq)); process.exit(3);
      }

// Paragraph leaves wherever every quote fits inside one leaf; a page-wide leaf
// where a quote spans a break, so a proof always names a single leaf.
{
  const quotesBy = {};
  for (const s of subjects) for (const e of s.evidence) if (e.basis === 'quote') for (const qq of (e.sourceQuotes ? e.sourceQuotes.map((x) => x.sourceQuote) : [e.sourceQuote])) (quotesBy[e.source || s.id] ||= []).push(qq);
  const sq = (x) => x.replace(/\s+/g, ' ').trim();
  for (const [id, qs] of Object.entries(quotesBy)) {
    const lines = (snapshots[id] || '').split('\n');
    if (!qs.every((q) => lines.some((l) => sq(l).includes(sq(q))))) { snapshots[id] = sq(snapshots[id] || ''); console.log('leaf fallback: page-wide leaf for', id); }
  }
}
const manifests = {};
for (const [id, text] of Object.entries(snapshots)) manifests[id] = buildManifest(text, { html: false, source: id, capturedAt: '2026-09-02' });
const committedReview = migrated;
const sourceTitles = {
  benchmarks: 'benchmark files (regenerated)', dataset: 'dataset metadata', finance: 'finance benchmark', summary: 'frontier study summary (experiments/run-frontier.sh)',
  residuals: 'frontier residual errors', deployment: 'deployment numbers (deployment-numbers.mjs)', package: 'the npm package (package.json)', summary2: 'second frontier study summary (--tag frontier2)',
  magesh2025: 'Magesh et al. 2025, arXiv 2405.20362 (abstract page)', liu2026citations: 'Liu et al. 2026, arXiv 2606.21155 (abstract page)',
  omnibus2026: 'Regulation (EU) 2026/1744, EUR-Lex', art50guidelines2026: 'Article 50 guidelines, European Commission',
  'pdpp-students': 'pupil records, stream students, under a PDPP grant',
  ...auditTitles,
};
const runs = Object.fromEntries(['summary', 'summary2', 'residuals', 'deployment', 'dataset', 'benchmarks', 'finance', 'package'].filter((id) => existsSync('report/runs/' + id + '.json')).map((id) => [id, JSON.parse(readFileSync('report/runs/' + id + '.json', 'utf8'))]));
const hederaAnchor = existsSync('report/anchors/hedera.json') ? JSON.parse(readFileSync('report/anchors/hedera.json', 'utf8')) : null;
const rekorAnchor = existsSync('report/anchors/rekor.json') ? JSON.parse(readFileSync('report/anchors/rekor.json', 'utf8')) : null;
const vanaAnchor = existsSync('report/anchors/vana.json') ? JSON.parse(readFileSync('report/anchors/vana.json', 'utf8')) : null;
const signoffs = existsSync('report/signoffs.json') ? JSON.parse(readFileSync('report/signoffs.json', 'utf8')) : [];
const pdppReview = existsSync('report/sources/pdpp-review.json') ? JSON.parse(readFileSync('report/sources/pdpp-review.json', 'utf8')) : null;
const adapters = {
  in: [
    { role: 'reads the paper', options: [{ name: 'tex-adapter', state: 'plugged' }, { name: 'Markdown', state: 'available', note: 'proveml reads Markdown natively' }, { name: 'HTML', state: 'available', note: 'the same block reader the sources use' }, { name: 'DOCX', state: 'known' }], icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2.5h5.5L13 6v7.5H4zM9.5 2.5V6H13M6 9h4M6 11.5h4"/></svg>', name: 'tex-adapter', plug: 'tex-adapter', what: 'proveml-spec.tex read as ' + blocks.length + ' blocks: headings, paragraphs, tables, listings, figures; every \\cite resolved from the .bib and kept as a reading', note: 'dependency-free; the paper is read, not rewritten, and the block text is what gets hashed', fits: 'any reader that yields blocks: Markdown, DOCX, HTML' },
    { role: 'the paper’s own data', options: [{ name: 'regenerate.mjs, local run records', state: 'plugged' }, { name: 'CI run records', state: 'known', note: 'the same record, produced on a runner nobody here controls' }], icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h10v10H3zM5.5 6.5l2 1.5-2 1.5M8.5 10h2.5"/></svg>', name: 'regeneration scripts', plug: 'regeneration scripts', what: 'run-frontier.sh, the residuals script, deployment-numbers.mjs, dataset and benchmark metadata, package.json: every number in the paper is bound to the file that produced it', note: 'regenerate.mjs reruns them and records what ran; a number the scripts did not reproduce is a catch, not a pass', last: Object.keys(runs).length ? runs[Object.keys(runs)[0]].startedAt.slice(0, 10) + ', ' + Object.keys(runs).length + ' scripts' : undefined, fits: 'any script whose printed output the page can bind to' },
    { role: 'cited works', options: [{ name: 'audit archive', state: 'plugged' }, { name: 'Zotero library', state: 'known' }, { name: 'Crossref fetch', state: 'known' }], icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h11v9h-11zM2.5 4l1.5-2h8l1.5 2M6.5 7.5h3"/></svg>', name: 'audit archive', plug: 'audit archive', what: Object.keys(auditSnapshots).length + ' archived copies of cited works and ' + auditSubjects.length + ' related-work claims with verbatim quotes, from proveml-research/audit', fits: 'any archive of the works cited' },
    { role: 'fetching', options: [{ name: 'TLS, Wayback, RFC 3161 (freetsa)', state: 'plugged' }, { name: 'archive.today as witness', state: 'known' }, { name: 'another timestamp authority', state: 'known' }], icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7V5.5a3.5 3.5 0 0 1 7 0V7M3.5 7h9v6.5h-9z"/></svg>', name: 'fetch + provenance ladder', plug: 'TLS, Wayback, RFC 3161', what: 'curl over TLS with the certificate recorded, Wayback save-page-now where it answered, an RFC 3161 timestamp over the root', note: 'each source is labelled with the best rung it earned, never a higher one; EUR-Lex refused the archive and stays a rung lower', fits: 'any fetcher that records who vouched' },
    { role: 'personal data under a grant', name: 'pdpp', plug: 'PDPP 0.1 client, local source', what: 'a resource server of our own implementing Core sections 4, 5, 7 and 8, serving the study\'s pupil records as one stream; Vera fetched them as a client under a grant provisioned locally, projected to the fields the study needs', note: 'pdpp-server.mjs and source-pdpp.mjs; not the lab\'s reference implementation', fits: 'any PDPP resource server: a native provider or a polyfill connector', options: [{ name: 'local source, Core 4/5/7/8', state: 'plugged' }, { name: 'the lab reference implementation', state: 'available', note: 'in the pdpp repository, needs pnpm' }, { name: 'a native provider', state: 'known' }] },
    { role: 'signed sources', options: [{ name: 'proveml-credential', state: 'available', note: 'source vouchers via did:web, in proveml-demos' }, { name: 'signed exchanges', state: 'known' }, { name: 'C2PA manifests', state: 'known' }], name: 'signed sources', what: 'a source that arrives signed lands on the top rung without any of the above', state: 'available', fits: 'proveml-credential, signed exchanges, C2PA manifests' },
  ],
  out: [
    { role: 'hand-back', options: [{ name: 'artifact republish', state: 'plugged' }, { name: 'POST endpoint', state: 'available', note: 'the page already knows how to post its judgements to a URL' }, { name: 'clipboard copy', state: 'available' }, { name: 'git commit of the judgements', state: 'known' }], icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a5 5 0 0 1 8.7-3.4L13 6M13 2.5V6h-3.5M13 8a5 5 0 0 1-8.7 3.4L3 10M3 13.5V10h3.5"/></svg>', name: 'hand-back', plug: 'artifact republish', what: 'your judgements travel back into the page and into the next build, rekeyed to the hashes of the blocks they judged, so a yes survives renumbering and dies only when its text changes', fits: 'any channel that returns the judgements JSON' },
    signoffs.length
      ? { role: 'signer', name: 'signer', plug: 'did:web:abovebeyond.ai, key-1 (Ed25519)', what: 'the review root signed with the reviewer\'s did:web key and verified against the public DID document: signature, contract, and the root recomputed from the review', note: 'sign-review.mjs, using the credential adapter from proveml-demos', last: signoffs[signoffs.length - 1].issuedAt.slice(0, 16).replace('T', ' ') + ' UTC, ' + signoffs.length + ' sign-off' + (signoffs.length === 1 ? '' : 's'), fits: 'any signer: a passkey, another did:web key, an HSM', options: [{ name: 'did:web:abovebeyond.ai key-1', state: 'plugged' }, { name: 'passkey', state: 'available', note: 'the passkey signer in proveml-demos' }, { name: 'HSM', state: 'known' }] }
      : { role: 'signer', name: 'signer', what: 'nothing signs the review root yet', state: 'available', fits: 'a passkey, a did:web key, an HSM', options: [{ name: 'did:web key', state: 'available' }, { name: 'passkey', state: 'available' }, { name: 'HSM', state: 'known' }] },
    hederaAnchor
      ? { role: 'ledger anchor', name: 'ledger anchor', options: [{ name: 'Hedera Consensus Service, testnet', state: 'plugged' }, { name: 'Hedera Consensus Service, mainnet', state: 'known' }, { name: 'Sigstore Rekor', state: rekorAnchor ? 'plugged' : 'available', note: rekorAnchor ? 'log index ' + rekorAnchor.logIndex + ', inclusion proof of ' + (rekorAnchor.inclusionProof && rekorAnchor.inclusionProof.hashes ? rekorAnchor.inclusionProof.hashes.length : 0) + ' hashes' : 'anchor-rekor.mjs' }, { name: 'Vana L1, Moksha testnet', state: vanaAnchor ? 'plugged' : 'available', note: vanaAnchor ? 'file ' + vanaAnchor.fileId + ' in the DataRegistry, proof at block ' + vanaAnchor.addProofBlock : 'anchor-vana.mjs, needs a funded wallet' }, { name: 'another EVM chain', state: 'known' }, { name: 'none', state: 'none', note: 'anchor nowhere; the root stays a lower rung and says so' }], icon: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="6.6"/><path d="M5.3 4.5v7M10.7 4.5v7M5.3 6.6h5.4M5.3 9.4h5.4"/></svg>', plug: 'Hedera ' + hederaAnchor.network + (rekorAnchor ? ', Sigstore Rekor' : '') + (vanaAnchor ? ', Vana L1' : ''), what: 'the review root posted to topic ' + hederaAnchor.topicId + ', sequence ' + hederaAnchor.sequenceNumber + ', and read back from the public mirror node at consensus time ' + hederaAnchor.consensusTimestamp, note: 'anchor-hedera.mjs; the page shows only what the mirror node returned, never what was merely submitted', last: hederaAnchor.confirmedByMirrorAt.slice(0, 16).replace('T', ' ') + ' UTC, sequence ' + hederaAnchor.sequenceNumber, fits: 'any append-only log: another HCS topic, an EVM chain, a transparency log' }
      : { role: 'ledger anchor', name: 'ledger anchor', options: [{ name: 'Hedera Consensus Service, testnet', state: 'plugged' }, { name: 'Hedera Consensus Service, mainnet', state: 'known' }, { name: 'Sigstore Rekor', state: rekorAnchor ? 'plugged' : 'available', note: rekorAnchor ? 'log index ' + rekorAnchor.logIndex + ', inclusion proof of ' + (rekorAnchor.inclusionProof && rekorAnchor.inclusionProof.hashes ? rekorAnchor.inclusionProof.hashes.length : 0) + ' hashes' : 'anchor-rekor.mjs' }, { name: 'Vana L1, Moksha testnet', state: vanaAnchor ? 'plugged' : 'available', note: vanaAnchor ? 'file ' + vanaAnchor.fileId + ' in the DataRegistry, proof at block ' + vanaAnchor.addProofBlock : 'anchor-vana.mjs, needs a funded wallet' }, { name: 'another EVM chain', state: 'known' }, { name: 'none', state: 'none', note: 'anchor nowhere; the root stays a lower rung and says so' }], what: 'the review root posted to a public ledger, so the anchored rung is earned by a timestamped, findable record rather than by this page', state: 'available', fits: 'Hedera Consensus Service, an EVM chain, a transparency log' },
    signoffs.length
      ? { role: 'envelope', name: 'envelope', plug: 'SD-JWT VC, urn:proveml:review:1', what: 'the signed root carried as a verifiable credential: issuer did:web:abovebeyond.ai, the review root, the output root and the source roots in the payload', note: 'the format the demos defined; W3C VC data model in SD-JWT form', fits: 'W3C VC in JSON-LD, a DSSE envelope', options: [{ name: 'SD-JWT VC', state: 'plugged' }, { name: 'W3C VC, JSON-LD', state: 'available', note: 'in proveml-demos' }, { name: 'DSSE envelope', state: 'known' }] }
      : { role: 'envelope', name: 'envelope', what: 'the signed root carried into another system; needs a signer first', state: 'available', fits: 'W3C VC, SD-JWT VC, a DSSE envelope', options: [{ name: 'W3C verifiable credential', state: 'available' }, { name: 'SD-JWT VC', state: 'available' }, { name: 'DSSE envelope', state: 'known' }] },
    ...(pdppReview ? [{ role: 'as a PDPP source', name: 'pdpp-out', plug: 'PDPP 0.1 source, two streams', what: 'the review served as a PDPP source: streams judgements and signoffs under a purpose-bound grant, so an editor reads the approvals on the reviewer\'s terms; fetched once as client editor for editorial review, with the credential itself withheld by the field projection', note: 'pdpp-review-server.mjs; ' + pdppReview.signoffs.length + ' sign-off record(s) and ' + pdppReview.judgements + ' judgement record(s) served under grant ' + pdppReview.grant.grant_id, fits: 'any PDPP client', options: [{ name: 'local source, Core 4/5/7/8', state: 'plugged' }, { name: 'a hosted PDPP source', state: 'known' }] }] : []),
  ],
};
const { html, verified, total, proofs, roots } = reviewPage({
  store, subjects, snapshots, manifests, sourceTitles, adapters,
  allowMismatch: true,
  brandCss: houseCss().css, brandCssSource: houseCss().source,
  anchors: { ...(hederaAnchor ? { hedera: hederaAnchor } : {}), ...(rekorAnchor ? { rekor: rekorAnchor } : {}), ...(vanaAnchor ? { vana: vanaAnchor } : {}) },
  signoffs,
  runs,
  localSources: ['benchmarks', 'dataset', 'finance', 'summary', 'residuals', 'deployment', 'package', 'summary2'],
  sourceGroups: [
    { title: 'the paper’s own data', note: 'regenerated by the scripts in the research repository; every number in the paper is bound to one of these files', ids: ['summary', 'summary2', 'residuals', 'deployment', 'benchmarks', 'dataset', 'finance', 'package'] },
    { title: 'works it cites', note: 'archived copies from the audit, plus the two abstract pages fetched live', ids: ['magesh2025', 'liu2026citations', ...Object.keys(auditSnapshots)] },
    { title: 'regulation and official pages', note: '', ids: ['omnibus2026', 'art50guidelines2026'] },
    { title: 'personal data under a grant', note: 'received as a PDPP client under a purpose-bound grant; the study data is synthetic, the mechanism is not', ids: ['pdpp-students'] },
  ],
  signatures: { ...(existsSync('report/sources/signatures.json') ? JSON.parse(readFileSync('report/sources/signatures.json', 'utf8')) : {}), ...(existsSync('report/sources/pdpp-grant.json') ? (() => { const g = JSON.parse(readFileSync('report/sources/pdpp-grant.json', 'utf8')); return { 'pdpp-students': { level: 'granted', issuer: g.source.id, method: 'pdpp-0.1 client fetch', verifiedAt: g.fetchedAt.slice(0, 10), grant: g.grant, records: g.records, pages: g.pages, fetchedAt: g.fetchedAt, withheld: g.fieldsWithheld } }; })() : {}) },
  ...(committedReview ? { committedReview } : {}),
  storeName: 'ProveML: Inline Claim Markup for Deterministic Verification of AI-Generated Text', subjectsWord: 'sources',
  brand: { mark: '(ˆ◡ˆ)⌕', name: 'vera' },
  leftLabel: 'the paper says', rightLabel: 'the source',
});
writeFileSync('report/review-page.html', html);
mkdirSync('report/manifests', { recursive: true });
for (const [id, m] of Object.entries(manifests)) writeFileSync('report/manifests/' + id + '.json', JSON.stringify(m, null, 1) + '\n');
writeFileSync('report/review-page-proofs.json', JSON.stringify({ built: new Date().toISOString(), proofs }, null, 1) + '\n');
writeFileSync('report/roots.json', JSON.stringify(roots, null, 1) + '\n');
const ac = auditCheck(); console.log('audit quotes', ac.ok + ' ok', ac.bad.length ? 'BAD ' + ac.bad.join(',') : '');
console.log('verified', verified + '/' + total, '| blocks', subjects.length, '| readings', subjects.reduce((n, s) => n + s.evidence.length, 0), '| sources', Object.keys(snapshots).length);
