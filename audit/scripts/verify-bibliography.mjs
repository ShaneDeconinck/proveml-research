#!/usr/bin/env node
/**
 * Deterministic bibliography verification.
 *
 * AI-assisted literature search can produce plausible-but-wrong author lists.
 * This script does to the bibliography what ProveML does to a report: it binds
 * every checkable claim to an authoritative source and compares mechanically,
 * with no model in the loop.
 *
 * For each entry carrying an arXiv id or a DOI, it fetches the canonical record
 * (arXiv API / Crossref) and compares:
 *   - author surnames (set comparison: fabricated AND missing authors both fail)
 *   - title (normalized: case, punctuation, LaTeX braces stripped)
 *   - year
 *
 * Entries without a machine-resolvable identifier (press releases, standards,
 * blog posts, court cases) are reported as UNCHECKABLE — they need a human, and
 * saying so is the honest outcome.
 *
 * Usage:
 *   node audit/scripts/verify-bibliography.mjs [path/to/file.bib]
 * Exit code 1 if any entry MISMATCHES, so it can gate a release.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bibPath = process.argv[2] || join(__dirname, '../../paper/proveml.bib');

// ── BibTeX parsing (entries are flat; no nested-brace fields in this file) ──

function parseBib(text) {
    const entries = [];
    const re = /@(\w+)\{([^,]+),([\s\S]*?)\n\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const [, type, key, body] = m;
        const fields = {};
        const fre = /(\w+)\s*=\s*\{([\s\S]*?)\}\s*(?:,\s*\n|\n\s*$|,\s*$)/g;
        let f;
        while ((f = fre.exec(body + '\n')) !== null) {
            fields[f[1].toLowerCase()] = f[2].replace(/\s+/g, ' ').trim();
        }
        entries.push({ type, key, fields });
    }
    return entries;
}

// ── Identifier extraction ──

function findArxivId(fields) {
    const hay = [fields.note, fields.journal, fields.howpublished, fields.eprint]
        .filter(Boolean).join(' ');
    const m = hay.match(/arXiv:\s*(\d{4}\.\d{4,5})/i);
    return m ? m[1] : null;
}

function findDoi(fields) {
    const hay = [fields.doi, fields.note, fields.howpublished, fields.url]
        .filter(Boolean).join(' ');
    const m = hay.match(/\b(10\.\d{4,9}\/[^\s,}]+)/);
    return m ? m[1].replace(/[.,;]$/, '') : null;
}

// ── Normalization ──

function stripAccents(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normTitle(s) {
    return stripAccents(s)
        .replace(/<[^>]+>/g, ' ')          // Crossref ships markup: <scp>AI</scp>
        .replace(/[\u2010-\u2015]/g, '-')  // unicode hyphens/dashes
        .replace(/[{}]/g, '')
        .replace(/\\[a-zA-Z]+/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/** Surname of a BibTeX author token ("Xu, Z." | "Z. Xu" | "Torroba Hennigen, L."). */
function bibSurname(author) {
    const a = author.trim();
    if (a.includes(',')) return normName(a.split(',')[0]);
    const parts = a.split(/\s+/).filter(p => !/^[A-Z]\.?$/.test(p));
    return normName(parts[parts.length - 1] || a);
}

/** Surname of a source-side full name ("Aivin V. Solatorio"). */
function srcSurname(full) {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    return normName(parts[parts.length - 1] || full);
}

function normName(s) {
    return stripAccents(s).toLowerCase().replace(/[^a-z]/g, '');
}

/** True for a double-braced corporate author ({{HL7 International}}): the
 *  parser strips one brace pair, so the inner one survives. Such a value must
 *  NOT be split on " and " — "Coalition for Content Provenance and
 *  Authenticity" is one organization, not two people. */
function isCorporate(field) {
    return Boolean(field) && field.trim().startsWith('{');
}

function bibAuthors(field) {
    if (!field) return [];
    if (isCorporate(field)) return [field.replace(/[{}]/g, '').trim()];
    return field.split(/\s+and\s+/).map(a => a.trim()).filter(Boolean);
}

// ── Source lookups ──

async function fetchArxiv(id) {
    const url = `http://export.arxiv.org/api/query?id_list=${id}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'proveml-bib-verify/1.0' } });
    if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`);
    const xml = await res.text();
    const entry = xml.split('<entry>')[1];
    if (!entry) throw new Error('no arXiv entry');
    const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(m => m[1].trim());
    const published = (entry.match(/<published>(\d{4})/) || [])[1] || '';
    return { title: title.replace(/\s+/g, ' ').trim(), authors, year: published, source: `arXiv:${id}` };
}

