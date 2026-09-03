// The review as a PDPP source: the reviewer's judgements and sign-offs served
// as two streams under a grant, so an editor's system reads them on the
// reviewer's terms instead of receiving a file. Same Core surfaces as
// pdpp-server.mjs (sections 4, 5, 7, 8), one declaration, records read from
// the build's own files at start.
//
// usage: node pdpp-review-server.mjs [port]   (default 8791)
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.argv[2] || 8791);
const BASE = `http://127.0.0.1:${PORT}`;
const review = existsSync('report/review.json') ? JSON.parse(readFileSync('report/review.json', 'utf8')) : { judgements: {} };
const signoffs = existsSync('report/signoffs.json') ? JSON.parse(readFileSync('report/signoffs.json', 'utf8')) : [];
const roots = JSON.parse(readFileSync('report/roots.json', 'utf8'));
const streams = {
  judgements: Object.entries(review.judgements || {}).map(([id, v]) => ({ id, src: v.src, field: v.field, verdict: v.verdict, by: v.by || 'reviewer', inference: !!v.inference, at: v.at, source_updated_at: v.at })),
  signoffs: signoffs.map((s, i) => ({ id: String(i + 1), root: s.root, outputRoot: s.outputRoot, issuer: s.issuer, keyId: s.keyId, format: s.format, judgements: s.judgements, issuedAt: s.issuedAt, jwt: s.jwt, source_updated_at: s.issuedAt })),
};
const DECLARATION = { protocol_version: '0.1.0', source: { kind: 'provider_native', id: BASE }, declaration_version: '2026-09-03', publisher: { id: 'vera-paper1' }, display: { name: 'the review of ProveML paper 1: judgements and sign-offs' },
  streams: [
    { name: 'judgements', primary_key: 'id', cursor_field: 'source_updated_at', semantics: 'mutable_state', schema: { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', required: ['id', 'source_updated_at'], properties: { id: { type: 'string' }, src: { type: 'string' }, field: { type: 'string' }, verdict: { type: 'string' }, by: { type: 'string' }, inference: { type: 'boolean' }, at: { type: 'string' }, source_updated_at: { type: 'string' } } } },
    { name: 'signoffs', primary_key: 'id', cursor_field: 'source_updated_at', semantics: 'append_only', schema: { $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', required: ['id', 'source_updated_at'], properties: { id: { type: 'string' }, root: { type: 'string' }, outputRoot: { type: 'string' }, issuer: { type: 'string' }, keyId: { type: 'string' }, format: { type: 'string' }, judgements: { type: 'integer' }, issuedAt: { type: 'string' }, jwt: { type: 'string' }, source_updated_at: { type: 'string' } } } },
  ] };
const grants = new Map(); const tokens = new Map();
const json = (res, status, body, headers = {}) => { res.writeHead(status, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((r) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => r(s ? JSON.parse(s) : {})); });
const introspect = (token) => { const t = tokens.get(token); if (!t || (t.exp && Date.now() / 1000 > t.exp)) return { active: false }; const g = grants.get(t.grant_id); return { active: true, pdpp_token_kind: 'client', subject_id: g.subject.id, grant_id: g.grant_id, client_id: g.client.client_id, exp: t.exp, authorization_details: [{ type: 'pdpp_grant', grant_id: g.grant_id, source: g.source, streams: g.streams, access_mode: g.access_mode, purpose_code: g.purpose_code }] }; };
createServer(async (req, res) => {
  const url = new URL(req.url, BASE); const path = url.pathname;
  if (path === '/.well-known/oauth-protected-resource') return json(res, 200, { resource: BASE, resource_name: DECLARATION.display.name, authorization_servers: [BASE], bearer_methods_supported: ['header'], pdpp_core_query_base: '/v1', pdpp_token_kinds_supported: ['client'], pdpp_self_export_supported: false, pdpp_provider_connect_version: '0.1.0', implementation: 'vera pdpp-review-server.mjs: Core sections 4, 5, 7, 8 only' });
  if (path === '/declaration') return json(res, 200, DECLARATION);
  if (path === '/grant' && req.method === 'POST') {
    const body = await readBody(req); const id = 'grt_' + randomBytes(4).toString('hex'); const now = new Date();
    const want = body.streams || ['judgements', 'signoffs'];
    const g = { version: '0.1.0', grant_id: id, issued_at: now.toISOString(), subject: { id: 'did:web:abovebeyond.ai' }, client: { client_id: body.client_id || 'editor' }, source: { kind: 'provider_native', id: BASE }, source_declaration: { version: DECLARATION.declaration_version }, purpose_code: body.purpose_code || 'https://pdpp.dev/purpose/editorial-review', access_mode: 'continuous', streams: want.map((n) => ({ name: n, instance_ids: ['paper1'], fields: (body.fields && body.fields[n]) || Object.keys(DECLARATION.streams.find((s) => s.name === n).schema.properties) })), expires_at: new Date(now.getTime() + 86400e3).toISOString(), acceptance: 'explicit local provisioning' };
    grants.set(id, g); const token = 'pdpp_' + randomBytes(16).toString('hex'); tokens.set(token, { grant_id: id, exp: Math.floor(now.getTime() / 1000) + 86400 });
    return json(res, 201, { grant: g, access_token: token, token_type: 'Bearer', expires_in: 86400 });
  }
  if (path === '/introspect' && req.method === 'POST') { const body = await readBody(req); return json(res, 200, introspect(body.token)); }
  if (!path.startsWith('/v1/')) return json(res, 404, { error: 'not_found' });
  const auth = req.headers.authorization || ''; const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''; const ctx = token ? introspect(token) : { active: false };
  if (!ctx.active) return json(res, 401, { error: 'invalid_token' }, { 'www-authenticate': `Bearer resource_metadata="${BASE}/.well-known/oauth-protected-resource"` });
  const granted = ctx.authorization_details[0].streams;
  if (path === '/v1/streams') return json(res, 200, { object: 'list', data: granted.map((g) => ({ object: 'stream', name: g.name, primary_key: 'id', cursor_field: 'source_updated_at', semantics: DECLARATION.streams.find((s) => s.name === g.name).semantics })) });
  const m = path.match(/^\/v1\/streams\/(\w+)(\/records)?$/);
  if (!m) return json(res, 404, { error: 'not_found' });
  const gs = granted.find((g) => g.name === m[1]); if (!gs) return json(res, 403, { error: 'stream_not_granted' });
  const decl = DECLARATION.streams.find((s) => s.name === m[1]);
  if (!m[2]) return json(res, 200, { object: 'stream_metadata', name: m[1], primary_key: 'id', cursor_field: 'source_updated_at', semantics: decl.semantics, schema: decl.schema, fields_granted: gs.fields });
  for (const k of url.searchParams.keys()) { if (k.startsWith('filter[') || k === 'view' || k.startsWith('expand')) return json(res, 400, { error: 'invalid_request', detail: `${k} is not part of the client-token surface` }); if (!['limit', 'cursor', 'order', 'fields', 'changes_since'].includes(k)) return json(res, 400, { error: 'invalid_request', detail: `unknown parameter ${k}` }); }
  let limit = Number(url.searchParams.get('limit') || 25); const warnings = []; if (limit > 100) { limit = 100; warnings.push({ code: 'limit_clamped', limit: 100 }); }
  const all = streams[m[1]].slice().sort((a, b) => (a.source_updated_at < b.source_updated_at ? -1 : a.source_updated_at > b.source_updated_at ? 1 : a.id < b.id ? -1 : 1));
  const sorted = (url.searchParams.get('order') || 'desc') === 'asc' ? all : all.reverse();
  const start = Number(url.searchParams.get('cursor') || 0); const page = sorted.slice(start, start + limit);
  const allowed = new Set([...gs.fields, 'id', 'source_updated_at']);
  const data = page.map((r) => ({ object: 'record', stream: m[1], key: r.id, data: Object.fromEntries(Object.entries(r).filter(([k]) => allowed.has(k))), emitted_at: r.source_updated_at }));
  return json(res, 200, { object: 'list', data, next_cursor: start + limit < sorted.length ? String(start + limit) : null, ...(warnings.length ? { meta: { warnings } } : {}) });
}).listen(PORT, '127.0.0.1', () => console.log(`review as a pdpp source at ${BASE}: ${streams.judgements.length} judgements, ${streams.signoffs.length} sign-offs; review root ${roots.review.slice(0, 12)}`));
