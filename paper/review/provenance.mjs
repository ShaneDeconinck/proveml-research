#!/usr/bin/env node
// Provenance for fetched sources: the best attestation available, honestly
// labelled. Every source is hashed and merkled already (the manifests); this
// records beside each root how far up the ladder its attestation reached:
//   transport   fetched over TLS: host, leaf certificate fingerprint, issuer,
//               validity, fetch time. Authenticates the channel to the fetcher,
//               not the content: a witness statement, made checkable.
//   timestamped an RFC 3161 token over the manifest root: "this root existed by
//               time T", verifiable by anyone against the TSA's certificate.
//   witnessed   an independent archive saw the same bytes (not attempted here
//               tonight: the archive API is rate-limited).
//   signed      the publisher signed the content or root (proveml-credential,
//               SXG, C2PA). None of these sources offer one.
// Usage: node provenance.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { htmlToText } from './audit-sources.mjs';

const RAW = 'report/sources/raw/';
const PROOFS = existsSync('report/review-page-proofs.json') ? JSON.parse(readFileSync('report/review-page-proofs.json', 'utf8')).proofs : [];
const SOURCES = [
  { id: 'magesh2025', url: 'https://arxiv.org/abs/2405.20362', file: 'magesh2025-arxiv.html' },
  { id: 'liu2026citations', url: 'https://arxiv.org/abs/2606.21155', file: 'liu2026citations.html' },
  { id: 'omnibus2026', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1744', file: 'omnibus2026.html' },
  { id: 'art50guidelines2026', url: 'https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems', file: 'art50guidelines2026.html' },
];
const sha = (b) => createHash('sha256').update(b).digest('hex');
const sh = (cmd, args, input) => execFileSync(cmd, args, { input, encoding: 'utf8', maxBuffer: 64 << 20 });

const transport = (url) => {
  const host = new URL(url).host;
  const out = sh('curl', ['-sS', '-L', '-A', 'Mozilla/5.0', '-D', '/tmp/prov-headers.txt', '-o', '/tmp/prov-body.bin', '-w', '%{certs}', url]);
  const body = readFileSync('/tmp/prov-body.bin');
  const headers = readFileSync('/tmp/prov-headers.txt', 'utf8');
  const pem = (out.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/) || [])[0];
  let leaf = {};
  if (pem) {
    const x = sh('openssl', ['x509', '-noout', '-fingerprint', '-sha256', '-issuer', '-subject', '-dates'], pem);
    leaf = {
      sha256: (x.match(/Fingerprint=([0-9A-F:]+)/) || [])[1] || '',
      subject: (x.match(/subject=\s*(.*)/) || [])[1] || '',
      issuer: (x.match(/issuer=\s*(.*)/) || [])[1] || '',
      notBefore: (x.match(/notBefore=(.*)/) || [])[1] || '',
      notAfter: (x.match(/notAfter=(.*)/) || [])[1] || '',
    };
  }
  const h = (name) => (headers.match(new RegExp('^' + name + ':\\s*(.*)$', 'mi')) || [])[1] || '';
  return { host, fetchedAt: new Date().toISOString(), leaf, headers: { date: h('date'), etag: h('etag'), lastModified: h('last-modified'), contentType: h('content-type') }, bodySha256: sha(body) };
};

const timestamp = (root) => {
  writeFileSync('/tmp/prov-root.txt', root);
  sh('openssl', ['ts', '-query', '-data', '/tmp/prov-root.txt', '-sha256', '-cert', '-out', '/tmp/prov.tsq']);
  sh('curl', ['-sS', '-H', 'Content-Type: application/timestamp-query', '--data-binary', '@/tmp/prov.tsq', 'https://freetsa.org/tsr', '-o', '/tmp/prov.tsr']);
  const text = sh('openssl', ['ts', '-reply', '-in', '/tmp/prov.tsr', '-text']);
  const status = (text.match(/Status: (\w+)/) || [])[1] || '';
  const at = (text.match(/Time stamp: (.*)/) || [])[1] || '';
  if (status !== 'Granted') throw new Error('TSA did not grant: ' + status);
  return { tsa: 'https://freetsa.org/tsr', over: 'sha256 of the manifest root, as hex text', at, token: readFileSync('/tmp/prov.tsr').toString('base64') };
};

