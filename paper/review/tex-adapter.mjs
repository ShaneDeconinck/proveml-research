#!/usr/bin/env node
// TeX adapter for Vera: a .tex file -> ordered blocks the review page can read.
// Dependency-free. Headings stay headings, tables become text a reader can
// check cell by cell, listings and \texttt examples become code (which the
// verifier skips, so an example of the markup never parses as a claim),
// citations resolve to author-year from the .bib beside the paper, and \ref
// resolves to the section, figure or table number. Nothing is summarised.
//
// Usage: node tex-adapter.mjs paper.tex > blocks.json
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const texPath = process.argv[2];
const src = readFileSync(texPath, 'utf8');
let body = src.split('\\begin{document}')[1] || src;
body = body.split('\\end{document}')[0];

// ---- bibliography: key -> "Surname et al., 2023" ----
const bib = {};
const bibFile = (src.match(/\\bibliography\{([^}]*)\}/) || [])[1];
const bibPath = bibFile ? join(dirname(texPath), bibFile + '.bib') : null;
if (bibPath && existsSync(bibPath)) {
  const text = readFileSync(bibPath, 'utf8');
  for (const m of text.matchAll(/@\w+\{([^,]+),([\s\S]*?)\n\}/g)) {
    const key = m[1].trim(), fields = m[2];
    const f = (name) => { const r = fields.match(new RegExp('\\b' + name + '\\s*=\\s*\\{((?:[^{}]|\\{[^{}]*\\})*)\\}', 'i')); return r ? r[1].trim() : ''; };
    const rawAuthor = (fields.match(/\bauthor\s*=\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/i) || [])[1] || '';
    const parts = []; { let d = 0, cur = '';
      for (let i = 0; i < rawAuthor.length; i++) { const ch = rawAuthor[i];
        if (ch === '{') d++; else if (ch === '}') d--;
        if (d === 0 && rawAuthor.slice(i, i + 5) === ' and ') { parts.push(cur); cur = ''; i += 4; continue; }
        cur += ch; }
      parts.push(cur); }
    const authors = parts.map((a) => a.trim()).filter(Boolean).map((a) => a.startsWith('{') ? a.replace(/[{}]/g, '').trim() : (a.includes(',') ? a.split(',')[0].replace(/[{}]/g, '').trim() : a.replace(/[{}]/g, '').trim().split(/\s+/).pop()));
    const who = authors.length === 0 || !authors[0] ? key : authors.length === 1 ? authors[0] : authors.length === 2 ? authors[0] + ' and ' + authors[1] : authors[0] + ' et al.';
    bib[key] = { who, year: f('year') || 'n.d.', authors, title: f('title'), venue: f('journal') || f('booktitle') || f('howpublished') || f('publisher') || f('institution') || '', doi: f('doi'), url: f('url'), note: f('note') };
  }
}
const cited = new Set();
const tag = (k, label) => `\u27e6c:${k.trim()}\u27e7${label}\u27e6/c\u27e7`;
const citeOne = (k) => { cited.add(k.trim()); const b = bib[k.trim()]; return tag(k, b ? `${b.who}, ${b.year}` : `[${k.trim()}]`); };
const citeT = (k) => { cited.add(k.trim()); const b = bib[k.trim()]; return tag(k, b ? `${b.who} (${b.year})` : `[${k.trim()}]`); };

// ---- labels: \ref -> section / figure / table number ----
const labels = {};
{
  let sec = 0, sub = 0, fig = 0, tab = 0, appendix = false, inEnv = null, envNo = '';
  const re = /\\(section|subsection)\*?\{[^}]*\}|\\appendix|\\begin\{(figure|table)\}|\\end\{(figure|table)\}|\\label\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(body))) {
    if (m[0] === '\\appendix') { appendix = true; sec = 0; continue; }
    if (m[1] === 'section') { sec++; sub = 0; continue; }
    if (m[1] === 'subsection') { sub++; continue; }
    if (m[2] === 'figure') { inEnv = 'Figure'; envNo = String(++fig); continue; }
    if (m[2] === 'table') { inEnv = 'Table'; envNo = String(++tab); continue; }
    if (m[3]) { inEnv = null; continue; }
    if (m[4]) {
      const secNo = appendix ? String.fromCharCode(64 + sec) : String(sec);
      labels[m[4]] = inEnv ? envNo : (sub ? `${secNo}.${sub}` : secNo);
    }
  }
}

