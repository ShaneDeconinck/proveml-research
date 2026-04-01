import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import provemlPlugin from 'proveml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const bibPath = path.join(repoRoot, 'references', 'paper-bibliography.bib');
const citationRecordsPath = path.join(repoRoot, 'docs', 'citation-records.json');
const contextsPath = path.join(repoRoot, 'references', 'paper-citation-contexts.json');
const factStoresDir = path.join(repoRoot, 'fact-stores');
const docsDir = path.join(repoRoot, 'docs');
const referenceRecordsPath = path.join(docsDir, 'reference-records.json');
const referencesPagePath = path.join(docsDir, 'references.html');
const agentJsonPath = path.join(docsDir, 'reference-audit-agent.json');
const agentMarkdownPath = path.join(docsDir, 'reference-audit-agent.md');
const reviewQueuePath = path.join(docsDir, 'review-queue.md');
const bibliographyStorePath = path.join(factStoresDir, 'paper-bibliography.json');
const auditStorePath = path.join(factStoresDir, 'reference-audit.json');

function stripBraces(value) {
  return value.replace(/[{}]/g, '').replace(/\\/g, '').replace(/\s+/g, ' ').trim();
}

function parseValue(body, start) {
  while (start < body.length && /\s/.test(body[start])) start += 1;
  if (body[start] === '{') {
    let depth = 0;
    let value = '';
    let i = start;
    for (; i < body.length; i += 1) {
      const ch = body[i];
      if (ch === '{') {
        depth += 1;
        if (depth > 1) value += ch;
      } else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          break;
        }
        value += ch;
      } else {
        value += ch;
      }
    }
    return { value: value.trim(), next: i };
  }
  if (body[start] === '"') {
    let value = '';
    let i = start + 1;
    for (; i < body.length; i += 1) {
      const ch = body[i];
      if (ch === '"' && body[i - 1] !== '\\') {
        i += 1;
        break;
      }
      value += ch;
    }
    return { value: value.trim(), next: i };
  }
  let i = start;
  let value = '';
  while (i < body.length && body[i] !== ',') {
    value += body[i];
    i += 1;
  }
  return { value: value.trim(), next: i };
}

function parseFields(body) {
  const fields = {};
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /[\s,]/.test(body[i])) i += 1;
    if (i >= body.length) break;
    const nameStart = i;
    while (i < body.length && /[A-Za-z0-9_:-]/.test(body[i])) i += 1;
    const name = body.slice(nameStart, i).toLowerCase();
    while (i < body.length && /\s/.test(body[i])) i += 1;
    if (body[i] !== '=') break;
    i += 1;
    const parsed = parseValue(body, i);
    fields[name] = parsed.value;
    i = parsed.next;
  }
  return fields;
}

function parseBibtex(text) {
  const entries = [];
  let i = 0;
  while (i < text.length) {
    const at = text.indexOf('@', i);
    if (at === -1) break;
    const typeStart = at + 1;
    const brace = text.indexOf('{', typeStart);
    if (brace === -1) break;
    const type = text.slice(typeStart, brace).trim().toLowerCase();
    let depth = 1;
    let j = brace + 1;
    for (; j < text.length; j += 1) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const content = text.slice(brace + 1, j);
    const comma = content.indexOf(',');
    if (comma === -1) {
      i = j + 1;
      continue;
    }
    const key = content.slice(0, comma).trim();
    const body = content.slice(comma + 1);
    entries.push({ type, key, fields: parseFields(body) });
    i = j + 1;
  }
  return entries;
}

function html(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function extractUrl(text) {
  const raw = String(text || '');
  const urlCommand = raw.match(/\\url\{([^}]+)\}/);
  if (urlCommand) return urlCommand[1].trim();
  const plainUrl = raw.match(/https?:\/\/[^\s,}]+/);
  if (plainUrl) return plainUrl[0].trim();
  return '';
}

