import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'references', 'manifest.json');
const reportPath = path.join(repoRoot, 'references', 'fetch-report.json');
const referenceRecordsPath = path.join(repoRoot, 'docs', 'reference-records.json');

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : [];
const referenceRecords = fs.existsSync(referenceRecordsPath)
  ? JSON.parse(fs.readFileSync(referenceRecordsPath, 'utf8'))
  : [];

const combined = new Map();
for (const entry of manifest) combined.set(entry.id, entry);
for (const record of referenceRecords) {
  if (!record.url || record.paperPassages?.length === 0) continue;
  const existing = combined.get(record.key);
  if (existing) {
    existing.sourceUrl ||= record.url;
    existing.sourceLabel ||= record.url;
    existing.localPath ||= `references/raw/${record.key}.html`;
    continue;
  }
  combined.set(record.key, {
    id: record.key,
    name: record.title,
    sourceUrl: record.url,
    sourceLabel: record.url,
    fetchFormat: 'html',
    localPath: `references/raw/${record.key}.html`
  });
}

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const strict = args.has('--strict');
const results = [];

for (const entry of combined.values()) {
  const target = path.join(repoRoot, entry.localPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!force && fs.existsSync(target)) {
    console.log(`skip ${entry.id} -> ${entry.localPath}`);
    results.push({
      id: entry.id,
      status: 'skipped',
      sourceUrl: entry.sourceUrl,
      localPath: entry.localPath
    });
    continue;
  }

  console.log(`fetch ${entry.id} <- ${entry.sourceUrl}`);

  try {
    const response = await fetch(entry.sourceUrl, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; ProveML reference fetcher/0.2; +https://github.com/ShaneDeconinck/proveml)',
        accept: 'text/html,application/xhtml+xml,application/pdf'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const body = await response.text();
    fs.writeFileSync(target, body);
    results.push({
      id: entry.id,
      status: 'fetched',
      sourceUrl: entry.sourceUrl,
      localPath: entry.localPath,
      bytes: Buffer.byteLength(body)
    });
  } catch (error) {
    console.warn(`warn ${entry.id}: ${error.message}`);
    results.push({
      id: entry.id,
      status: 'failed',
      sourceUrl: entry.sourceUrl,
      localPath: entry.localPath,
      error: error.message
    });
  }
}

fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

const failed = results.filter((result) => result.status === 'failed');
const fetched = results.filter((result) => result.status === 'fetched');
const skipped = results.filter((result) => result.status === 'skipped');

console.log(`Fetched reference sources. fetched=${fetched.length} skipped=${skipped.length} failed=${failed.length}`);
console.log(`Report: ${reportPath}`);

if (strict && failed.length > 0) {
  process.exitCode = 1;
}