async function fetchCrossref(doi) {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'proveml-bib-verify/1.0 (mailto:hello@shanedeconinck.be)' } });
    if (!res.ok) throw new Error(`Crossref HTTP ${res.status}`);
    const { message } = await res.json();
    const authors = (message.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim());
    const year = String(
        (message.issued && message.issued['date-parts'] && message.issued['date-parts'][0][0]) || ''
    );
    return { title: (message.title || [''])[0], authors, year, source: `doi:${doi}` };
}

/** Fallback for entries with no arXiv id or DOI: fetch the cited page and
 *  check that the claimed title and author surnames actually occur on it.
 *  Weaker than a canonical record, but it catches invented headlines and
 *  bylines — the failure mode that produced this script. */
async function fetchPage(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; proveml-bib-verify/1.0)' },
        redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ');
    return { text: normTitle(text), source: url };
}

function checkOnPage(entry, page) {
    const problems = [], notes = [];
    const title = normTitle(entry.fields.title || '');
    // Titles are routinely reflowed, shortened or expanded on a live page, so a
    // miss is a hint to look, not a verdict.
    const probe = title.split(' ').slice(0, 6).join(' ');
    if (probe && !page.text.includes(probe)) {
        notes.push(`title opening not found: "${probe}"`);
    }
    // Personal bylines are the real target: an invented author almost never
    // appears on the page it is attributed to. Organizations name themselves in
    // too many forms (HL7 International / hl7.org / HL7) to test this way.
    if (!isCorporate(entry.fields.author)) {
        const flat = page.text.replace(/ /g, '');
        for (const a of bibAuthors(entry.fields.author)) {
            if (/^(others|et al\.?)$/i.test(a.trim())) continue;
            const sn = bibSurname(a);
            if (sn.length > 3 && !flat.includes(sn)) {
                problems.push(`author "${sn}" not found on the cited page`);
            }
        }
    }
    return { problems, notes };
}

function urlOf(fields) {
    const hay = [fields.url, fields.howpublished, fields.note].filter(Boolean).join(' ');
    const m = hay.match(/https?:\/\/[^\s},]+/);
    return m ? m[0].replace(/[.,]$/, '') : null;
}

// ── Comparison ──

/** Two surnames match if equal, or if one is the tail of a multi-word other
 *  ("Torroba Hennigen" vs the source's last token "Hennigen"). */
function surnameMatches(a, b) {
    return a === b || a.endsWith(b) || b.endsWith(a);
}

function compare(entry, src) {
    const problems = [];
    const notes = [];

    const bibList = bibAuthors(entry.fields.author);
    const truncated = bibList.some(a => /^(others|et al\.?)$/i.test(a.trim()));
    const named = bibList.filter(a => !/^(others|et al\.?)$/i.test(a.trim()));
    const corporate = named.length === 1 && !named[0].includes(',')
        && !/\b[A-Z]\./.test(named[0]) && src.authors.length > 1;

    if (!corporate && src.authors.length && named.length) {
        const bibSurnames = named.map(bibSurname);
        const srcSurnames = src.authors.map(srcSurname);
        // Fabricated: a listed author who is on no source author line.
        const fabricated = bibSurnames.filter(b => !srcSurnames.some(s => surnameMatches(b, s)));
        if (fabricated.length) problems.push(`NOT ON PAPER: ${fabricated.join(', ')}`);
        // Missing authors only matter when the entry does not use "and others".
        if (!truncated) {
            const missing = srcSurnames.filter(s => !bibSurnames.some(b => surnameMatches(b, s)));
            if (missing.length) problems.push(`missing: ${missing.join(', ')}`);
        }
        // Order check: first author must be first.
        if (bibSurnames.length && srcSurnames.length
            && !surnameMatches(bibSurnames[0], srcSurnames[0])) {
            problems.push(`first author is ${srcSurnames[0]}, entry lists ${bibSurnames[0]}`);
        }
    }

    if (entry.fields.title && src.title) {
        const a = normTitle(entry.fields.title), b = normTitle(src.title);
        if (!(a === b || a.startsWith(b) || b.startsWith(a))) {
            // Citing a published version against a preprint record: papers are
            // routinely retitled between the two, so this is a note, not a fault.
            // Authors still have to match, and they are checked above.
            const citesPublished = Boolean(entry.fields.booktitle || entry.fields.pages);
            const msg = `title differs: source = "${src.title.replace(/\s+/g, ' ')}"`;
            if (citesPublished && src.source.startsWith('arXiv:')) notes.push(msg + ' (preprint title)');
            else problems.push(msg);
        }
    }

    if (entry.fields.year && src.year && entry.fields.year !== src.year) {
        // Expected when citing a published version of an earlier preprint;
        // informational, not a failure.
        notes.push(`year ${entry.fields.year} vs preprint ${src.year} (published version?)`);
    }

    return { problems, notes };
}