function extractArxivId(text) {
  const raw = String(text || '');
  const match = raw.match(/arXiv:\s*([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)/i);
  return match ? match[1] : '';
}

const manualReferenceUrls = {
  selfcheckgpt: 'https://openreview.net/forum?id=RwzFNbJ3Ez',
  refchecker: 'https://aclanthology.org/2024.emnlp-main.395/',
  dspy: 'https://openreview.net/forum?id=PFS4ffN9Yx',
  totto: 'https://aclanthology.org/2020.emnlp-main.89/',
  prov: 'https://www.w3.org/TR/prov-o/',
  euaiact: 'https://eur-lex.europa.eu/eli/reg/2024/1689/',
  leesee2004: 'https://doi.org/10.1518/hfes.46.1.50_30392',
  parasuraman1997: 'https://doi.org/10.1518/001872097778543886',
  farquhar2024: 'https://doi.org/10.1038/s41586-024-07421-0',
  ji2023: 'https://doi.org/10.1145/3571730',
  magesh2025: 'https://doi.org/10.1111/jels.12413',
  deloitte2025: 'https://fortune.com/2025/10/07/deloitte-ai-australia-government-report-hallucinations-technology-290000-refund/',
  gartner2023: 'https://www.gartner.com/en/newsroom/press-releases/2023-10-11-gartner-says-more-than-80-percent-of-enterprises-will-have-used-generative-ai-apis-or-deployed-generative-ai-enabled-applications-by-2026?src_trk=em6750807b0c4706.147509061378393647',
};

function deriveReferenceUrl(key, fields, citationRecord) {
  const directUrl = stripBraces(fields.url || citationRecord?.sourceUrl || '');
  if (directUrl) return directUrl;

  const manualUrl = manualReferenceUrls[key] || '';
  if (manualUrl) return manualUrl;

  const fromHowPublished = extractUrl(fields.howpublished);
  if (fromHowPublished) return fromHowPublished;

  const fromNote = extractUrl(fields.note);
  if (fromNote) return fromNote;

  const doi = stripBraces(fields.doi || '');
  if (doi) return 'https://doi.org/' + doi;

  for (const candidate of [fields.journal, fields.note, fields.howpublished]) {
    const arxivId = extractArxivId(candidate);
    if (arxivId) return 'https://arxiv.org/abs/' + arxivId;
  }

  return '';
}

function escapeMarkupValue(value) {
  return String(value)
    .replaceAll('{', '(')
    .replaceAll('}', ')')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeEntityName(value) {
  return String(value).replaceAll('"', "'");
}

function unwrapCommand(text, command) {
  let previous = '';
  let next = text;
  const pattern = new RegExp(String.raw`\\${command}\{([^{}]*)\}`, 'g');
  while (next !== previous) {
    previous = next;
    next = next.replace(pattern, '$1');
  }
  return next;
}

function normalizeLatexExcerpt(text) {
  let s = String(text || '');
  s = s.replace(/\\begin\{itemize\}(\[[^\]]*\])?/g, '');
  s = s.replace(/\\end\{itemize\}/g, '');
  s = s.replace(/\\begin\{enumerate\}(\[[^\]]*\])?/g, '');
  s = s.replace(/\\end\{enumerate\}/g, '');
  s = s.replace(/\\item\s*/g, '\n• ');
  s = s.replace(/\\paragraph\{([^}]*)\}\s*/g, '$1. ');
  s = unwrapCommand(s, 'textbf');
  s = unwrapCommand(s, 'textit');
  s = unwrapCommand(s, 'emph');
  s = s.replace(/\\cite\w*\{([^}]+)\}/g, (_, citeKeys) => `[${citeKeys}]`);
  s = s.replace(/\\%/g, '%');
  s = s.replace(/\\&/g, '&');
  s = s.replace(/\\_/g, '_');
  s = s.replace(/\\\$/g, '$');
  s = s.replace(/\\#/g, '#');
  s = s.replace(/\\ref\{([^}]+)\}/g, '$1');
  s = s.replace(/~/g, ' ');
  s = s.replace(/``/g, '"').replace(/''/g, '"');
  s = s.replace(/--/g, '–');
  s = s.replace(/\\/g, ' ');
  s = s.replace(/[ \t]*\n[ \t]*/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.replace(/[ \t]{2,}/g, ' ');
  return escapeMarkupValue(s);
}

function extractRelevantChunks(rawExcerpt, key) {
  const normalized = normalizeLatexExcerpt(rawExcerpt);
  if (!normalized) return [];

  const listItems = normalized.split('\n').map((item) => item.trim()).filter(Boolean);
  const listMatches = listItems.filter((item) => item.includes(`[${key}]`));
  if (listMatches.length > 0) return listMatches;

  const sentences = normalized.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
  const sentenceMatches = sentences.filter((item) => item.includes(`[${key}]`));
  if (sentenceMatches.length > 0) return sentenceMatches;

  return [normalized];
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&rsquo;', "'")
    .replaceAll('&lsquo;', "'")
    .replaceAll('&rdquo;', '"')
    .replaceAll('&ldquo;', '"')
    .replaceAll('&ndash;', '–')
    .replaceAll('&mdash;', '—');
}

