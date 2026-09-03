// Run the scripts the paper's own numbers come from, and keep the record of
// the run: the command, where it ran, the commit it ran on, when, how long,
// the exit code, the hash of what it printed, and whether that output is
// byte-identical to the snapshot the review page binds to. A snapshot that
// no run reproduces is a claim; a run record is evidence.
//
// The snapshots are NOT replaced by default: a differing output is recorded
// as such (timing figures are the honest case), and --adopt writes it over
// the snapshot so the next build binds to the new text.
//
// usage: node regenerate.mjs [--only id,id] [--adopt] [--repo <path>]
import { spawnSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');   // the research repository

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const REPO = opt('--repo') || new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const ONLY = opt('--only') ? new Set(opt('--only').split(',')) : null;
const ADOPT = argv.includes('--adopt');
const sha = (s) => createHash('sha256').update(s).digest('hex');

// id -> snapshot file, working directory, command. The commands are the ones
// that produced the snapshots on 2026-09-02, recovered from the session log.
const RUNS = [
  { id: 'summary', out: 'frontier-summary.txt', cwd: REPO + '/experiments', cmd: ['node', 'frontier-summary.mjs'] },
  { id: 'summary2', out: 'frontier2-summary.txt', cwd: REPO + '/experiments', cmd: ['node', 'frontier-summary.mjs', '--tag', 'frontier2'] },
  { id: 'residuals', out: 'frontier-residuals.txt', cwd: REPO + '/experiments', cmd: ['node', 'frontier-residuals.mjs'] },
  { id: 'deployment', out: 'deployment-numbers.txt', cwd: REPO + '/experiments', cmd: ['node', 'deployment-numbers.mjs', '--tag', 'frontier'] },
  { id: 'dataset', out: 'dataset-meta.txt', cwd: process.cwd(), cmd: ['python3', 'meta-sources.py', REPO, 'dataset'] },
  { id: 'benchmarks', out: 'benchmarks.txt', cwd: process.cwd(), cmd: ['python3', 'meta-sources.py', REPO, 'benchmarks'] },
  { id: 'finance', out: 'finance.txt', cwd: process.cwd(), cmd: ['python3', 'meta-sources.py', REPO, 'finance'] },
  { id: 'package', out: 'package.txt', cwd: process.cwd(), cmd: ['python3', '-c', "import json;d=json.load(open(new URL('../../node_modules/proveml/package.json', import.meta.url).pathname));print('name',d.get('name'));print('version',d.get('version'));print('dependencies',json.dumps(d.get('dependencies',{})))"] },
];

const git = (cwd, args) => { try { return execSync('git ' + args, { cwd, encoding: 'utf8' }).trim(); } catch { return ''; } };
const commit = git(REPO, 'rev-parse --short HEAD');
const dirty = git(REPO, 'status --short').split('\n').filter(Boolean).length;
const branch = git(REPO, 'rev-parse --abbrev-ref HEAD');
mkdirSync('report/runs', { recursive: true });

for (const r of RUNS) {
  if (ONLY && !ONLY.has(r.id)) continue;
  const started = new Date();
  const t0 = process.hrtime.bigint();
  const res = spawnSync(r.cmd[0], r.cmd.slice(1), { cwd: r.cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const ms = Number((process.hrtime.bigint() - t0) / 1000000n);
  const stdout = res.stdout || '';
  const snapPath = 'report/sources/raw/' + r.out;
  const snapshot = existsSync(snapPath) ? readFileSync(snapPath, 'utf8') : null;
  const same = snapshot !== null && snapshot.trimEnd() === stdout.trimEnd();
  const record = {
    id: r.id, snapshot: r.out,
    command: r.cmd.join(' ').replace(REPO, '<repo>'), cwd: r.cwd.replace(REPO, '<repo>'),
    repo: { path: REPO, commit, branch, uncommittedChanges: dirty },
    startedAt: started.toISOString(), durationMs: ms, exitCode: res.status,
    stdoutSha256: sha(stdout), stdoutBytes: Buffer.byteLength(stdout),
    snapshotSha256: snapshot === null ? null : sha(snapshot),
    sameAsSnapshot: same,
    stderrTail: (res.stderr || '').split('\n').filter(Boolean).slice(-8),
    node: process.version,
  };
  writeFileSync('report/runs/' + r.id + '.json', JSON.stringify(record, null, 1) + '\n');
  writeFileSync('report/runs/' + r.id + '.out', stdout);
  if (ADOPT && res.status === 0 && !same) { writeFileSync(snapPath, stdout); record.adopted = true; }
  console.log(`${r.id.padEnd(11)} exit ${res.status} ${String(ms).padStart(7)} ms  ${same ? 'identical to the snapshot' : (snapshot === null ? 'no snapshot' : 'DIFFERS from the snapshot')}${ADOPT && !same && res.status === 0 ? ' (adopted)' : ''}`);
}
