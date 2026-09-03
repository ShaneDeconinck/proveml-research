// Vera's incoming adapter for a PDPP source: discover the resource server,
// obtain a grant by explicit local provisioning, page through the granted
// records as a client, and keep what came back as a source the page can bind
// to: one canonical record envelope per line (each line a merkle leaf), plus
// the grant, the introspection the server enforced from, and the metadata.
//
// What this proves and what it does not. It proves what Vera RECEIVED under
// which grant, for which purpose, projected to which fields, at what time,
// and the root over it can be anchored like any other. It does not prove that
// the server enforced the grant: PDPP 0.1 specifies no receipt for that, and
// this record is the client-side half a receipt profile would need.
//
// usage: node source-pdpp.mjs [base]   (default http://127.0.0.1:8790)
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const BASE = process.argv[2] || 'http://127.0.0.1:8790';
const sha = (s) => createHash('sha256').update(s).digest('hex');
const get = async (path, token, ok = 200) => {
  const res = await fetch(BASE + path, { headers: { accept: 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) } });
  if (res.status !== ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return { body: await res.json(), headers: res.headers };
};

// 1. Discovery: an unauthenticated request must point at the metadata (Core section 8).
const probe = await fetch(BASE + '/v1/streams');
const challenge = probe.headers.get('www-authenticate') || '';
if (probe.status !== 401 || !/resource_metadata=/.test(challenge)) throw new Error('resource server did not challenge with resource_metadata');
const metaUrl = challenge.match(/resource_metadata="([^"]+)"/)[1];
const meta = (await (await fetch(metaUrl)).json());
const declaration = (await get('/declaration')).body;

// 2. The grant: explicit local provisioning, minimised to the fields the study needs. No names.
const fields = ['id', 'offering', 'grade', 'ev', 'pass', 'source_updated_at'];
const gres = await fetch(BASE + '/grant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client_id: 'vera', subject_id: 'school:sint-amandus', purpose_code: 'https://pdpp.dev/purpose/research', fields }) });
if (gres.status !== 201) throw new Error('grant refused: ' + gres.status);
const { grant, access_token } = await gres.json();
const introspection = await (await fetch(BASE + '/introspect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: access_token }) })).json();

// 3. The records, as a client: all pages, ascending, at the clamped maximum.
const streams = (await get('/v1/streams', access_token)).body;
const streamMeta = (await get('/v1/streams/students', access_token)).body;
const lines = []; let cursor = null; let pages = 0; let clamped = false;
do {
  const q = '/v1/streams/students/records?limit=100&order=asc' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
  const { body } = await get(q, access_token);
  if (body.meta && body.meta.warnings && body.meta.warnings.some((w) => w.code === 'limit_clamped')) clamped = true;
  for (const r of body.data) lines.push(JSON.stringify({ stream: r.stream, key: r.key, data: r.data, emitted_at: r.emitted_at }));
  cursor = body.next_cursor; pages++;
} while (cursor);
// A filter on a client token must be refused: check the server enforces its own rule.
const refused = (await fetch(BASE + '/v1/streams/students/records?filter[grade]=1', { headers: { authorization: 'Bearer ' + access_token } })).status === 400;

// 4. What the page binds to. First line: the count, quotable; then one leaf per record.
const fetchedAt = new Date().toISOString();
const text = [`records: ${lines.length} (stream students, grant ${grant.grant_id}, purpose ${grant.purpose_code}, fields ${fields.join(' ')})`, ...lines].join('\n') + '\n';
mkdirSync('report/sources/raw', { recursive: true });
writeFileSync('report/sources/raw/pdpp-students.txt', text);
const record = {
  source: { kind: declaration.source.kind, id: declaration.source.id, name: declaration.display.name, declaration_version: declaration.declaration_version, implementation: meta.implementation || null },
  metadata: meta, grant, introspection, streams, streamMeta,
  fetchedAt, pages, records: lines.length, limitClamped: clamped, clientFilterRefused: refused,
  recordsSha256: sha(lines.join('\n')), fieldsGranted: fields, fieldsWithheld: Object.keys(declaration.streams[0].schema.properties).filter((f) => !fields.includes(f)),
};
writeFileSync('report/sources/pdpp-grant.json', JSON.stringify(record, null, 1) + '\n');
console.log(`granted ${grant.grant_id} for ${grant.purpose_code}; received ${lines.length} records in ${pages} pages, fields ${fields.join(',')}, withheld ${record.fieldsWithheld.join(',')}; client filter refused: ${refused}; limit clamped: ${clamped}`);
