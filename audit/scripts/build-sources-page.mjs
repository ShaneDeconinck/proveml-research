#!/usr/bin/env node
/**
 * The sources page: what the paper says about a cited work next to what the
 * work itself says, both marked up, both verified against one store.
 *
 * Left column: the paper's characterisation of the source, as ProveML claims
 * against the citation store (citation:<id>.<field>). Right column: the
 * source's own words, the quote the characterisation rests on, with the field
 * it supports marked as a fact against the same store. A reader reads both
 * sides; they do not go back and forth between papers.
 *
 * The build fails if any claim on either side does not verify, so the page
 * cannot ship with a characterisation the store does not hold.
 *
 * Usage: node audit/scripts/build-sources-page.mjs
 * Writes: audit/docs/sources.html
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { renderProveml } from 'proveml/render';
import { verifyProveml } from 'proveml/verify';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const store = JSON.parse(readFileSync(join(root, 'fact-stores/citation-characteristics.json'), 'utf8'));
const sources = JSON.parse(readFileSync(join(root, 'references/source-claims.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The store carries the characterisation fields; the entity name comes from
// the source record, so a reader sees the work's name, not its key.
for (const s of sources) store[`citation:${s.id}.name`] = s.title.split(':')[0];

const yes = (v) => (v === 'yes' ? 'does' : 'does not');

function paperSide(s) {
    const P = `citation:${s.id}`;
    return `@[${P}]{${store[`${P}.name`]}} is %[category]{${s.category}}. It verifies by %[verificationMode]{${s.verificationMode}}, which we class as %[verificationClass]{${s.verificationClass}}, against %[against]{${s.against}}. It ${yes(s.inlineSupport)} mark claims inline (%[inlineSupport]{${s.inlineSupport}}), ${yes(s.structuredRecordBinding)} bind them to structured records (%[structuredRecordBinding]{${s.structuredRecordBinding}}), and ${yes(s.inferenceLayer)} carry an inference layer (%[inferenceLayer]{${s.inferenceLayer}}).`;
}

function sourceSide(s) {
    const P = `citation:${s.id}`;
    return s.evidence.map(e => `“${e.sourceQuote}” <span class="loc">(${esc(e.sourceLocator.replace(/_/g, ' '))})</span>\n\n@[${P}]{${store[`${P}.name`]}}: that is what we read as %[${e.field}]{${e.claimValue}}.${e.note ? ` <span class="note">${esc(e.note)}</span>` : ''}`).join('\n\n');
}

let total = 0, verified = 0;
const cards = sources.map(s => {
    const left = paperSide(s), right = sourceSide(s);
    const vl = verifyProveml(left, store), vr = verifyProveml(right, store);
    for (const v of [vl, vr]) { total += v.total; verified += v.verified; if (v.errors.length) throw new Error(`${s.id}: ${v.errors.join('; ')}`); }
    const L = renderProveml(left, store).html, R = renderProveml(right, store).html;
    return `<section class="pair" id="${esc(s.id)}">
  <header><h2>${esc(s.title)}</h2><p class="meta">${esc(s.authors)} · ${esc(s.year)} · <code>citation:${esc(s.id)}</code> · ${vl.verified + vr.verified}/${vl.total + vr.total} claims verified</p></header>
  <div class="cols">
    <div class="col"><div class="lbl">what the paper says</div>${L}</div>
    <div class="col"><div class="lbl">what the source says</div>${R}</div>
  </div>
</section>`;
}).join('\n');

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Spline+Sans+Mono:wght@400;500&display=swap');
:root{--ink:#0e2433;--muted:#47616f;--haze-line:rgba(14,36,51,.18);--card:#fafcfd;--tint:#dfe8eb;--mark-ok:#126b3a;--mark-ok-lijn:rgba(18,107,58,.5);--mark-inf:#0e5730;--mark-inf-vlak:rgba(18,107,58,.14);--mark-bad:#a8352a;--mark-bad-lijn:rgba(168,53,42,.7);--mark-unk:#a35a06;--accent:#1a4fb4}
*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font-family:Lato,system-ui,sans-serif;line-height:1.6}
.wrap{max-width:74rem;margin:0 auto;padding:3rem 1.5rem 5rem}
h1{font-weight:900;letter-spacing:-.02em;font-size:2.1rem;margin:0 0 .6rem}h2{font-weight:700;font-size:1.15rem;margin:0}
.lede{color:var(--muted);max-width:66ch;margin:0 0 2.5rem}
.meta,.lbl,.loc,.summary{font-family:"Spline Sans Mono",ui-monospace,monospace;font-size:.78rem;color:var(--muted)}
.summary{margin:0 0 2rem;color:var(--mark-ok)}
.pair{border-top:1px solid var(--haze-line);padding:1.6rem 0 1.2rem}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1rem}
@media (max-width:52rem){.cols{grid-template-columns:1fr}}
.col{background:var(--card);border:1px solid var(--haze-line);border-radius:3px;padding:1rem 1.2rem;font-size:1rem}
.lbl{letter-spacing:.06em;text-transform:uppercase;margin-bottom:.6rem}
.col p{margin:0 0 .8rem}.note{color:var(--muted);font-size:.9rem}
.proveml-entity.proveml-verified{color:var(--mark-ok);border:1px solid var(--mark-ok-lijn);border-radius:2px;padding:.05em .35em}
.proveml-fact.proveml-verified{color:var(--mark-ok);border-bottom:1.5px dotted var(--mark-ok)}
.proveml-mismatch,.proveml-name-mismatch{color:var(--mark-bad);text-decoration:line-through;text-decoration-color:var(--mark-bad-lijn)}
.proveml-unverifiable,.proveml-no-context,.proveml-entity:not(.proveml-verified){color:var(--mark-unk);border-bottom:1.5px dashed var(--mark-unk)}
`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProveML · the sources, side by side</title><style>${CSS}</style></head><body><div class="wrap">
<h1>The sources, side by side</h1>
<p class="lede">Every characterisation of a cited work in the ProveML paper is a claim. This page puts each one next to the words in the source it rests on, and checks both against one store of citation characteristics with the same verifier the paper describes. Read left and right; nothing here asks you to open the source paper, and if a characterisation stopped matching the store, this page would not build.</p>
<p class="summary">${verified}/${total} claims verified across ${sources.length} sources · store: audit/fact-stores/citation-characteristics.json · built ${new Date().toISOString().slice(0, 10)}</p>
${cards}
</div></body></html>`;
writeFileSync(join(root, 'docs/sources.html'), html);
console.log(`sources.html: ${verified}/${total} claims verified across ${sources.length} sources`);
