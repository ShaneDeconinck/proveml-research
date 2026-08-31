#!/usr/bin/env node
/**
 * The citation audit: the paper's related-work claims run through ProveML's
 * own review surface. This script is a thin consumer of proveml/review-page;
 * everything the page is (the verification gate, the verbatim-quote gate, the
 * judgement widget keyed by evidence hashes, the house styling) lives in the
 * package, so the next report gets the same surface by pointing the module at
 * a different store and evidence file.
 *
 * What stays here is what is specific to this report: which store, which
 * evidence file, how the paper phrases its characterisation of a cited work
 * (paperSide), and the archive of source snapshots the quotes are checked
 * against.
 *
 * Usage: node audit/scripts/build-sources-page.mjs
 * Writes: audit/docs/sources.html
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { reviewPage, snapshotText } from 'proveml/review-page';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const store = JSON.parse(readFileSync(join(root, 'fact-stores/citation-characteristics.json'), 'utf8'));
const sources = JSON.parse(readFileSync(join(root, 'references/source-claims.json'), 'utf8'));

// The store carries the characterisation fields; the entity name comes from
// the source record, so a reader sees the work's name, not its key.
const SHORT = { safe: 'SAFE', 'guardrails-ai': 'Guardrails AI', 'dspy-assertions': 'DSPy Assertions', 'nemo-guardrails': 'NeMo Guardrails', webgpt: 'WebGPT', rarr: 'RARR', 'gemini-double-check': 'Gemini double-check' };
for (const s of sources) store[`citation:${s.id}.name`] = SHORT[s.id] || s.title.split(':')[0];

const yes = (v) => (v === 'yes' ? 'does' : 'does not');

// The paper's characterisation of one cited work, as ProveML claims against
// the citation store. The page verifies every one of them or refuses to build.
function paperSide(s) {
    const P = `citation:${s.id}`;
    return `@[${P}]{${store[`${P}.name`]}} is %[category]{${s.category}}. It verifies by %[verificationMode]{${s.verificationMode}}, which we class as %[verificationClass]{${s.verificationClass}}, against %[against]{${s.against}}. It ${yes(s.inlineSupport)} mark claims inline (%[inlineSupport]{${s.inlineSupport}}), ${yes(s.structuredRecordBinding)} bind them to structured records (%[structuredRecordBinding]{${s.structuredRecordBinding}}), and ${yes(s.inferenceLayer)} carry an inference layer (%[inferenceLayer]{${s.inferenceLayer}}).`;
}

// Snapshots: every quote must occur verbatim in the archived copy of its
// source, and a source that quotes without an archive is a build error, not
// an unchecked link.
const rawDir = join(root, 'references/raw');
const rawFiles = Object.fromEntries(readdirSync(rawDir).map((f) => [f.replace(/\.(html|txt)$/, ''), f]));
const snapshots = {};
for (const [id, f] of Object.entries(rawFiles)) {
    snapshots[id] = snapshotText(readFileSync(join(rawDir, f), 'utf8'), { html: f.endsWith('.html') });
}
for (const s of sources) {
    if (s.evidence.some((e) => e.basis === 'quote') && snapshots[s.id] === undefined) {
        throw new Error(`${s.id}: quotes claimed but no archived snapshot in references/raw/`);
    }
}

const subjects = sources.map((s) => ({
    id: s.id,
    title: s.title,
    meta: `${s.authors}, ${s.year}. In the store as citation:${s.id}:`,
    claim: paperSide(s),
    evidence: s.evidence.map((e) => (e.basis === 'quote' ? { ...e, sourceHref: `../references/raw/${rawFiles[s.id]}` } : e)),
}));

export const inputs = {
    store, subjects, snapshots,
    name: 'review',
    storeName: 'citation-characteristics',
    subjectsWord: 'sources',
    leftLabel: 'the output',
    rightLabel: 'the source',
};

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
    const { html, verified, total } = reviewPage(inputs);
    writeFileSync(join(root, 'docs/sources.html'), html);
    console.log(`sources.html: ${verified}/${total} claims verified across ${subjects.length} sources`);
}
