// Sign the review root with the reviewer's did:web key, as the credential the
// demos already define (SD-JWT VC, vct urn:proveml:review:1), verify it the way
// a stranger would (resolve did:web:abovebeyond.ai, check the signature,
// recompute the root from the review and the output root), and append the
// sign-off to an append-only file. A sign-off is never deleted, only joined by
// later ones; each names the root it covered and the judgement ids under it,
// so a later change reopens only what the root no longer covers.
//
// usage: node sign-review.mjs [--verify]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
const { issueReviewCredential, verifyReviewCredential } = await import((process.env.PROVEML_DEMOS || new URL('../../../proveml-demos', import.meta.url).pathname) + '/adapters/review-vc.mjs');

const KEY = homedir() + '/.config/proveml/abovebeyond-signing.jwk';
const ISSUER = 'did:web:abovebeyond.ai';
const OUT = 'report/signoffs.json';
const roots = JSON.parse(readFileSync('report/roots.json', 'utf8'));
const review = existsSync('report/review.json') ? JSON.parse(readFileSync('report/review.json', 'utf8')) : { judgements: {} };
if (!review.judgements) review.judgements = {};
const signoffs = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];

if (process.argv.includes('--verify')) {
  for (const s of signoffs) {
    const v = await verifyReviewCredential({ jwt: s.jwt, review: { judgements: Object.fromEntries(Object.entries(review.judgements).filter(([id]) => s.covers.includes(id))) }, outputRoot: s.outputRoot });
    console.log(s.root.slice(0, 12), s.issuedAt, v.verified ? 'verified' : 'NOT verified', JSON.stringify(v.checks));
  }
  process.exit(0);
}
const { privateJwk } = JSON.parse(readFileSync(KEY, 'utf8'));
const { jwt, root } = await issueReviewCredential({ review, outputRoot: roots.output, sources: roots.sources, issuerDid: ISSUER, privateJwk });
if (root !== roots.review) throw new Error(`the credential's root ${root} is not the build's ${roots.review}`);
const v = await verifyReviewCredential({ jwt, review, outputRoot: roots.output });
if (!v.verified) throw new Error('the fresh credential does not verify: ' + JSON.stringify(v.checks));
const entry = { root, outputRoot: roots.output, issuer: v.issuer, keyId: ISSUER + '#key-1', issuedAt: v.issuedAt, format: 'SD-JWT VC, vct urn:proveml:review:1', covers: Object.keys(review.judgements).sort(), judgements: Object.keys(review.judgements).length, checks: v.checks, jwt };
if (signoffs.some((s) => s.root === root)) { console.log('this root is already signed; nothing appended'); process.exit(0); }
signoffs.push(entry);
writeFileSync(OUT, JSON.stringify(signoffs, null, 1) + '\n');
console.log(`signed root ${root.slice(0, 12)}… by ${v.issuer} at ${v.issuedAt}; covers ${entry.judgements} judgements; verified against the DID document: ${JSON.stringify(v.checks)}; ${signoffs.length} sign-off(s) on file`);
