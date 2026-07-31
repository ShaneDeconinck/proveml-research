#!/usr/bin/env node
/**
 * Citation checklist for a human read-through.
 *
 * The bibliography verifier checks metadata: are these the right authors, is
 * this the right title. It cannot check the thing that actually matters — does
 * the sentence in the paper describe what the cited work does.
 *
 * This prints, per reference, every sentence that cites it, next to the source
 * details and a link. Read the sentence, open the link, decide. That is the one
 * pass no script can do for you.
 *
 * Usage: node audit/scripts/citation-checklist.mjs > checklist.md
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tex = readFileSync(join(__dirname, '../../paper/proveml-spec.tex'), 'utf8');
const bib = readFileSync(join(__dirname, '../../paper/proveml.bib'), 'utf8');

// ── bibliography ──

const entries = {};
for (const m of bib.matchAll(/@(\w+)\{([^,]+),([\s\S]*?)\n\}/g)) {
    const fields = {};
    for (const f of (m[3] + '\n').matchAll(/(\w+)\s*=\s*\{([\s\S]*?)\}\s*(?:,\s*\n|\n\s*$|,\s*$)/g)) {
        fields[f[1].toLowerCase()] = f[2].replace(/\s+/g, ' ').replace(/[{}]/g, '').trim();
    }
    entries[m[2].trim()] = fields;
}

function link(f) {
    const hay = [f.doi, f.url, f.howpublished, f.note, f.journal].filter(Boolean).join(' ');
    const doi = hay.match(/\b10\.\d{4,9}\/[^\s,}]+/);
    if (doi) return `https://doi.org/${doi[0].replace(/[.,]$/, '')}`;
    const arx = hay.match(/arXiv:\s*(\d{4}\.\d{4,5})/i);
    if (arx) return `https://arxiv.org/abs/${arx[1]}`;
    const url = hay.match(/https?:\/\/[^\s},]+/);
    return url ? url[0] : '(no link in the entry)';
}

// ── sentences that cite ──

/** Split the body into sentences, keeping it crude but predictable. */
function sentences(text) {
    return text
        .split(/(?<=[.!?])\s+(?=[A-Z\\`"“])/)
        .map(s => s.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
}

// strip preamble, figures, tables and listings: they carry no prose claims
let body = tex.slice(tex.indexOf('\\section{Introduction}'));
body = body.replace(/\\begin\{lstlisting\}[\s\S]*?\\end\{lstlisting\}/g, ' ')
    .replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, ' ')
    .replace(/\\begin\{algorithmic\}[\s\S]*?\\end\{algorithmic\}/g, ' ');

const perKey = {};
for (const sentence of sentences(body)) {
    for (const c of sentence.matchAll(/\\cite[tp]?\{([^}]+)\}/g)) {
        for (const key of c[1].split(',').map(k => k.trim())) {
            (perKey[key] ||= []).push(sentence);
        }
    }
}

// ── output ──

const keys = Object.keys(entries).sort();
const uncited = keys.filter(k => !perKey[k]);

console.log('# Citation checklist\n');
console.log('For each reference: read what the paper says it does, open the source, and decide');
console.log('whether the sentence is a fair description. Metadata is already machine-checked');
console.log('(`npm run audit:bibliography`); this is the part that needs a person.\n');
console.log(`${keys.length} references, ${keys.length - uncited.length} cited in prose.\n`);
console.log('---\n');

for (const key of keys) {
    const f = entries[key];
    const claims = perKey[key];
    if (!claims) continue;

    console.log(`## ${key}\n`);
    console.log(`**${f.title || '(no title)'}**  `);
    console.log(`${f.author || '(no author)'} · ${f.booktitle || f.journal || f.howpublished || ''} ${f.year || ''}  `);
    console.log(`<${link(f)}>\n`);
    console.log(`What the paper claims (${claims.length} ${claims.length === 1 ? 'place' : 'places'}):\n`);
    for (const c of claims) {
        // make the sentence readable outside LaTeX
        const clean = c
            .replace(/\\cite[tp]?\{[^}]+\}/g, '')
            .replace(/\\text(bf|it)\{([^}]*)\}/g, '$2')
            .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
            .replace(/\\[a-zA-Z]+/g, '')
            .replace(/[{}]/g, '')
            .replace(/``|''/g, '"')
            .replace(/\s+/g, ' ')
            .replace(/ ([.,;:])/g, '$1')
            .trim();
        console.log(`- ${clean}`);
    }
    console.log('\n- [ ] checked\n');
}

if (uncited.length) {
    console.log('---\n');
    console.log('## Not cited in prose\n');
    console.log('These appear only in the bibliography — either cite them or drop them:\n');
    for (const k of uncited) console.log(`- \`${k}\` — ${entries[k].title || ''}`);
}
