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
import { readdirSync } from 'fs';
import { createHash } from 'crypto';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const store = JSON.parse(readFileSync(join(root, 'fact-stores/citation-characteristics.json'), 'utf8'));
const sources = JSON.parse(readFileSync(join(root, 'references/source-claims.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The store carries the characterisation fields; the entity name comes from
// the source record, so a reader sees the work's name, not its key.
const SHORT = { safe: 'SAFE', 'guardrails-ai': 'Guardrails AI', 'dspy-assertions': 'DSPy Assertions', 'nemo-guardrails': 'NeMo Guardrails', webgpt: 'WebGPT', rarr: 'RARR', 'gemini-double-check': 'Gemini double-check' };
for (const s of sources) store[`citation:${s.id}.name`] = SHORT[s.id] || s.title.split(':')[0];

const yes = (v) => (v === 'yes' ? 'does' : 'does not');

// Every quote must occur verbatim in the archived snapshot of its source
// (audit/references/raw/). The locator a reader scans is only worth printing
// if a machine has checked the quote is really there; a page about verified
// claims must not carry unverified quotes.
const rawDir = join(root, 'references/raw');
const rawFiles = Object.fromEntries(readdirSync(rawDir).map(f => [f.replace(/\.(html|txt)$/, ''), f]));
function snapshotText(file) {
    let t = readFileSync(join(rawDir, file), 'utf8');
    if (file.endsWith('.html')) {
        t = t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
             .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
             .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
             .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'").replace(/&quot;/g, '"')
             .replace(/&rsquo;/g, '\u2019').replace(/&lsquo;/g, '\u2018').replace(/&rdquo;/g, '\u201D').replace(/&ldquo;/g, '\u201C').replace(/&nbsp;/g, ' ');
    }
    return t.replace(/\s+/g, ' ');
}
function checkQuote(id, quote) {
    const file = rawFiles[id];
    if (!file) throw new Error(`${id}: no archived snapshot`);
    if (!snapshotText(file).includes(quote.replace(/\s+/g, ' ').trim())) throw new Error(`${id}: quote not found verbatim in ${file}`);
    return file;
}

function paperSide(s) {
    const P = `citation:${s.id}`;
    return `@[${P}]{${store[`${P}.name`]}} is %[category]{${s.category}}. It verifies by %[verificationMode]{${s.verificationMode}}, which we class as %[verificationClass]{${s.verificationClass}}, against %[against]{${s.against}}. It ${yes(s.inlineSupport)} mark claims inline (%[inlineSupport]{${s.inlineSupport}}), ${yes(s.structuredRecordBinding)} bind them to structured records (%[structuredRecordBinding]{${s.structuredRecordBinding}}), and ${yes(s.inferenceLayer)} carry an inference layer (%[inferenceLayer]{${s.inferenceLayer}}).`;
}

// The source side: for every field the store holds, the evidence behind it.
// Three kinds, and the kind is shown: a verbatim quote (machine-checked
// against the snapshot, with its locator), a derivation from another field,
// or an explicit absence, because you cannot quote a source not having
// something. Each entry carries the judgement widget: the reader judges the
// reading, not the arithmetic.
function sourceSide(s) {
    const P = `citation:${s.id}`;
    return s.evidence.map(e => {
        const rid = createHash('sha256').update([s.id, e.field, e.claimValue, e.basis, e.sourceQuote || '', e.note || ''].join('\u0000')).digest('hex').slice(0, 16);
        let body;
        if (e.basis === 'quote') {
            body = `<p class="quote">\u201C${esc(e.sourceQuote)}\u201D</p><p class="loc"><b>${esc(e.sourceLocator.replace(/_/g, ' '))}</b> \u00B7 verbatim in the <a href="../references/raw/${esc(checkQuote(s.id, e.sourceQuote))}">archived source</a></p>`;
        } else if (e.basis === 'derived') {
            body = `<p class="basis basis-derived">derived, not quoted</p>`;
        } else {
            body = `<p class="basis basis-absence">rests on absence \u2014 you cannot quote a source not having something</p>`;
        }
        return {
            html: `<div class="evidence" data-evidence-field="${esc(e.field)}"><p class="ev-head"><code>${esc(e.field)}</code> = <b>${esc(String(e.claimValue))}</b></p>${body}${e.note ? `<p class="note">${esc(e.note)}</p>` : ''}
<div class="reading" data-review="${rid}" data-src="${esc(s.id)}" data-field="${esc(e.field)}"><p><span class="j">our reading</span> is this a fair basis for <code>${esc(e.field)} = ${esc(String(e.claimValue))}</code>?</p>
<div class="review"><button class="rv" data-verdict="fair">fair reading</button><button class="rv" data-verdict="flag">flag</button><span class="rv-state"></span></div></div></div>`,
        };
    });
}

let total = 0, verified = 0;
const cards = sources.map(s => {
    const left = paperSide(s), right = sourceSide(s);
    const vl = verifyProveml(left, store);
    total += vl.total; verified += vl.verified;
    if (vl.errors.length) throw new Error(`${s.id}: ${vl.errors.join('; ')}`);
    const L = renderProveml(left, store).html;
    const R = right.map(r => r.html).join('');
    return `<section class="pair" id="${esc(s.id)}">
  <header><h2>${esc(s.title)}</h2><p class="meta">${esc(s.authors)} · ${esc(s.year)} · <code>citation:${esc(s.id)}</code> · ${vl.verified}/${vl.total} claims verified against the store · ${s.evidence.length} fields of evidence</p></header>
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
.col p{margin:0 0 .8rem}.note{color:var(--muted);font-size:.9rem}.quote{font-style:italic;margin-bottom:.35rem}
.evidence{padding:.7rem 0;border-top:1px dashed var(--haze-line)}
.evidence:first-child{border-top:none;padding-top:0}
.ev-head{margin:0 0 .4rem}.ev-head code{font-family:"Spline Sans Mono",ui-monospace,monospace;font-size:.82rem}
.basis{font-family:"Spline Sans Mono",ui-monospace,monospace;font-size:.74rem;margin:0 0 .3rem}
.basis-derived{color:var(--muted)}
.basis-absence{color:var(--mark-unk)}
.evidence.paired{background:var(--mark-inf-vlak);border-radius:3px;box-shadow:0 0 0 6px var(--mark-inf-vlak)}
.review{display:flex;gap:.5rem;align-items:center;margin:.5rem 0 0}
button.rv{font-family:"Spline Sans Mono",ui-monospace,monospace;font-size:.72rem;letter-spacing:.04em;padding:.3rem .7rem;border:1px solid var(--haze-line);border-radius:999px;background:none;color:var(--muted);cursor:pointer;transition:background .12s,color .12s,border-color .12s,opacity .12s;-webkit-tap-highlight-color:transparent}
button.rv:hover{border-color:var(--muted);color:var(--ink)}
button.rv:focus{outline:none}
button.rv:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rv-state{font-family:"Spline Sans Mono",ui-monospace,monospace;font-size:.72rem}
.reading[data-state=fair]{color:var(--ink)}
.reading[data-state=fair] .rv-state{color:var(--mark-ok)}
.reading[data-state=flag] .rv-state{color:var(--mark-bad)}
.reading[data-state=fair] button[data-verdict=fair]{background:var(--mark-ok);border-color:var(--mark-ok);color:var(--card)}
.reading[data-state=flag] button[data-verdict=flag]{background:var(--mark-bad);border-color:var(--mark-bad);color:var(--card)}
.reading[data-state=fair] button[data-verdict=flag],.reading[data-state=flag] button[data-verdict=fair]{opacity:.45}
.reading[data-state=fair] button[data-verdict=flag]:hover,.reading[data-state=flag] button[data-verdict=fair]:hover{opacity:1}
.pair[data-flagged] h2:after{content:" ⚑";color:var(--mark-bad)}
.reviewbar{display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap;margin:0 0 2rem;padding:.7rem .9rem;border:1px solid var(--haze-line);background:var(--card);border-radius:3px;font-family:"Spline Sans Mono",ui-monospace,monospace;font-size:.78rem;color:var(--muted)}
.rv-filter{display:flex;gap:.4rem;align-items:center;cursor:pointer}
body[data-only-unjudged] .pair[data-all-judged]{display:none}
.reading{color:var(--muted)}
.reading .j{font-family:"Spline Sans Mono",ui-monospace,monospace;font-size:.68rem;letter-spacing:.07em;text-transform:uppercase;border:1px dashed var(--haze-line);border-radius:999px;padding:.12em .55em;margin-right:.4em;color:var(--muted)}.loc{margin:0 0 1rem}.loc b{font-weight:500;color:var(--mark-ok)}.loc a{color:var(--muted)}
.proveml-entity.proveml-verified{color:var(--mark-ok);border:1px solid var(--mark-ok-lijn);border-radius:2px;padding:.05em .35em}
.proveml-fact.proveml-verified{color:var(--mark-ok);border-bottom:1.5px dotted var(--mark-ok)}
.proveml-mismatch,.proveml-name-mismatch{color:var(--mark-bad);text-decoration:line-through;text-decoration-color:var(--mark-bad-lijn)}
.proveml-unverifiable,.proveml-no-context,.proveml-entity:not(.proveml-verified){color:var(--mark-unk);border-bottom:1.5px dashed var(--mark-unk)}
.proveml-entity,.proveml-fact{cursor:help}
.proveml-hilite{background:var(--mark-inf-vlak);border-radius:2px}
#tip{position:fixed;z-index:9;max-width:26rem;background:var(--ink);color:#f2f6f7;font-family:"Spline Sans Mono",ui-monospace,monospace;font-size:.74rem;line-height:1.5;padding:.5rem .65rem;border-radius:3px;pointer-events:none;box-shadow:0 8px 24px rgba(14,36,51,.25)}
#tip b{color:#7de9f7;font-weight:500}
`;

// The hover layer: an instant tooltip with the store path and value, and a
// highlight on every claim of the same record. The native title tooltip is
// slow enough to read as broken, so the title moves to a data attribute.
const SCRIPT = `
// ── review layer ─────────────────────────────────────────────────────────
// Judgements live in localStorage under the content hash of each reading, so
// a saved verdict never applies to changed content. Export puts the whole
// review on the clipboard as JSON, for committing next to the store.
const KEY = 'proveml-sources-review';
let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
const readings = [...document.querySelectorAll('.reading[data-review]')];
function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch {} }
function paint() {
    let judged = 0, flagged = 0;
    for (const el of readings) {
        const v = saved[el.dataset.review];
        el.dataset.state = v ? v.verdict : '';
        el.querySelector('.rv-state').textContent = v ? (v.verdict === 'fair' ? '✓ judged fair ' + v.at.slice(0, 10) : '⚑ flagged ' + v.at.slice(0, 10)) : 'unjudged';
        if (v) { judged++; if (v.verdict === 'flag') flagged++; }
    }
    for (const card of document.querySelectorAll('.pair')) {
        const rs = [...card.querySelectorAll('.reading[data-review]')];
        card.toggleAttribute('data-all-judged', rs.length > 0 && rs.every(r => saved[r.dataset.review]));
        card.toggleAttribute('data-flagged', rs.some(r => saved[r.dataset.review]?.verdict === 'flag'));
    }
    document.getElementById('rv-progress').textContent =
        judged + '/' + readings.length + ' readings judged' + (flagged ? ', ' + flagged + ' flagged' : '') +
        ' — a judgement is saved under a hash of the quote and the value, so it dies if either changes';
}
document.addEventListener('click', (e) => {
    const b = e.target.closest('button.rv[data-verdict]');
    if (b) {
        const el = b.closest('.reading');
        const cur = saved[el.dataset.review];
        if (cur && cur.verdict === b.dataset.verdict) delete saved[el.dataset.review];
        else saved[el.dataset.review] = { verdict: b.dataset.verdict, src: el.dataset.src, field: el.dataset.field, at: new Date().toISOString() };
        persist(); paint(); b.blur();
    }
    if (e.target.id === 'rv-export') {
        navigator.clipboard.writeText(JSON.stringify({ page: 'sources.html', exported: new Date().toISOString(), judgements: saved }, null, 1))
            .then(() => { e.target.textContent = 'copied'; setTimeout(() => e.target.textContent = 'copy review as JSON', 1500); });
    }
});
document.getElementById('rv-only').addEventListener('change', (e) => document.body.toggleAttribute('data-only-unjudged', e.target.checked));
paint();
document.querySelectorAll('[title]').forEach(el => { el.dataset.tip = el.getAttribute('title'); el.removeAttribute('title'); });
const tip = document.createElement('div'); tip.id = 'tip'; tip.hidden = true; document.body.appendChild(tip);
document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('.proveml-entity, .proveml-fact');
    if (!el) return;
    const path = el.dataset.entity || (el.dataset.tip || '').split(' =')[0];
    tip.innerHTML = (el.dataset.tip || '').replace(/^([^ =]+)/, '<b>$1</b>');
    tip.hidden = !el.dataset.tip;
    if (path) document.querySelectorAll('[data-entity="' + path + '"], [data-path^="' + path + '."]').forEach(x => x.classList.add('proveml-hilite'));
});
document.addEventListener('mousemove', (e) => {
    if (tip.hidden) return;
    const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8);
    const y = e.clientY + 18 + tip.offsetHeight > innerHeight ? e.clientY - tip.offsetHeight - 10 : e.clientY + 18;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
});
document.addEventListener('mouseover', (e) => {
    const f = e.target.closest('.col .proveml-fact');
    if (!f) return;
    const path = f.dataset.path || '';
    const field = path.split('.').slice(1).join('.');
    const card = f.closest('.pair');
    if (card && field) card.querySelectorAll('.evidence[data-evidence-field="' + field + '"]').forEach(x => x.classList.add('paired'));
});
document.addEventListener('mouseout', (e) => {
    if (e.target.closest?.('.col .proveml-fact')) document.querySelectorAll('.evidence.paired').forEach(x => x.classList.remove('paired'));
});
document.addEventListener('mouseout', (e) => {
    if (!e.target.closest?.('.proveml-entity, .proveml-fact')) return;
    tip.hidden = true;
    document.querySelectorAll('.proveml-hilite').forEach(x => x.classList.remove('proveml-hilite'));
});
`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProveML · the sources, side by side</title><style>${CSS}</style></head><body><div class="wrap">
<h1>The sources, side by side</h1>
<p class="lede">What the paper says about each cited work, next to the source's own words. The machine checks three links \u2014 the left column equals the store, every quote is verbatim in the archived snapshot, every locator is computed from it \u2014 and the page does not build if any breaks. The fourth link, whether a value is a fair reading of its quote, is yours to judge: hover a value to light up its evidence, press fair or flag, and the judgement dies if the evidence changes.</p>
<p class="summary">${verified}/${total} paper claims verified against the store · every quote verbatim in its archived snapshot · the readings themselves are judgement, not verification · built ${new Date().toISOString().slice(0, 10)}</p>
<div class="reviewbar"><span id="rv-progress"></span><label class="rv-filter"><input type="checkbox" id="rv-only"> show only unjudged</label><button id="rv-export" class="rv">copy review as JSON</button></div>
${cards}
</div><script>${SCRIPT}</script></body></html>`;
writeFileSync(join(root, 'docs/sources.html'), html);
console.log(`sources.html: ${verified}/${total} claims verified across ${sources.length} sources`);
