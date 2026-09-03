// Anchor the review root on Hedera Consensus Service, then read it back from
// the public mirror node and keep only what the mirror confirms.
//
// What goes on the ledger is the root, never the text: the review root (which
// folds every judgement and the output root), the output root, and a hash of
// roots.json (which lists the root of every source). Anyone with the topic id
// can fetch the message from a mirror node with a consensus timestamp and a
// sequence number that nobody, including us, can change afterwards.
//
// Operator: ~/.config/proveml/hedera-operator.json
//   { "network": "testnet", "accountId": "0.0.x", "privateKey": "302e...", "topicId": "0.0.y" }
//
// usage: node anchor-hedera.mjs [--dry] [--verify]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CONFIG = join(homedir(), '.config', 'proveml', 'hedera-operator.json');
const OUT = 'report/anchors/hedera.json';
const args = new Set(process.argv.slice(2));
const sha = (s) => createHash('sha256').update(s).digest('hex');

const rootsText = readFileSync('report/roots.json', 'utf8');
const roots = JSON.parse(rootsText);
const payload = {
  v: 1,
  kind: 'proveml-review-anchor',
  review: roots.review,
  output: roots.output,
  rootsSha256: sha(rootsText),
  sources: Object.keys(roots.sources).length,
  at: new Date().toISOString(),
};
const message = JSON.stringify(payload);
if (Buffer.byteLength(message) > 1024) throw new Error('payload over the 1024-byte HCS limit');

async function mirrorMessage(net, topicId, seq) {
  const url = `https://${net}.mirrornode.hedera.com/api/v1/topics/${topicId}/messages/${seq}`;
  for (let i = 0; i < 12; i++) {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (res.ok) return { url, body: await res.json() };
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error(`mirror node never returned ${url}`);
}

if (args.has('--verify')) {
  if (!existsSync(OUT)) throw new Error(`nothing to verify: ${OUT} missing`);
  const a = JSON.parse(readFileSync(OUT, 'utf8'));
  const { body } = await mirrorMessage(a.network, a.topicId, a.sequenceNumber);
  const onLedger = Buffer.from(body.message, 'base64').toString('utf8');
  const same = onLedger === JSON.stringify(a.payload);
  console.log(same ? 'mirror node confirms the anchored message' : 'MISMATCH between mirror node and the recorded payload');
  console.log('review root on ledger:', JSON.parse(onLedger).review, same && JSON.parse(onLedger).review === roots.review ? '(matches the current build)' : '(the current build has a different review root)');
  process.exit(same ? 0 : 1);
}

if (args.has('--dry')) {
  console.log('would submit', Buffer.byteLength(message), 'bytes:');
  console.log(message);
  process.exit(0);
}

if (!existsSync(CONFIG)) throw new Error(`no Hedera operator at ${CONFIG}`);
const op = JSON.parse(readFileSync(CONFIG, 'utf8'));
if (!op.topicId) throw new Error('operator config has no topicId; create one with the demos adapter first');
const s = require('@hashgraph/sdk');
const key = op.privateKey.startsWith('3030') ? s.PrivateKey.fromStringECDSA(op.privateKey) : s.PrivateKey.fromStringED25519(op.privateKey);
const net = op.network || 'testnet';
const c = net === 'mainnet' ? s.Client.forMainnet() : s.Client.forTestnet();
c.setOperator(op.accountId, key);
const tx = await new s.TopicMessageSubmitTransaction().setTopicId(op.topicId).setMessage(message).execute(c);
const receipt = await tx.getReceipt(c);
const seq = receipt.topicSequenceNumber?.toString();
const txId = tx.transactionId.toString().replace('@', '-').replace(/\.(\d+)$/, '-$1');
c.close();
console.log('submitted: topic', op.topicId, 'sequence', seq, 'tx', txId);

// Keep only what the mirror node confirms.
const { url, body } = await mirrorMessage(net, op.topicId, seq);
const onLedger = Buffer.from(body.message, 'base64').toString('utf8');
if (onLedger !== message) throw new Error('mirror node returned a different message than submitted');
const record = {
  network: net,
  topicId: op.topicId,
  sequenceNumber: Number(seq),
  consensusTimestamp: body.consensus_timestamp,
  runningHash: body.running_hash,
  payerAccountId: body.payer_account_id,
  transactionId: txId,
  mirror: url,
  hashscanTopic: `https://hashscan.io/${net}/topic/${op.topicId}`,
  hashscanTx: `https://hashscan.io/${net}/transaction/${txId}`,
  payload,
  confirmedByMirrorAt: new Date().toISOString(),
};
mkdirSync('report/anchors', { recursive: true });
writeFileSync(OUT, JSON.stringify(record, null, 1) + '\n');
console.log('mirror node confirms it at consensus time', body.consensus_timestamp, '->', OUT);
