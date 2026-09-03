// A minimal PDPP source: a co-located authorization server and resource
// server for one stream, "students", drawn from the study's (synthetic)
// pupil dataset. Implements the normative surfaces of PDPP Core 0.1.0 that a
// client touches: RFC 9728 protected-resource metadata with the PDPP members,
// a grant object (Core section 7) issued by explicit local provisioning
// (Core section 5), RFC 7662 introspection with the PDPP fields, and the
// section 8 query interface: /v1/streams, /v1/streams/{stream},
// /v1/streams/{stream}/records with the RECORD envelope (section 4), bearer
// tokens, a 401 challenge that names the metadata, field projection from the
// grant, cursor pagination, and rejection of client-token filters.
//
// This is Vera's own implementation of those sections, not the lab's
// reference implementation, and it says so in its metadata.
//
// usage: node pdpp-server.mjs [port]   (default 8790)
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');   // the research repository

const PORT = Number(process.argv[2] || 8790);
const BASE = `http://127.0.0.1:${PORT}`;
const DATA = ROOT + '/data/mastery-layers-demo.json';
const d = JSON.parse(readFileSync(DATA, 'utf8'));

// The stream: one record per pupil, keyed by pupil id, with the class it sits in.
const EMITTED = '2026-09-03T21:30:00Z';
const records = [];
for (const o of d.offerings) for (const s of o.students) {
  records.push({ id: String(s.id), name: s.name, offering: String(o.id), class: o.name, school: o.school, grade: o.grade, stream_track: o.stream, ev: s.ev, pass: s.pass, source_updated_at: EMITTED });
}
records.sort((a, b) => (a.id < b.id ? -1 : 1));

const DECLARATION = {
  protocol_version: '0.1.0', source: { kind: 'provider_native', id: BASE }, declaration_version: '2026-09-03',
  publisher: { id: 'vera-paper1' }, display: { name: 'Sint-Amandus pupil records (synthetic study data)' },
  streams: [{ name: 'students', primary_key: 'id', cursor_field: 'source_updated_at', semantics: 'mutable_state',
    schema: { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', required: ['id', 'source_updated_at'],
      properties: { id: { type: 'string' }, name: { type: 'string' }, offering: { type: 'string' }, class: { type: 'string' }, school: { type: 'string' }, grade: { type: 'integer' }, stream_track: { type: 'string' }, ev: { type: 'number' }, pass: { type: 'boolean' }, source_updated_at: { type: 'string' } } } }],
};
const grants = new Map();   // grant_id -> grant
const tokens = new Map();   // access_token -> { grant_id, kind, exp, used }

const json = (res, status, body, headers = {}) => { res.writeHead(status, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((r) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => r(s ? JSON.parse(s) : {})); });
const introspect = (token) => {
  const t = tokens.get(token); if (!t) return { active: false };
  if (t.exp && Date.now() / 1000 > t.exp) return { active: false };
  const g = grants.get(t.grant_id);
  return { active: true, pdpp_token_kind: 'client', subject_id: g.subject.id, grant_id: g.grant_id, client_id: g.client.client_id, exp: t.exp,
    authorization_details: [{ type: 'pdpp_grant', grant_id: g.grant_id, source: g.source, streams: g.streams, access_mode: g.access_mode, purpose_code: g.purpose_code }] };
};

