// Anchor the review root on Vana L1 (Moksha testnet): a file record in the
// DataRegistry whose url IS the payload (a data: URL, so the chain carries the
// bytes, not a pointer that can rot), then a proof on that file signed by our
// own key. The proof's score is 0 on purpose: a score is a DLP's judgement of
// data quality and we are not a DLP; the metadata carries what we attest to.
// What is kept is what the chain returns: file id, block, transaction hashes,
// and the file and proof read back from the registry.
//
// key: ~/.config/proveml/vana-key.json {network, address, privateKey}
// usage: node anchor-vana.mjs [--dry] [--verify]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JsonRpcProvider, Wallet, Contract, formatEther } = require('ethers');

const RPC = 'https://rpc.moksha.vana.org', CHAIN = 14800, EXPLORER = 'https://moksha.vanascan.io';
const REGISTRY = '0x8C8788f98385F6ba1adD4234e551ABba0f82Cb7C';
const ABI = JSON.parse(readFileSync(new URL('./vana-dataregistry-abi.json', import.meta.url), 'utf8'));
const OUT = 'report/anchors/vana.json';
const args = new Set(process.argv.slice(2));
const sha = (s) => createHash('sha256').update(s).digest('hex');

const rootsText = readFileSync('report/roots.json', 'utf8');
const roots = JSON.parse(rootsText);
const payload = { v: 1, kind: 'proveml-review-anchor', review: roots.review, output: roots.output, rootsSha256: sha(rootsText), sources: Object.keys(roots.sources).length, at: new Date().toISOString() };
const message = JSON.stringify(payload);
const url = 'data:application/json;base64,' + Buffer.from(message).toString('base64');

const provider = new JsonRpcProvider(RPC, CHAIN);
const registry = new Contract(REGISTRY, ABI, provider);

if (args.has('--verify')) {
  const a = JSON.parse(readFileSync(OUT, 'utf8'));
  const f = await registry.files(a.fileId);
  const same = f.url === a.url && f.ownerAddress.toLowerCase() === a.owner.toLowerCase();
  console.log(same ? 'registry confirms the file record' : 'MISMATCH between the registry and the recorded file');
  console.log('review root on chain:', JSON.parse(Buffer.from(f.url.split(',')[1], 'base64').toString()).review, a.payload.review === roots.review ? '(matches the current build)' : '(the current build has a different review root)');
  process.exit(same ? 0 : 1);
}
const key = JSON.parse(readFileSync(homedir() + '/.config/proveml/vana-key.json', 'utf8'));
const wallet = new Wallet(key.privateKey, provider);
const balance = await provider.getBalance(wallet.address);
console.log('wallet', wallet.address, 'balance', formatEther(balance), 'VANA');
if (args.has('--dry') || balance === 0n) {
  console.log(balance === 0n ? 'unfunded: nothing sent. Fund it at https://faucet.vana.org/moksha and run again.' : 'dry run: nothing sent.');
  console.log('would call addFile(url) with', Buffer.byteLength(url), 'bytes, then addProof(fileId, {signature, data:{score:0, dlpId:0, metadata, proofUrl, instruction}})');
  process.exit(balance === 0n ? 2 : 0);
}
const w = registry.connect(wallet);
const tx1 = await w.addFile(url);
const r1 = await tx1.wait();
const ev = r1.logs.map((l) => { try { return registry.interface.parseLog(l); } catch { return null; } }).find((e) => e && (e.name === 'FileAdded' || e.name === 'FileAddedV2'));
const fileId = ev.args.fileId;
const metadata = JSON.stringify({ attests: 'vera review root', review: roots.review, output: roots.output, rekor: existsSync('report/anchors/rekor.json') ? JSON.parse(readFileSync('report/anchors/rekor.json', 'utf8')).logIndex : null, hedera: existsSync('report/anchors/hedera.json') ? JSON.parse(readFileSync('report/anchors/hedera.json', 'utf8')).sequenceNumber : null });
const signature = await wallet.signMessage(metadata);
const proof = { signature, data: { score: 0n, dlpId: 0n, metadata, proofUrl: existsSync('report/anchors/rekor.json') ? JSON.parse(readFileSync('report/anchors/rekor.json', 'utf8')).search : '', instruction: 'proveml-review-anchor:v1; score 0 by design, this is an attestation not a quality score' } };
const tx2 = await w.addProof(fileId, proof);
const r2 = await tx2.wait();
const f = await registry.files(fileId);
const p = await registry.fileProofs(fileId, 0);
const record = {
  network: 'vana-moksha', chainId: CHAIN, registry: REGISTRY, owner: wallet.address, fileId: fileId.toString(), url,
  addFileTx: tx1.hash, addFileBlock: r1.blockNumber, addProofTx: tx2.hash, addProofBlock: r2.blockNumber,
  fileReadBack: { id: f.id.toString(), owner: f.ownerAddress, url: f.url, schemaId: f.schemaId.toString(), addedAtBlock: f.addedAtBlock.toString() },
  proofReadBack: { signature: p.signature, metadata: p.data.metadata, proofUrl: p.data.proofUrl, instruction: p.data.instruction, score: p.data.score.toString() },
  explorerFile: `${EXPLORER}/tx/${tx1.hash}`, explorerProof: `${EXPLORER}/tx/${tx2.hash}`, explorerRegistry: `${EXPLORER}/address/${REGISTRY}`,
  payload, confirmedByChainAt: new Date().toISOString(),
};
mkdirSync('report/anchors', { recursive: true });
writeFileSync(OUT, JSON.stringify(record, null, 1) + '\n');
console.log(`vana: file ${fileId} in block ${r1.blockNumber}, proof in block ${r2.blockNumber} -> ${OUT}`);