const provenance = {}; const signatures = existsSync('report/sources/signatures.json') ? JSON.parse(readFileSync('report/sources/signatures.json', 'utf8')) : {};
for (const s of SOURCES) {
  const rec = { id: s.id, url: s.url, archived: s.file, level: 'unsigned' };
  try {
    rec.archivedSha256 = sha(readFileSync(RAW + s.file));
    rec.transport = transport(s.url);
    rec.transport.sameAsArchived = rec.transport.bodySha256 === rec.archivedSha256;
    // reproducibility: which archived passages (manifest leaves) does the live page still carry?
    const man0 = 'report/manifests/' + s.id + '.json';
    if (existsSync(man0)) {
      const root0 = JSON.parse(readFileSync(man0, 'utf8')).root;
      const quotes = [...new Set(PROOFS.filter((pr) => pr.root === root0).map((pr) => String(pr.quote)))];
      const live = htmlToText(readFileSync('/tmp/prov-body.bin', 'utf8')).replace(/\s+/g, ' ');
      const present = quotes.filter((q) => live.includes(q.replace(/\s+/g, ' '))).length;
      rec.transport.quotesInRefetch = { present, of: quotes.length };
    }
    rec.level = 'transport';
  } catch (e) { rec.transportError = String(e.message || e).slice(0, 200); }
  const man = 'report/manifests/' + s.id + '.json';
  if (existsSync(man)) {
    rec.root = JSON.parse(readFileSync(man, 'utf8')).root;
    try { rec.timestamp = timestamp(rec.root); rec.level = 'timestamped'; } catch (e) { rec.timestampError = String(e.message || e).slice(0, 200); }
  }
  provenance[s.id] = rec;
  if (rec.root && rec.level !== 'unsigned') {
    signatures[s.id] = {
      level: rec.level,
      issuer: rec.transport ? rec.transport.host : 'archived copy',
      method: rec.timestamp ? 'tls-transport+rfc3161' : 'tls-transport',
      verifiedAt: new Date().toISOString().slice(0, 10),
      transport: rec.transport ? { host: rec.transport.host, certSha256: rec.transport.leaf.sha256, issuer: rec.transport.leaf.issuer, notAfter: rec.transport.leaf.notAfter, fetchedAt: rec.transport.fetchedAt, sameAsArchived: rec.transport.sameAsArchived, quotesInRefetch: rec.transport.quotesInRefetch } : undefined,
      timestamp: rec.timestamp ? { tsa: 'freetsa.org', at: rec.timestamp.at } : undefined,
    };
  }
}
writeFileSync('report/sources/provenance.json', JSON.stringify(provenance, null, 1) + '\n');
writeFileSync('report/sources/signatures.json', JSON.stringify(signatures, null, 1) + '\n');
for (const r of Object.values(provenance)) {
  console.log(`${r.id.padEnd(20)} ${r.level.padEnd(12)} ${r.transport ? r.transport.host + ' cert ' + (r.transport.leaf.sha256 || '?').slice(0, 23) + (r.transport.sameAsArchived ? ' same bytes' : ' BYTES CHANGED since archive') + (r.transport.quotesInRefetch ? ` (${r.transport.quotesInRefetch.present}/${r.transport.quotesInRefetch.of} quoted passages still live)` : '') : (r.transportError || 'no transport')}${r.timestamp ? ' | tsa ' + r.timestamp.at : (r.timestampError ? ' | tsa error: ' + r.timestampError : '')}`);
}
