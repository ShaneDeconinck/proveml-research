#!/usr/bin/env node

import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { createRenderer } from 'proveml/renderer';
import { educationFactStore, paperExampleSources } from 'proveml/paper-examples';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const paperDir = join(rootDir, 'paper');
const panelsDir = join(paperDir, 'panels');

mkdirSync(panelsDir, { recursive: true });

const renderer = createRenderer(educationFactStore);

const BASE_CSS = `
:root {
  --ink: #221f1b;
  --muted: #6c6861;
  --line: #d9d4cc;
  --entity: #1a7a6d;
  --violet: #6b4c9a;
  --blue: #2f6fb3;
  --red: #b64236;
  --amber: #a87510;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 28px 34px;
  background: #ffffff;
  color: var(--ink);
  font-family: Charter, Georgia, "Times New Roman", serif;
}

.page {
  width: 980px;
}

.panel-title {
  margin: 0 0 10px;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}

.narrative {
  font-size: 28px;
  line-height: 1.72;
}

.narrative p {
  margin: 0 0 18px;
}

.meta {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 15px;
  color: var(--muted);
}

.proveml-entity {
  color: var(--entity-color, var(--entity));
  border-bottom: 1.6px solid var(--entity-color, var(--entity));
  text-decoration: none;
}

.proveml-entity.proveml-name-mismatch,
.proveml-entity.proveml-unverifiable {
  color: var(--red);
  border-bottom-color: var(--red);
}

.proveml-fact {
  padding: 0 1px;
}

.proveml-fact.proveml-verified {
  border-bottom: 1.8px dotted var(--entity-color, var(--entity));
}

.proveml-fact.proveml-verified::after,
.proveml-inference.proveml-verified::after {
  content: '✓';
  margin-left: 2px;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 0.48em;
  font-weight: 700;
  vertical-align: super;
}

.proveml-fact.proveml-verified::after {
  color: var(--entity-color, var(--entity));
}

.proveml-inference.proveml-verified::after {
  color: var(--violet);
}

.proveml-fact.proveml-mismatch {
  border-bottom: 1.8px dotted var(--red);
  color: var(--red);
}

.proveml-fact.proveml-mismatch::after,
.proveml-inference.proveml-failed::after {
  content: '✗';
  margin-left: 2px;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 0.48em;
  font-weight: 700;
  vertical-align: super;
  color: var(--red);
}

.proveml-fact.proveml-unverifiable,
.proveml-fact.proveml-no-context {
  border-bottom: 1.8px dotted var(--amber);
  color: var(--amber);
}

.proveml-fact.proveml-unverifiable::after,
.proveml-fact.proveml-no-context::after {
  content: '?';
  margin-left: 2px;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 0.48em;
  font-weight: 700;
  vertical-align: super;
  color: var(--amber);
}

.proveml-inference.proveml-verified {
  border-bottom: 1.8px dashed var(--violet);
}

.proveml-inference.proveml-failed {
  border-bottom: 1.8px dashed var(--red);
  color: var(--red);
}

.proof-path,
.proveml-proof {
  margin-left: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.62em;
  color: var(--muted);
  white-space: nowrap;
}

pre.source {
  margin: 0;
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 19px;
  line-height: 1.65;
  color: #27231f;
}

.index {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 18px;
  line-height: 1.6;
}

.index h1 {
  margin: 0 0 10px;
  font-size: 28px;
}

.index ul {
  margin: 0;
  padding-left: 20px;
}

.index a {
  color: #184e97;
  text-decoration: none;
}
`;

