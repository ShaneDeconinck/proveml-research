// Anchor the review root in Sigstore's Rekor, a public append-only
// transparency log (RFC 6962 style). No account, no money: an entry is a
// signed hash. The signature needs a key, so one is made once with openssl
// and kept in ~/.config/proveml/rekor-key.pem; the log records the public
// key beside the entry, so anyone can check the signature and the inclusion
// proof the log returns is a real merkle path to a signed checkpoint.
//
// The payload is the same one the Hedera anchor posts (review root, output
// root, sha256 of roots.json), so the two logs vouch for one message.
//
// usage: node anchor-rekor.mjs [--dry] [--verify]
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const KEY = join(homedir(), '.config', 'proveml', 'rekor-key.pem');
const PUB = join(homedir(), '.config', 'proveml', 'rekor-key.pub.pem');
const REKOR = 'https://rekor.sigstore.dev';
const OUT = 'report/anchors/rekor.json';
const args = new Set(process.argv.slice(2));
const sha = (b) => createHash('sha256').update(b).digest('hex');

const rootsText = readFileSync('report/roots.json', 'utf8');
const roots = JSON.parse(rootsText);
const payload = { v: 1, kind: 'proveml-review-anchor', review: roots.review, output: roots.output, rootsSha256: sha(rootsText), sources: Object.keys(roots.sources).length, at: new Date().toISOString() };
const message = Buffer.from(JSON.stringify(payload));

async function fetchEntry(uuid) {
  const res = await fetch(`${REKOR}/api/v1/log/entries/${uuid}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`rekor ${res.status} fetching ${uuid}`);
  const body = await res.json();
  return body[uuid];
}

if (args.has('--verify')) {
  if (!existsSync(OUT)) throw new Error(`nothing to verify: ${OUT} missing`);
  const a = JSON.parse(readFileSync(OUT, 'utf8'));
  const e = await fetchEntry(a.uuid);
  const same = e.logIndex === a.logIndex && e.integratedTime === a.integratedTime && e.body === a.entryBody;
  console.log(same ? 'rekor confirms the entry' : 'MISMATCH between rekor and the recorded entry');
  console.log('review root on the log:', a.payload.review, a.payload.review === roots.review ? '(matches the current build)' : '(the current build has a different review root)');
  process.exit(same ? 0 : 1);
}
if (args.has('--dry')) { console.log('would sign and post', message.length, 'bytes:'); console.log(message.toString()); process.exit(0); }

mkdirSync(join(homedir(), '.config', 'proveml'), { recursive: true });
if (!existsSync(KEY)) {
  execFileSync('openssl', ['ecparam', '-genkey', '-name', 'prime256v1', '-noout', '-out', KEY]);
  execFileSync('chmod', ['600', KEY]);
  console.log('made a new ECDSA P-256 key at', KEY);
}
if (!existsSync(PUB)) execFileSync('openssl', ['ec', '-in', KEY, '-pubout', '-out', PUB], { stdio: ['ignore', 'ignore', 'ignore'] });
mkdirSync('report/anchors', { recursive: true });
writeFileSync('report/anchors/rekor-message.json', message);
const sig = execFileSync('openssl', ['dgst', '-sha256', '-sign', KEY, 'report/anchors/rekor-message.json']);
const pub = readFileSync(PUB);
const entry = {
  apiVersion: '0.0.1', kind: 'hashedrekord',
  spec: { data: { hash: { algorithm: 'sha256', value: sha(message) } }, signature: { content: sig.toString('base64'), publicKey: { content: pub.toString('base64') } } },
};
const res = await fetch(`${REKOR}/api/v1/log/entries`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(entry) });
if (res.status !== 201 && res.status !== 409) throw new Error(`rekor ${res.status}: ${await res.text()}`);
const created = await res.json();
const uuid = Object.keys(created)[0];
const e = created[uuid];
// Read it back from the log as a stranger would, and keep only that.
const back = await fetchEntry(uuid);
const record = {
  log: REKOR, uuid, logIndex: back.logIndex, logID: back.logID, integratedTime: back.integratedTime,
  integratedAt: new Date(back.integratedTime * 1000).toISOString(),
  entryBody: back.body, inclusionProof: back.verification && back.verification.inclusionProof, signedEntryTimestamp: back.verification && back.verification.signedEntryTimestamp,
  publicKeySha256: sha(pub), messageSha256: sha(message), payload,
  search: `${REKOR}/api/v1/log/entries?logIndex=${back.logIndex}`, hashscanLike: `https://search.sigstore.dev/?logIndex=${back.logIndex}`,
  confirmedByLogAt: new Date().toISOString(), status: res.status === 409 ? 'already in the log' : 'created',
};
writeFileSync(OUT, JSON.stringify(record, null, 1) + '\n');
console.log(`rekor ${record.status}: index ${record.logIndex}, integrated ${record.integratedAt}, inclusion proof with ${(record.inclusionProof && record.inclusionProof.hashes || []).length} hashes -> ${OUT}`);
