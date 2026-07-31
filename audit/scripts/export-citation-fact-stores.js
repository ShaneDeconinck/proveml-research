import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'references', 'manifest.json');
const claimsPath = path.join(repoRoot, 'references', 'source-claims.json');
const fetchReportPath = path.join(repoRoot, 'references', 'fetch-report.json');
const factStoresDir = path.join(repoRoot, 'fact-stores');
const docsDir = path.join(repoRoot, 'docs');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const claims = JSON.parse(fs.readFileSync(claimsPath, 'utf8'));
const fetchReport = fs.existsSync(fetchReportPath)
  ? JSON.parse(fs.readFileSync(fetchReportPath, 'utf8'))
  : { generatedAt: null, results: [] };
const manifestById = new Map(manifest.map((entry) => [entry.id, entry]));
const fetchById = new Map(fetchReport.results.map((entry) => [entry.id, entry]));

const bibliographyStore = {};
const characteristicsStore = {};
const combinedRecords = [];

for (const claim of claims) {
  const manifestEntry = manifestById.get(claim.id);
  if (!manifestEntry) {
    throw new Error(`Missing manifest entry for ${claim.id}`);
  }

  const fetchEntry = fetchById.get(claim.id);
  const base = `citation:${claim.id}`;
  bibliographyStore[`${base}.name`] = manifestEntry.name;
  bibliographyStore[`${base}.title`] = claim.title;
  bibliographyStore[`${base}.authors`] = claim.authors;
  bibliographyStore[`${base}.year`] = claim.year;
  bibliographyStore[`${base}.sourceLabel`] = manifestEntry.sourceLabel;
  bibliographyStore[`${base}.sourceUrl`] = manifestEntry.sourceUrl;
  bibliographyStore[`${base}.localPath`] = manifestEntry.localPath;
  bibliographyStore[`${base}.snapshotStatus`] = fetchEntry?.status ?? 'unfetched';

  characteristicsStore[`${base}.category`] = claim.category;
  characteristicsStore[`${base}.verificationMode`] = claim.verificationMode;
  characteristicsStore[`${base}.verificationClass`] = claim.verificationClass;
  characteristicsStore[`${base}.against`] = claim.against;
  characteristicsStore[`${base}.inlineSupport`] = claim.inlineSupport;
  characteristicsStore[`${base}.structuredRecordBinding`] = claim.structuredRecordBinding;
  characteristicsStore[`${base}.inferenceLayer`] = claim.inferenceLayer;

  const evidence = Array.isArray(claim.evidence) ? claim.evidence : [];
  for (const [index, item] of evidence.entries()) {
    const evidenceBase = `${base}.evidence.${index}`;
    bibliographyStore[`${evidenceBase}.field`] = item.field;
    bibliographyStore[`${evidenceBase}.claimValue`] = item.claimValue;
    bibliographyStore[`${evidenceBase}.sourceQuote`] = item.sourceQuote;
    bibliographyStore[`${evidenceBase}.sourceLocator`] = item.sourceLocator;
    bibliographyStore[`${evidenceBase}.equality`] = item.equality;
    bibliographyStore[`${evidenceBase}.note`] = item.note;
  }

  combinedRecords.push({
    id: claim.id,
    name: manifestEntry.name,
    title: claim.title,
    authors: claim.authors,
    year: claim.year,
    category: claim.category,
    verificationMode: claim.verificationMode,
    verificationClass: claim.verificationClass,
    against: claim.against,
    inlineSupport: claim.inlineSupport,
    structuredRecordBinding: claim.structuredRecordBinding,
    inferenceLayer: claim.inferenceLayer,
    evidence,
    sourceUrl: manifestEntry.sourceUrl,
    sourceLabel: manifestEntry.sourceLabel,
    localPath: manifestEntry.localPath,
    snapshotStatus: fetchEntry?.status ?? 'unfetched',
    snapshotError: fetchEntry?.error ?? null,
    snapshotBytes: fetchEntry?.bytes ?? null,
    snapshotGeneratedAt: fetchReport.generatedAt
  });
}

fs.mkdirSync(factStoresDir, { recursive: true });
fs.writeFileSync(path.join(factStoresDir, 'citation-bibliography.json'), JSON.stringify(bibliographyStore, null, 2) + '\n');
fs.writeFileSync(path.join(factStoresDir, 'citation-characteristics.json'), JSON.stringify(characteristicsStore, null, 2) + '\n');
fs.writeFileSync(path.join(docsDir, 'citation-records.json'), JSON.stringify(combinedRecords, null, 2) + '\n');

console.log('Wrote fact stores:');
console.log(`- ${path.join(factStoresDir, 'citation-bibliography.json')}`);
console.log(`- ${path.join(factStoresDir, 'citation-characteristics.json')}`);
console.log(`- ${path.join(docsDir, 'citation-records.json')}`);