function stripHtmlToText(htmlFragment) {
  return decodeHtmlEntities(
    String(htmlFragment || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function looksUsefulSummary(text) {
  const value = String(text || '').trim();
  if (value.length < 60 || value.length > 700) return false;
  if (!/[a-z]/i.test(value)) return false;
  const lower = value.toLowerCase();
  const badStarts = ['skip to', 'external links', 'sign in', 'copyright', 'all rights reserved', 'loading', 'abstract page for arxiv paper'];
  if (badStarts.some((item) => lower.startsWith(item))) return false;
  return true;
}

function compactSummaryText(text) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length <= 700) return value;
  const clipped = value.slice(0, 560);
  const sentenceBreak = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('? '), clipped.lastIndexOf('! '));
  if (sentenceBreak >= 180) return `${clipped.slice(0, sentenceBreak + 1).trim()}…`;
  const wordBreak = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, wordBreak > 120 ? wordBreak : clipped.length).trim()}…`;
}

function extractAutoSummaryFromHtml(localSnapshotFullPath) {
  if (!localSnapshotFullPath || !fs.existsSync(localSnapshotFullPath)) return null;
  const raw = fs.readFileSync(localSnapshotFullPath, 'utf8');
  if (!raw.trim()) return null;

  const candidates = [
    {
      locator: 'citation abstract',
      equality: 'normalized',
      note: 'Automatically extracted from the local snapshot; useful for triage, but not yet manually reviewed for representativeness.',
      match: raw.match(/<meta[^>]+name=["']citation_abstract["'][^>]+content=["']([\s\S]{40,4000}?)["'][^>]*>/i),
    },
    {
      locator: 'Open Graph description',
      equality: 'normalized',
      note: 'Automatically extracted from the local snapshot; useful for triage, but not yet manually reviewed for representativeness.',
      match: raw.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]{40,1200}?)["'][^>]*>/i),
    },
    {
      locator: 'meta description',
      equality: 'normalized',
      note: 'Automatically extracted from the local snapshot; useful for triage, but not yet manually reviewed for representativeness.',
      match: raw.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]{40,400}?)["'][^>]*>/i),
    },
    {
      locator: 'abstract block',
      equality: 'normalized',
      note: 'Automatically extracted from the local snapshot; useful for triage, but not yet manually reviewed for representativeness.',
      match: raw.match(/<blockquote[^>]*abstract[^>]*>([\s\S]{40,1200}?)<\/blockquote>/i),
    },
    {
      locator: 'first paragraph',
      equality: 'normalized',
      note: 'Automatically extracted from the local snapshot; useful for triage, but not yet manually reviewed for representativeness.',
      match: raw.match(/<p[^>]*>([\s\S]{80,1200}?)<\/p>/i),
    },
  ];

  for (const candidate of candidates) {
    const text = compactSummaryText(stripHtmlToText(candidate.match?.[1] || ''));
    if (!looksUsefulSummary(text)) continue;
    return {
      line: null,
      field: 'autoSummary',
      claimValue: 'auto-extracted broader source summary',
      equality: candidate.equality,
      note: candidate.note,
      locator: candidate.locator,
      text: escapeMarkupValue(text),
    };
  }

  return null;
}

function dedupeByText(items) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    const key = item.text || item.quote || item;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function renderExactFact(recordKey, title, field, value) {
  const factStore = {
    [`paperref:${recordKey}.name`]: title,
    [`paperref:${recordKey}.${field}`]: value,
  };
  const md = new MarkdownIt({ html: false, breaks: true });
  md.use(provemlPlugin, { factStore });
  const env = {};
  const markup = `@[paperref:${recordKey} "${escapeEntityName(title)}"]{%[${field}]{${value}}}`;
  const renderedHtml = md.render(markup, env).trim();
  const total = env.proveml?.total ?? 0;
  const verified = env.proveml?.verified ?? 0;
  return {
    field,
    value,
    markup,
    html: renderedHtml,
    allVerified: total > 0 && total === verified,
    total,
    verified,
  };
}

const bibText = fs.readFileSync(bibPath, 'utf8');
const bibEntries = parseBibtex(bibText);
const citationRecords = fs.existsSync(citationRecordsPath)
  ? JSON.parse(fs.readFileSync(citationRecordsPath, 'utf8'))
  : [];
const citationById = new Map(citationRecords.map((record) => [record.id, record]));
const contexts = fs.existsSync(contextsPath)
  ? JSON.parse(fs.readFileSync(contextsPath, 'utf8'))
  : [];
const contextsByKey = new Map();
for (const item of contexts) {
  if (!contextsByKey.has(item.key)) contextsByKey.set(item.key, []);
  contextsByKey.get(item.key).push(item);
}

const bibliographyStore = {};
const auditStore = {};
const referenceRecords = bibEntries.map((entry) => {
  const fields = entry.fields;
  const citationRecord = citationById.get(entry.key);
  const usage = contextsByKey.get(entry.key) || [];
  const title = stripBraces(fields.title || entry.key);
  const authors = stripBraces(fields.author || '');
  const year = stripBraces(fields.year || '');
  const url = deriveReferenceUrl(entry.key, fields, citationRecord);
  const venue = stripBraces(fields.journal || fields.booktitle || fields.publisher || fields.note || '');
  const base = `paperref:${entry.key}`;
  const localSnapshotPath = path.join('references', 'raw', `${entry.key}.html`);
  const localSnapshotFullPath = path.join(repoRoot, localSnapshotPath);
  const hasLocalSnapshot = fs.existsSync(localSnapshotFullPath) && fs.statSync(localSnapshotFullPath).size > 0;

  const paperPassages = dedupeByText(
    usage.flatMap((item) => extractRelevantChunks(item.excerpt, entry.key).map((text) => ({
      line: item.line,
      text,
      render: renderExactFact(entry.key, title, `paperUse${item.line}`, text),
    })))
  );

  const sourcePassages = (citationRecord?.evidence || []).map((item, index) => {
    const quote = escapeMarkupValue(item.sourceQuote || '');
    return {
      line: null,
      field: item.field,
      claimValue: escapeMarkupValue(item.claimValue || ''),
      equality: item.equality || 'exact',
      note: item.note || '',
      locator: item.sourceLocator || '',
      text: quote,
      render: renderExactFact(entry.key, title, `sourceQuote${index + 1}`, quote),
    };
  });

  const summaryPassages = (citationRecord?.summaryEvidence || []).map((item, index) => {
    const quote = escapeMarkupValue(item.sourceQuote || '');
    return {
      line: null,
      field: item.field || `summary${index + 1}`,
      claimValue: escapeMarkupValue(item.claimValue || ''),
      equality: item.equality || 'exact',
      note: item.note || '',
      locator: item.sourceLocator || '',
      text: quote,
      render: renderExactFact(entry.key, title, `summaryQuote${index + 1}`, quote),
    };
  });
  const autoSummaryPassages = summaryPassages.length > 0
    ? []
    : (() => {
        const auto = extractAutoSummaryFromHtml(localSnapshotFullPath);
        if (!auto) return [];
        return [{
          ...auto,
          render: renderExactFact(entry.key, title, 'autoSummaryQuote1', auto.text),
        }];
      })();

  const summaryAlignment = citationRecord?.summaryAlignment || (summaryPassages.length > 0 ? 'aligned' : 'not-reviewed');
  const selectionRisk = citationRecord?.selectionRisk || (summaryAlignment === 'tension'
    ? 'high'
    : (summaryAlignment === 'unclear' ? 'medium' : (summaryAlignment === 'aligned' ? 'low' : 'not-reviewed')));
  const summaryNote = citationRecord?.summaryNote || '';

  const deepAudited = sourcePassages.length > 0;
  const auditStatus = deepAudited ? 'deep-audited' : 'bibliography-only';
  const nextStep = deepAudited
    ? 'Compare the paper excerpt and the source excerpt on this page; the green blocks are exact matches to the flattened audit store.'
    : (hasLocalSnapshot
      ? 'A local source snapshot is available; read the relevant sections and curate one or more exact supporting passages into the audit store.'
      : (url
        ? 'A source URL is available; fetch or read it and curate one or more exact supporting passages into the audit store.'
        : 'No source URL is available yet. Read this reference manually and add a source URL before curating supporting passages.'));

  bibliographyStore[`${base}.key`] = entry.key;
  bibliographyStore[`${base}.entryType`] = entry.type;
  bibliographyStore[`${base}.title`] = title;
  bibliographyStore[`${base}.authors`] = authors;
  bibliographyStore[`${base}.year`] = year;
  bibliographyStore[`${base}.url`] = url;
  bibliographyStore[`${base}.venue`] = venue;
  bibliographyStore[`${base}.auditStatus`] = auditStatus;
  bibliographyStore[`${base}.paperUseCount`] = String(paperPassages.length);
  bibliographyStore[`${base}.sourcePassageCount`] = String(sourcePassages.length);
  bibliographyStore[`${base}.summaryPassageCount`] = String(summaryPassages.length);
  bibliographyStore[`${base}.autoSummaryPassageCount`] = String(autoSummaryPassages.length);
  bibliographyStore[`${base}.summaryAlignment`] = summaryAlignment;
  bibliographyStore[`${base}.selectionRisk`] = selectionRisk;

  auditStore[`${base}.name`] = title;
  auditStore[`${base}.title`] = title;
  auditStore[`${base}.summaryAlignment`] = summaryAlignment;
  auditStore[`${base}.selectionRisk`] = selectionRisk;
  paperPassages.forEach((item, index) => {
    auditStore[`${base}.paperUse${index + 1}`] = item.text;
    auditStore[`${base}.paperUse${index + 1}._line`] = String(item.line);
  });
  sourcePassages.forEach((item, index) => {
    auditStore[`${base}.sourceQuote${index + 1}`] = item.text;
    auditStore[`${base}.sourceQuote${index + 1}._locator`] = item.locator;
    auditStore[`${base}.sourceQuote${index + 1}._equality`] = item.equality;
    auditStore[`${base}.sourceQuote${index + 1}._field`] = item.field;
    auditStore[`${base}.sourceQuote${index + 1}._claimValue`] = item.claimValue;
  });
  summaryPassages.forEach((item, index) => {
    auditStore[`${base}.summaryQuote${index + 1}`] = item.text;
    auditStore[`${base}.summaryQuote${index + 1}._locator`] = item.locator;
    auditStore[`${base}.summaryQuote${index + 1}._equality`] = item.equality;
    auditStore[`${base}.summaryQuote${index + 1}._field`] = item.field;
    auditStore[`${base}.summaryQuote${index + 1}._claimValue`] = item.claimValue;
  });
  autoSummaryPassages.forEach((item, index) => {
    auditStore[`${base}.autoSummaryQuote${index + 1}`] = item.text;
    auditStore[`${base}.autoSummaryQuote${index + 1}._locator`] = item.locator;
    auditStore[`${base}.autoSummaryQuote${index + 1}._equality`] = item.equality;
    auditStore[`${base}.autoSummaryQuote${index + 1}._field`] = item.field;
    auditStore[`${base}.autoSummaryQuote${index + 1}._claimValue`] = item.claimValue;
  });

  return {
    key: entry.key,
    entryType: entry.type,
    title,
    authors,
    year,
    url,
    venue,
    auditStatus,
    nextStep,
    paperPassages,
    sourcePassages,
    summaryPassages,
    autoSummaryPassages,
    summaryAlignment,
    selectionRisk,
    summaryNote,
    usageCount: usage.length,
    sourceLabel: citationRecord?.sourceLabel || (hasLocalSnapshot ? localSnapshotPath : (url || '')),
    snapshotStatus: citationRecord?.snapshotStatus || (hasLocalSnapshot ? 'fetched' : ''),
    snapshotError: citationRecord?.snapshotError || '',
  };
});

const usedRecords = referenceRecords
  .filter((record) => record.paperPassages.length > 0)
  .sort((a, b) => (a.paperPassages[0]?.line ?? 99999) - (b.paperPassages[0]?.line ?? 99999));
const unusedRecords = referenceRecords.filter((record) => record.paperPassages.length === 0);
const curatedCount = usedRecords.filter((record) => record.sourcePassages.length > 0).length;
const summaryReviewedCount = usedRecords.filter((record) => record.summaryPassages.length > 0).length;
const autoSummaryCount = usedRecords.filter((record) => record.summaryPassages.length === 0 && record.autoSummaryPassages.length > 0).length;
const exactBlockCount = usedRecords.reduce((sum, record) => sum + record.paperPassages.length + record.sourcePassages.length + record.summaryPassages.length + record.autoSummaryPassages.length, 0);

fs.mkdirSync(factStoresDir, { recursive: true });
fs.writeFileSync(bibliographyStorePath, JSON.stringify(bibliographyStore, null, 2) + '\n');
fs.writeFileSync(auditStorePath, JSON.stringify(auditStore, null, 2) + '\n');
fs.writeFileSync(referenceRecordsPath, JSON.stringify(referenceRecords, null, 2) + '\n');

const agentRecords = usedRecords.map((record) => ({
  key: record.key,
  title: record.title,
  authors: record.authors,
  year: record.year,
  venue: record.venue,
  url: record.url,
  sourceLabel: record.sourceLabel,
  snapshotStatus: record.snapshotStatus || '',
  snapshotError: record.snapshotError || '',
  auditStatus: record.auditStatus,
  nextStep: record.nextStep,
  summaryAlignment: record.summaryAlignment,
  selectionRisk: record.selectionRisk,
  summaryNote: record.summaryNote,
  paperExcerpts: record.paperPassages.map((item) => ({
    line: item.line,
    text: item.text,
    field: item.render.field,
    verified: item.render.allVerified,
  })),
  sourcePassages: record.sourcePassages.map((item) => ({
    field: item.field,
    claimValue: item.claimValue,
    equality: item.equality,
    locator: item.locator,
    text: item.text,
    note: item.note,
    verified: item.render.allVerified,
  })),
  summaryPassages: record.summaryPassages.map((item) => ({
    field: item.field,
    claimValue: item.claimValue,
    equality: item.equality,
    locator: item.locator,
    text: item.text,
    note: item.note,
    verified: item.render.allVerified,
  })),
  autoSummaryPassages: record.autoSummaryPassages.map((item) => ({
    field: item.field,
    claimValue: item.claimValue,
    equality: item.equality,
    locator: item.locator,
    text: item.text,
    note: item.note,
    verified: item.render.allVerified,
  })),
}));

const reviewAttention = usedRecords
  .filter((record) => record.selectionRisk === 'high' || record.summaryAlignment === 'tension')
  .map((record) => ({
    key: record.key,
    title: record.title,
    summaryAlignment: record.summaryAlignment,
    selectionRisk: record.selectionRisk,
    summaryNote: record.summaryNote,
  }));

const agentJson = {
  generatedAt: new Date().toISOString(),
  totals: {
    totalReferences: referenceRecords.length,
    citedReferences: usedRecords.length,
    sourcePassagesCurated: curatedCount,
    summaryReviewed: summaryReviewedCount,
    autoSummaryCandidates: autoSummaryCount,
    exactRenderedBlocks: exactBlockCount,
  },
  reviewAttention,
  records: agentRecords,
};

const agentMarkdown = [
  '# ProveML Reference Audit (Agent Export)',
  '',
  'This is the compact agent-facing export of the reference audit.',
  'Use it instead of the HTML page when you want structured citation review without UI markup.',
  '',
  '## Totals',
  '',
  `- Total references: ${referenceRecords.length}`,
  `- Cited in paper: ${usedRecords.length}`,
  `- Source passages curated: ${curatedCount}`,
  `- Summary reviewed: ${summaryReviewedCount}`,
  `- Auto summary candidates: ${autoSummaryCount}`,
  `- Exact rendered blocks: ${exactBlockCount}`,
  '',
  '## Highest-Attention References',
  '',
  ...(reviewAttention.length > 0
    ? reviewAttention.flatMap((item) => [
        `### ${item.key}`,
        item.title,
        `- summary alignment: ${item.summaryAlignment}`,
        `- selection risk: ${item.selectionRisk}`,
        `- note: ${item.summaryNote || 'None'}`,
        '',
      ])
    : ['None.', '']),
  '## Records',
  '',
  ...agentRecords.flatMap((record) => {
    const summaryItems = record.summaryPassages.length > 0 ? record.summaryPassages : record.autoSummaryPassages;
    return [
      `### ${record.key}`,
      record.title,
      `- authors: ${record.authors || 'Unknown'}`,
      `- year: ${record.year || 'Unknown'}`,
      `- venue: ${record.venue || 'Unknown'}`,
      `- source url: ${record.url || 'None'}`,
      `- source label: ${record.sourceLabel || 'None'}`,
      `- snapshot status: ${record.snapshotStatus || 'none'}`,
      `- audit status: ${record.auditStatus}`,
      `- summary alignment: ${record.summaryAlignment}`,
      `- selection risk: ${record.selectionRisk}`,
      `- summary note: ${record.summaryNote || 'None'}`,
      '',
      'Paper excerpts:',
      ...(record.paperExcerpts.length > 0
        ? record.paperExcerpts.map((item) => `- line ${item.line}: ${item.text}`)
        : ['- None']),
      '',
      'Source passages:',
      ...(record.sourcePassages.length > 0
        ? record.sourcePassages.map((item) => `- [${item.equality}] ${item.locator || 'no locator'} :: ${item.text}`)
        : ['- None']),
      '',
      'Summary passages:',
      ...(summaryItems.length > 0
        ? summaryItems.map((item) => `- [${item.equality}] ${item.locator || 'no locator'} :: ${item.text}`)
        : ['- None']),
      '',
    ];
  }),
].join('\n');