createServer(async (req, res) => {
  const url = new URL(req.url, BASE);
  const path = url.pathname;
  if (path === '/.well-known/oauth-protected-resource') {
    return json(res, 200, { resource: BASE, resource_name: DECLARATION.display.name, authorization_servers: [BASE], bearer_methods_supported: ['header'],
      pdpp_core_query_base: '/v1', pdpp_token_kinds_supported: ['client'], pdpp_self_export_supported: false, pdpp_provider_connect_version: '0.1.0',
      implementation: 'vera pdpp-server.mjs: Core sections 4, 5, 7, 8 only; not the lab reference implementation' });
  }
  if (path === '/declaration') return json(res, 200, DECLARATION);
  if (path === '/grant' && req.method === 'POST') {
    // Explicit local provisioning (Core section 5): the operator provisions the grant on the owner's behalf.
    const body = await readBody(req);
    const id = 'grt_' + randomBytes(4).toString('hex');
    const now = new Date();
    const g = { version: '0.1.0', grant_id: id, issued_at: now.toISOString(), subject: { id: body.subject_id || 'school:sint-amandus' },
      client: { client_id: body.client_id || 'vera' }, source: { kind: 'provider_native', id: BASE }, source_declaration: { version: DECLARATION.declaration_version },
      purpose_code: body.purpose_code || 'https://pdpp.dev/purpose/research', access_mode: 'single_use',
      streams: [{ name: 'students', instance_ids: ['sint-amandus-2025-2026'], fields: body.fields || ['id', 'offering', 'grade', 'ev', 'pass', 'source_updated_at'] }],
      expires_at: new Date(now.getTime() + 3600e3).toISOString(), acceptance: 'explicit local provisioning' };
    grants.set(id, g);
    const token = 'pdpp_' + randomBytes(16).toString('hex');
    tokens.set(token, { grant_id: id, kind: 'client', exp: Math.floor(now.getTime() / 1000) + 3600, used: false });
    return json(res, 201, { grant: g, access_token: token, token_type: 'Bearer', expires_in: 3600 });
  }
  if (path === '/introspect' && req.method === 'POST') { const body = await readBody(req); return json(res, 200, introspect(body.token)); }
  if (!path.startsWith('/v1/')) return json(res, 404, { error: 'not_found' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const ctx = token ? introspect(token) : { active: false };
  if (!ctx.active) return json(res, 401, { error: 'invalid_token' }, { 'www-authenticate': `Bearer resource_metadata="${BASE}/.well-known/oauth-protected-resource"` });
  const detail = ctx.authorization_details[0];
  const gs = detail.streams[0];
  if (path === '/v1/streams') return json(res, 200, { object: 'list', data: [{ object: 'stream', name: 'students', primary_key: 'id', cursor_field: 'source_updated_at', semantics: 'mutable_state' }] });
  if (path === '/v1/streams/students') return json(res, 200, { object: 'stream_metadata', name: 'students', primary_key: 'id', cursor_field: 'source_updated_at', semantics: 'mutable_state', schema: DECLARATION.streams[0].schema, fields_granted: gs.fields });
  if (path === '/v1/streams/students/records') {
    for (const k of url.searchParams.keys()) {
      if (k.startsWith('filter[') || k === 'view' || k.startsWith('expand')) return json(res, 400, { error: 'invalid_request', detail: `${k} is not part of the client-token surface` });
      if (!['limit', 'cursor', 'order', 'fields', 'changes_since'].includes(k)) return json(res, 400, { error: 'invalid_request', detail: `unknown parameter ${k}` });
    }
    const warnings = [];
    let limit = Number(url.searchParams.get('limit') || 25); if (limit > 100) { limit = 100; warnings.push({ code: 'limit_clamped', limit: 100 }); }
    const order = url.searchParams.get('order') || 'desc';
    const sorted = order === 'asc' ? records : records.slice().reverse();
    const start = Number(url.searchParams.get('cursor') || 0);
    const page = sorted.slice(start, start + limit);
    // Grant enforcement: project every record to the granted fields; schema-required fields always included.
    const allowed = new Set([...gs.fields, 'id', 'source_updated_at']);
    const data = page.map((r) => ({ object: 'record', stream: 'students', key: r.id, data: Object.fromEntries(Object.entries(r).filter(([k]) => allowed.has(k))), emitted_at: EMITTED }));
    const next = start + limit < sorted.length ? String(start + limit) : null;
    return json(res, 200, { object: 'list', data, next_cursor: next, ...(warnings.length ? { meta: { warnings } } : {}) });
  }
  if (path.startsWith('/v1/streams/')) return json(res, 404, { error: 'unknown_stream' });
  return json(res, 404, { error: 'not_found' });
}).listen(PORT, '127.0.0.1', () => console.log(`pdpp source at ${BASE}: ${records.length} pupil records in stream "students"`));