function escapeHtml(text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

function wrapHtml(title, body, meta = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="page">
    <div class="panel-title">${escapeHtml(title)}</div>
    ${body}
    ${meta ? `<div class="meta">${meta}</div>` : ''}
  </div>
</body>
</html>`;
}

function renderNarrative(source, { audit = false } = {}) {
    return renderer.render(source, { showProofPaths: audit });
}

function writePanel(filename, title, body, meta) {
    const path = join(panelsDir, filename);
    writeFileSync(path, wrapHtml(title, body, meta));
    return path;
}

function buildPanels() {
    const generated = [];

    const verify = renderNarrative(paperExampleSources.verifyCorrect);
    generated.push(writePanel(
        'verify-correct.html',
        'Verify mode: all claims verified',
        `<div class="narrative">${verify.html}</div>`,
        `${verify.verification.verified}/${verify.verification.total} ProveML checks verified`
    ));

    const audit = renderNarrative(paperExampleSources.verifyCorrect, { audit: true });
    generated.push(writePanel(
        'audit-mode.html',
        'Audit mode: proof paths visible inline',
        `<div class="narrative">${audit.html}</div>`,
        `${audit.verification.verified}/${audit.verification.total} ProveML checks verified; proof paths shown inline`
    ));

    const suggestionsRender = renderNarrative(paperExampleSources.verifySuggestions);
    generated.push(writePanel(
        'verify-suggestions.html',
        'Verified claims with plain exploratory prose',
        `<div class="narrative">${suggestionsRender.html}<p style="color: var(--muted);">${escapeHtml(paperExampleSources.verifySuggestionsPlain)}</p></div>`,
        `${suggestionsRender.verification.verified}/${suggestionsRender.verification.total} ProveML checks verified; exploratory prose remains unchecked`
    ));

    const errorsRender = renderNarrative(paperExampleSources.verifyErrors);
    generated.push(writePanel(
        'verify-errors.html',
        'Verifier failures',
        `<div class="narrative">${errorsRender.html}</div>`,
        `${errorsRender.verification.verified}/${errorsRender.verification.total} ProveML checks verified; deterministic failures shown inline`
    ));

    generated.push(writePanel(
        'source-markup.html',
        'ProveML source markup',
        `<pre class="source">${escapeHtml(paperExampleSources.verifyCorrect)}</pre>`,
        'Same source used to generate the verified and audit views'
    ));

    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProveML Paper Panels</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="page index">
    <h1>ProveML Paper Panels</h1>
    <p>These panels are generated from the real ProveML renderer and deterministic verifier.</p>
    <ul>
      <li><a href="./verify-correct.html">verify-correct.html</a></li>
      <li><a href="./verify-suggestions.html">verify-suggestions.html</a></li>
      <li><a href="./verify-errors.html">verify-errors.html</a></li>
      <li><a href="./audit-mode.html">audit-mode.html</a></li>
      <li><a href="./source-markup.html">source-markup.html</a></li>
    </ul>
  </div>
</body>
</html>`;
    writeFileSync(join(panelsDir, 'index.html'), indexHtml);

    return generated;
}

function generatePngs(htmlPaths) {
    const mapping = new Map([
        ['verify-correct.html', 'fig-verify-correct.png'],
        ['verify-suggestions.html', 'fig-verify-suggestions.png'],
        ['verify-errors.html', 'fig-verify-errors.png'],
        ['audit-mode.html', 'fig-audit-mode.png'],
        ['source-markup.html', 'fig-source-markup.png'],
    ]);

    for (const htmlPath of htmlPaths) {
        const filename = htmlPath.split('/').pop();
        const pngName = `${filename}.png`;
        const thumbPath = join(panelsDir, pngName);
        rmSync(thumbPath, { force: true });
        try {
            execFileSync('/usr/bin/qlmanage', ['-t', '-s', '2200', '-o', panelsDir, htmlPath], { stdio: 'ignore' });
        } catch (error) {
            // Quick Look can return a non-zero exit code in sandboxed sessions even when it
            // still writes the requested thumbnail. Fall through if the thumbnail exists.
            if (!existsSync(thumbPath)) {
                throw error;
            }
        }
        renameSync(thumbPath, join(paperDir, mapping.get(filename)));
    }
}

const htmlPaths = buildPanels();
if (process.argv.includes('--png')) {
    generatePngs(htmlPaths);
}

console.log(`Generated ${htmlPaths.length} paper panels in ${panelsDir}`);
if (process.argv.includes('--png')) {
    console.log('Updated paper figure PNGs from generated panels.');
}