// ---- inline cleanup, applied to prose (not listings) ----
const inline = (t) => {
  let s = t;
  s = s.replace(/\\\{/g, '{').replace(/\\\}/g, '}');                 // escaped braces first, so examples keep theirs
  s = s.replace(/\\texttt\{((?:[^{}]|\{[^{}]*\})*)\}/g, (m, x) => '`' + x.replace(/\\%/g, '%').replace(/\\_/g, '_').replace(/\\&/g, '&').replace(/\\\$/g, '$') + '`');
  for (let i = 0; i < 6; i++) s = s.replace(/\\(textbf|textit|emph|textsc|underline|mbox|text|footnotesize|small)\{([^{}]*)\}/g, '$2');
  s = s.replace(/\\footnote\{((?:[^{}]|\{[^{}]*\})*)\}/g, ' (note: $1)');
  s = s.replace(/\\url\{([^}]*)\}/g, '$1');
  s = s.replace(/\\citep(?:\[[^\]]*\])?\{([^}]*)\}/g, (m, ks) => '(' + ks.split(',').map(citeOne).join('; ') + ')');
  s = s.replace(/\\citet(?:\[[^\]]*\])?\{([^}]*)\}/g, (m, ks) => ks.split(',').map(citeT).join('; '));
  s = s.replace(/\\(citealp|cite)(?:\[[^\]]*\])?\{([^}]*)\}/g, (m, c, ks) => ks.split(',').map(citeOne).join('; '));
  s = s.replace(/\\(ref|autoref|eqref|pageref)\{([^}]*)\}/g, (m, c, k) => labels[k] || '?');
  s = s.replace(/\\label\{[^}]*\}/g, '');
  s = s.replace(/\\(vspace|hspace|needspace)\{[^}]*\}/g, '');
  s = s.replace(/\\pm/g, '±').replace(/\\mu/g, 'µ').replace(/\\checkmark/g, '✓').replace(/\{,\}/g, ',');
  s = s.replace(/\\texteuro/g, '€').replace(/\\ldots/g, '…').replace(/\\,/g, ' ').replace(/~/g, ' ');
  s = s.replace(/\\%/g, '%').replace(/\\_/g, '_').replace(/\\&/g, '&').replace(/\\\$/g, '$').replace(/\\#/g, '#');
  s = s.replace(/---/g, '—').replace(/--/g, '–');
  s = s.replace(/``|''/g, '"');
  s = s.replace(/\$([^$]*)\$/g, (m, inner) => inner.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1').replace(/\\[a-zA-Z]+/g, ''));
  s = s.replace(/\\\\/g, ' ');
  s = s.replace(/\\[a-zA-Z]+\*?\{([^{}]*)\}/g, '$1');   // any other \cmd{X} -> X
  s = s.replace(/\\[a-zA-Z]+\*?/g, '');                  // bare commands
  s = s.replace(/\[(h|H|t|b|htbp|nosep)\]/g, '');
  s = s.trim().replace(/^\{\{([\s\S]*)\}\}$/, '$1').replace(/^\{([\s\S]*)\}$/, '$1');
  return s.replace(/[ \t]+/g, ' ').replace(/ \n/g, '\n').trim();
};

// ---- tables: rows to lines, cells joined with " | " ----
const table = (env) => {
  const cap = (env.match(/\\caption\{((?:[^{}]|\{[^{}]*\})*)\}/) || [])[1];
  const tab = (env.match(/\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/) || [])[1] || '';
  const rows = tab.split('\\\\').map((r) => r.replace(/\\(toprule|midrule|bottomrule|hline)/g, '').trim()).filter(Boolean)
    .map((r) => r.replace(/\\multicolumn\{\d+\}\{[^}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1'))
    .map((r) => r.split('&').map((c) => inline(c)).join(' | '));
  return { rows, caption: cap ? inline(cap) : '' };
};

const blocks = [];
const push = (kind, text, extra = {}) => { if (text && text.trim()) blocks.push({ kind, text: text.trim(), ...extra }); };
let figN = 0, tabN = 0;

const re = /\\begin\{(abstract|figure|table|lstlisting|itemize|enumerate|algorithm)\}(\[[^\]]*\])?([\s\S]*?)\\end\{\1\}/g;
let last = 0, m;
const prose = (chunk) => {
  for (let p of chunk.split(/\n\s*\n/)) {
    p = p.trim(); if (!p) continue;
    if (/^\\maketitle/.test(p) || /^\\(bibliography|bibliographystyle)/.test(p)) continue;
    if (/^\\appendix/.test(p)) { push('heading', 'Appendix', { level: 1 }); continue; }
    let hm;
    if ((hm = p.match(/^\\section\*?\{([^}]*)\}\s*([\s\S]*)$/))) { push('heading', inline(hm[1]), { level: 1 }); if (hm[2].trim()) prose(hm[2]); continue; }
    if ((hm = p.match(/^\\subsection\*?\{([^}]*)\}\s*([\s\S]*)$/))) { push('heading', inline(hm[1]), { level: 2 }); if (hm[2].trim()) prose(hm[2]); continue; }
    if ((hm = p.match(/^\\paragraph\{([^}]*)\}\s*([\s\S]*)$/))) { push('para', inline(hm[1]) + ' ' + inline(hm[2]), { lead: inline(hm[1]) }); continue; }
    if ((hm = p.match(/^\\title\{([\s\S]*)\}$/))) { push('heading', inline(hm[1]), { level: 0 }); continue; }
    if ((hm = p.match(/^\\author\{([\s\S]*)\}$/))) { push('para', inline(hm[1].replace(/\\\\/g, ', '))); continue; }
    if (/^\\date\{/.test(p)) continue;
    if (/^\\noindent\\textbf\{Keywords:\}/.test(p)) { push('para', 'Keywords: ' + inline(p.replace(/^\\noindent\\textbf\{Keywords:\}/, ''))); continue; }
    push('para', inline(p));
  }
};
while ((m = re.exec(body))) {
  prose(body.slice(last, m.index));
  const [, env, , inner] = m;
  if (env === 'abstract') { push('heading', 'Abstract', { level: 1 }); prose(inner); }
  else if (env === 'lstlisting') push('code', '```\n' + inner.replace(/^\n+|\n+$/g, '') + '\n```');
  else if (env === 'table') { tabN++; const t = table(m[0]); push('table', t.rows.join('\n'), { caption: t.caption }); if (t.caption) push('para', `Table ${tabN}: ` + t.caption); }
  else if (env === 'figure') { figN++; const cap = (m[0].match(/\\caption\{((?:[^{}]|\{[^{}]*\})*)\}/) || [])[1]; const img = (m[0].match(/\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/) || [])[1]; push(img ? 'figure' : 'para', `Figure ${figN}: ` + (cap ? inline(cap) : ''), img ? { file: img } : {}); }
  else if (env === 'itemize' || env === 'enumerate') { for (const it of inner.split(/\\item\s*/).map((x) => x.trim()).filter(Boolean)) push('para', '- ' + inline(it)); }
  else if (env === 'algorithm') push('code', '```\n' + inline(inner) + '\n```');
  last = m.index + m[0].length;
}
prose(body.slice(last));

if (cited.size) {
  push('heading', 'References', { level: 1 });
  const entries = [...cited].filter((k) => bib[k]).sort((a, b) => (bib[a].who + bib[a].year).localeCompare(bib[b].who + bib[b].year));
  for (const k of entries) {
    const e = bib[k];
    const names = e.authors.length <= 1 ? e.authors.join('') : e.authors.slice(0, -1).join(', ') + ' and ' + e.authors[e.authors.length - 1];
    const cl = (x) => inline(x).replace(/[{}]/g, '');
    const parts = [cl(names) + ' (' + cl(e.year) + ').', e.title ? cl(e.title) + '.' : '', e.venue ? cl(e.venue) + '.' : '', e.doi ? 'doi:' + cl(e.doi) : (e.url ? cl(e.url) : '')];
    push('para', parts.filter(Boolean).join(' '), { ref: k, refTitle: e.title ? cl(e.title) : '', refYear: cl(e.year) });
  }
  for (const k of [...cited].filter((k) => !bib[k])) push('para', '[' + k + '] (not in the bibliography file)', { ref: k });
}

process.stdout.write(JSON.stringify(blocks, null, 1) + '\n');