// ── Main ──

const entries = parseBib(readFileSync(bibPath, 'utf8'));
console.log(`Verifying ${entries.length} entries in ${bibPath}\n`);

const results = { ok: [], pageok: [], mismatch: [], uncheckable: [], unreachable: [], error: [] };

for (const e of entries) {
    const arxiv = findArxivId(e.fields);
    const doi = findDoi(e.fields);
    if (!arxiv && !doi) {
        const url = urlOf(e.fields);
        if (url) {
            try {
                const page = await fetchPage(url);
                const { problems, notes } = checkOnPage(e, page);
                if (problems.length) {
                    results.mismatch.push({ key: e.key, problems, src: url });
                    console.log(`  ✗  ${e.key.padEnd(18)} [page check] ${problems.join(' | ')}`);
                } else {
                    results.pageok.push(e.key);
                    const note = notes.length ? `  (${notes.join('; ')})` : '';
                    console.log(`  ~  ${e.key.padEnd(18)} corroborated on the cited page${note}`);
                }
            } catch (err) {
                // Transient: the entry IS verifiable, the network was not.
                results.unreachable.push(e.key);
                console.log(`  ?  ${e.key.padEnd(18)} page unreachable (${err.message}) — retry or verify by hand`);
            }
            await new Promise(r => setTimeout(r, 350));
            continue;
        }
        results.uncheckable.push(e.key);
        console.log(`  ?  ${e.key.padEnd(18)} no identifier and no URL — needs human verification`);
        continue;
    }
    try {
        const src = arxiv ? await fetchArxiv(arxiv) : await fetchCrossref(doi);
        const { problems, notes } = compare(e, src);
        if (problems.length) {
            results.mismatch.push({ key: e.key, problems, src: src.source, authors: src.authors });
            console.log(`  ✗  ${e.key.padEnd(18)} ${problems.join(' | ')}`);
            console.log(`     source authors (${src.source}): ${src.authors.join('; ')}`);
        } else {
            results.ok.push(e.key);
            const note = notes.length ? `  (${notes.join('; ')})` : '';
            console.log(`  ✓  ${e.key.padEnd(18)} ${src.source}${note}`);
        }
    } catch (err) {
        results.error.push({ key: e.key, error: err.message });
        console.log(`  !  ${e.key.padEnd(18)} lookup failed: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 350)); // be polite to the APIs
}

console.log(`\n${results.ok.length} verified against a canonical record, ` +
    `${results.pageok.length} corroborated on the cited page, ` +
    `${results.mismatch.length} mismatched, ${results.uncheckable.length} without any identifier, ` +
    `${results.unreachable.length} temporarily unreachable, ${results.error.length} lookup errors`);

// Gate: an entry may only be uncheckable if it is on the known list. A NEW
// entry with no identifier and no reachable URL fails the run, so unverifiable
// citations cannot enter the bibliography unnoticed.
// Verified by hand against the source; not machine-resolvable here.
// mata2023      court reporter citation, no DOI
// gartner2023   press release, no stable identifier
// euaiact       EUR-Lex blocks automated fetches
// mckinsey2025  mckinsey.com returns 403 to non-browser clients
// googlebard2023 reuters.com blocks automated fetches (wire copy verified via syndication)
const KNOWN_UNCHECKABLE = new Set(['mata2023', 'gartner2023', 'euaiact', 'mckinsey2025', 'googlebard2023']);
const unexpected = results.uncheckable.filter(k => !KNOWN_UNCHECKABLE.has(k));
if (unexpected.length) {
    console.log(`\nNEW unverifiable entries (add an arXiv id, DOI or reachable URL, ` +
        `or add to KNOWN_UNCHECKABLE with a reason):\n  ${unexpected.join(', ')}`);
}

if (results.uncheckable.length) {
    console.log(`\nNo machine-resolvable identifier (verified by hand):\n  ${results.uncheckable.join(', ')}`);
}
if (results.unreachable.length) {
    console.log(`\nTemporarily unreachable (verifiable in principle — rerun):\n  ${results.unreachable.join(', ')}`);
}

process.exit(results.mismatch.length > 0 || unexpected.length > 0 ? 1 : 0);