fs.writeFileSync(agentJsonPath, JSON.stringify(agentJson, null, 2) + '\n');
fs.writeFileSync(agentMarkdownPath, agentMarkdown + '\n');

const referenceCardsHtml = usedRecords.map((record, index) => {
  const alignmentClass = record.summaryAlignment === 'aligned'
    ? 'review-aligned'
    : (record.summaryAlignment === 'tension' ? 'review-tension' : (record.summaryAlignment === 'unclear' ? 'review-unclear' : 'has-issues'));
  const riskClass = record.selectionRisk === 'low'
    ? 'review-aligned'
    : (record.selectionRisk === 'high' ? 'review-tension' : (record.selectionRisk === 'medium' ? 'review-unclear' : 'has-issues'));

  const paperBlocks = record.paperPassages.map((item) => `
            <article class="excerpt-card exact-match">
              <div class="excerpt-meta">Paper excerpt · line ${html(item.line)} · <code>${html(item.render.field)}</code></div>
              <div class="audit-render">${item.render.html}</div>
            </article>`).join('');
  const sourceBlocks = record.sourcePassages.length > 0
    ? record.sourcePassages.map((item) => `
            <article class="excerpt-card exact-match">
              <div class="excerpt-meta">Source passage · ${html(item.locator || 'no locator')} · <code>${html(item.render.field)}</code></div>
              <div class="audit-render">${item.render.html}</div>
            </article>`).join('')
    : `
            <article class="excerpt-card needs-reading">
              <div class="excerpt-meta">Source passage</div>
              <p class="muted">No curated supporting passage is stored yet.</p>
              <p class="muted">${html(record.nextStep)}</p>
            </article>`;
  const activeSummaryPassages = record.summaryPassages.length > 0 ? record.summaryPassages : record.autoSummaryPassages;
  const summaryBlocks = activeSummaryPassages.length > 0
    ? activeSummaryPassages.map((item) => `
            <article class="excerpt-card exact-match">
              <div class="excerpt-meta">${record.summaryPassages.length > 0 ? 'Summary quote' : 'Auto summary candidate'} · ${html(item.locator || 'no locator')} · <code>${html(item.render.field)}</code></div>
              <div class="audit-render">${item.render.html}</div>
              ${item.note ? `<p class="muted" style="margin-top: 8px;">${html(item.note)}</p>` : ''}
            </article>`).join('')
    : `
            <article class="excerpt-card needs-reading">
              <div class="excerpt-meta">Summary quote</div>
              <p class="muted">Broader summary review not yet curated.</p>
              <p class="muted">This card currently verifies local quote support only; representativeness against the source's abstract, overview, or scope remains unchecked.</p>
            </article>`;
  const mappingHtml = record.sourcePassages.length > 0
    ? `
          <section class="mapping-block">
            <h4>How the stored claim is derived</h4>
            <div class="mapping-grid">
              ${record.sourcePassages.map((item) => `
                <article class="mapping-card">
                  <div class="mapping-field">${html(item.field)}</div>
                  <div class="mapping-value"><code>${html(item.claimValue)}</code></div>
                  <div class="mapping-meta">${html(item.equality)} equality</div>
                  ${item.note ? `<p class="mapping-note">${html(item.note)}</p>` : ''}
                </article>`).join('')}
            </div>
          </section>`
    : '';
  const summaryReviewHtml = record.summaryPassages.length > 0
    ? `
          <section class="summary-review">
            <div class="badge-stack">
              <span class="verification-badge ${alignmentClass}">summary alignment: ${html(record.summaryAlignment)}</span>
              <span class="verification-badge ${riskClass}">selection risk: ${html(record.selectionRisk)}</span>
            </div>
            ${record.summaryNote ? `<p class="section-note">${html(record.summaryNote)}</p>` : ''}
          </section>`
    : (record.autoSummaryPassages.length > 0
        ? `
          <section class="summary-review">
            <div class="badge-stack">
              <span class="verification-badge review-unclear">summary candidate available</span>
              <span class="verification-badge has-issues">alignment not reviewed</span>
            </div>
            <p class="section-note">This broader quote was extracted automatically from the local snapshot to make review easier. It is useful for triage, but it has not yet been manually reviewed for representativeness.</p>
          </section>`
        : '');
  const summaryBadges = `
        <div class="badge-stack">
          <span class="verification-badge all-good">${record.paperPassages.length} paper excerpt${record.paperPassages.length === 1 ? '' : 's'} exact</span>
          ${record.sourcePassages.length > 0
            ? `<span class="verification-badge all-good">${record.sourcePassages.length} source passage${record.sourcePassages.length === 1 ? '' : 's'} exact</span>`
            : `<span class="verification-badge has-issues">source passages not curated</span>`}
          ${record.summaryPassages.length > 0
            ? `<span class="verification-badge ${alignmentClass}">summary ${html(record.summaryAlignment)}</span>`
            : (record.autoSummaryPassages.length > 0
                ? `<span class="verification-badge review-unclear">summary candidate</span>`
                : `<span class="verification-badge has-issues">summary not reviewed</span>`)}
        </div>`;

  return `
        <details class="reference-card"${index < 3 ? ' open' : ''}>
          <summary class="reference-summary">
            <div class="summary-main">
              <div class="summary-key"><code>${html(record.key)}</code></div>
              <div>
                <div class="summary-title">${html(record.title)}</div>
                <div class="summary-sub">${html(record.authors)}${record.year ? ` · ${html(record.year)}` : ''}${record.venue ? ` · ${html(record.venue)}` : ''}</div>
              </div>
            </div>
            ${summaryBadges}
          </summary>
          <div class="reference-body">
            <div class="record-links">
              ${record.url ? `<a href="${html(record.url)}" class="inline-link">Source URL</a>` : '<span class="muted">No source URL in bibliography</span>'}
              ${record.sourceLabel ? `<span class="muted">Snapshot: ${html(record.sourceLabel)}${record.snapshotStatus ? ` · ${html(record.snapshotStatus)}` : ''}</span>` : ''}
              ${record.snapshotError ? `<span class="muted">Snapshot note: ${html(record.snapshotError)}</span>` : ''}
            </div>
            <div class="section-grid">
              <section>
                <h3>Where this paper cites it</h3>
                <p class="section-note">These are the exact flattened paper excerpts rendered through the real ProveML verifier.</p>
                <div class="excerpt-stack">${paperBlocks}
                </div>
              </section>
              <section>
                <h3>Relevant source passages</h3>
                <p class="section-note">These are the exact supporting passages currently stored for this reference, rendered from the flattened audit store.</p>
                <div class="excerpt-stack">${sourceBlocks}
                </div>
              </section>
              <section>
                <h3>Summary alignment</h3>
                <p class="section-note">These broader summary quotes help check whether the supporting quote is representative rather than selectively chosen.</p>
                ${summaryReviewHtml}
                <div class="excerpt-stack">${summaryBlocks}
                </div>
              </section>
            </div>
            ${mappingHtml}
          </div>
        </details>`;
}).join('');

