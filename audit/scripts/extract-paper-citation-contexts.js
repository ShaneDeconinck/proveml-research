import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const defaultSource = '/Users/shanedeconinck/Projects/naviskore-viz/docs/proveml-spec.tex';
const sourceArgIndex = process.argv.indexOf('--source');
const sourcePath = sourceArgIndex >= 0 ? process.argv[sourceArgIndex + 1] : defaultSource;
const outputPath = path.join(repoRoot, 'references', 'paper-citation-contexts.json');

if (!sourcePath || !fs.existsSync(sourcePath)) {
  throw new Error(`Paper source not found: ${sourcePath}`);
}

const text = fs.readFileSync(sourcePath, 'utf8');
const entries = [];
const citationPattern = /\\cite\w*\{([^}]+)\}/g;
let match;

function lineNumber(offset) {
  let line = 1;
  for (let i = 0; i < offset; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

while ((match = citationPattern.exec(text)) !== null) {
  const keys = match[1].split(',').map((key) => key.trim()).filter(Boolean);
  let start = text.lastIndexOf('\n\n', match.index);
  start = start === -1 ? 0 : start + 2;
  let end = text.indexOf('\n\n', match.index);
  end = end === -1 ? text.length : end;
  const rawContext = text.slice(start, end)
    .replace(/\s+/g, ' ')
    .replace(/\\cite\w*\{([^}]+)\}/g, (_, citeKeys) => `[${citeKeys}]`)
    .trim();

  for (const key of keys) {
    entries.push({
      key,
      line: lineNumber(match.index),
      excerpt: rawContext,
      citeCommand: match[0]
    });
  }
}

fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2) + '\n');
console.log(`Wrote ${outputPath}`);