const unusedHtml = unusedRecords.length > 0
  ? `
        <article class="audit-card">
          <h2>In bibliography but not cited in the current manuscript source</h2>
          <ul class="unused-list">
            ${unusedRecords.map((record) => `<li><code>${html(record.key)}</code> ${html(record.title)}</li>`).join('')}
          </ul>
        </article>`
  : '';

const pendingList = usedRecords
  .filter((record) => record.sourcePassages.length === 0)
  .map((record) => `- \texttt{${record.key}}: ${record.title}\n  Paper excerpt: ${record.paperPassages[0]?.text || 'No extracted paper excerpt'}\n  ${record.url ? `Source: ${record.url}\n  ` : ''}Next: ${record.nextStep}`)
  .join('\n\n');

fs.writeFileSync(
  reviewQueuePath,
  `# Reference Review Queue\n\nThe paper bibliography contains ${referenceRecords.length} references. ${usedRecords.length} are cited in the current manuscript source. ${curatedCount} already have exact supporting source passages stored on the reference audit page; ${usedRecords.length - curatedCount} cited references still need manual source curation.\n\n## Read next\n\n${pendingList}\n`
);

const htmlPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ProveML reference audit</title>
  <meta name="description" content="Readable audit surface for every reference cited in the ProveML paper.">
  <link rel="stylesheet" href="./site.css">
  <link rel="stylesheet" href="../../node_modules/proveml/src/style.css">
  <style>
    .audit-grid { display: grid; gap: 22px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; }
    .summary-card, .audit-card, .reference-card { background: var(--panel); border: 1px solid var(--line); border-radius: 20px; box-shadow: var(--shadow); }
    .summary-card, .audit-card { padding: 18px; }
    .summary-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 700; }
    .summary-value { margin-top: 6px; font-size: 1.9rem; font-weight: 700; }
    .audit-notes, .section-note, .muted { color: var(--muted); }
    .reference-list { display: grid; gap: 16px; }
    .reference-summary { list-style: none; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 18px 20px; cursor: pointer; }
    .reference-summary::-webkit-details-marker { display: none; }
    .summary-main { display: flex; gap: 14px; align-items: flex-start; }
    .summary-key code { font-size: 0.88rem; }
    .summary-title { font-weight: 700; font-size: 1.06rem; }
    .summary-sub { color: var(--muted); margin-top: 4px; }
    .reference-body { border-top: 1px solid var(--line); padding: 18px 20px 20px; }
    .section-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin-top: 14px; }
    .excerpt-stack { display: grid; gap: 12px; }
    .excerpt-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px; background: #fff; }
    .excerpt-card.exact-match { border-color: rgba(15, 118, 110, 0.22); background: rgba(15, 118, 110, 0.04); }
    .excerpt-card.needs-reading { border-color: rgba(199, 123, 18, 0.22); background: rgba(199, 123, 18, 0.06); }
    .excerpt-meta { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 8px; }
    .audit-render { line-height: 1.65; }
    .audit-render p { margin: 0; }
    .audit-render .proveml-entity { border-bottom: none; padding-bottom: 0; cursor: default; }
    .audit-render .proveml-entity:hover { background: transparent; }
    .audit-render .proveml-fact.proveml-verified::after { content: ' ✓'; font-size: 0.72em; vertical-align: super; color: #0f766e; }
    .summary-review { margin-bottom: 12px; }
    .mapping-block { margin-top: 18px; border-top: 1px dashed var(--line); padding-top: 16px; }
    .mapping-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .mapping-card { border: 1px solid var(--line); border-radius: 14px; padding: 12px; background: #fff; }
    .mapping-field { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
    .mapping-value { margin-top: 8px; font-weight: 700; }
    .mapping-meta { margin-top: 6px; color: var(--muted); }
    .mapping-note { margin: 8px 0 0; color: var(--muted); }
    .record-links { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .badge-stack { display: flex; flex-wrap: wrap; gap: 8px; }
    .verification-badge { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; font-size: 0.82rem; font-weight: 700; border: 1px solid var(--line); }
    .verification-badge.all-good { color: var(--teal); background: rgba(15, 118, 110, 0.08); border-color: rgba(15, 118, 110, 0.22); }
    .verification-badge.has-issues { color: var(--amber); background: rgba(199, 123, 18, 0.1); border-color: rgba(199, 123, 18, 0.22); }
    .verification-badge.review-aligned { color: var(--teal); background: rgba(15, 118, 110, 0.08); border-color: rgba(15, 118, 110, 0.22); }
    .verification-badge.review-unclear { color: #1d4ed8; background: rgba(29, 78, 216, 0.08); border-color: rgba(29, 78, 216, 0.2); }
    .verification-badge.review-tension { color: #b42318; background: rgba(180, 35, 24, 0.08); border-color: rgba(180, 35, 24, 0.2); }
    .unused-list { margin: 0; padding-left: 18px; }
    .unused-list li + li { margin-top: 8px; }
    @media (max-width: 980px) {
      .section-grid { grid-template-columns: 1fr; }
      .reference-summary { flex-direction: column; }
    }
  </style>
</head>
<body>
  <header class="page-header">
    <div class="wrap masthead">
      <div class="eyebrow">Reference audit between paper and sources</div>
      <h1>All references</h1>
      <p class="lede">This page is built to let you audit the paper without opening every source. For each citation, it shows where the paper cites it, renders the exact flattened paper excerpts in green through the real ProveML verifier, and, when curated, does the same for the supporting source passages.</p>
      <div class="actions">
        <a href="./index.html" class="button">Back to docs</a>
        <a href="./review-queue.md" class="button">Review queue</a>
      </div>
    </div>
  </header>
  <main>
    <section class="section">
      <div class="wrap audit-grid">
        <div class="summary-grid">
          <article class="summary-card"><div class="summary-label">Total references</div><div class="summary-value">${referenceRecords.length}</div></article>
          <article class="summary-card"><div class="summary-label">Cited in paper</div><div class="summary-value">${usedRecords.length}</div></article>
          <article class="summary-card"><div class="summary-label">Source passages curated</div><div class="summary-value">${curatedCount}</div></article>
          <article class="summary-card"><div class="summary-label">Summary reviewed</div><div class="summary-value">${summaryReviewedCount}</div></article>
          <article class="summary-card"><div class="summary-label">Auto summary candidates</div><div class="summary-value">${autoSummaryCount}</div></article>
          <article class="summary-card"><div class="summary-label">Exact rendered blocks</div><div class="summary-value">${exactBlockCount}</div></article>
        </div>
        <article class="audit-card">
          <h2>How to read this page</h2>
          <p class="audit-notes">Green excerpt cards are exact matches against the flattened audit store and are rendered through the actual ProveML plugin. The first column shows where the paper cites the reference. The second shows curated supporting source passages. The third shows broader abstract, overview, or scope quotes so you can judge whether the supporting quote is representative rather than selectively chosen. When no reviewed summary quote is stored yet, the page will surface an auto-extracted summary candidate from the local snapshot whenever it can.</p>
        </article>
        <div class="reference-list">
          ${referenceCardsHtml}
        </div>
        ${unusedHtml}
      </div>
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(referencesPagePath, htmlPage);
console.log(`Wrote ${bibliographyStorePath}`);
console.log(`Wrote ${auditStorePath}`);
console.log(`Wrote ${referenceRecordsPath}`);
console.log(`Wrote ${referencesPagePath}`);
console.log(`Wrote ${agentJsonPath}`);
console.log(`Wrote ${agentMarkdownPath}`);
console.log(`Wrote ${reviewQueuePath}`);
