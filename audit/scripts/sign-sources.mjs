#!/usr/bin/env node
/**
 * The sign-off gate for the citation audit: serves the review page, opens the
 * browser, and blocks until "sign review" is pressed. The signed review lands
 * in audit/review.json, committed next to the store as the human sign-off.
 * Exit 0 only when every reading is judged and none flagged.
 *
 * Usage: node audit/scripts/sign-sources.mjs [--signed-by "Name"]
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { awaitReview } from 'proveml/review-flow';
import { isEnrolled, passkeyPageScript, passkeySigner } from '/Volumes/shanedeconinck.be/Projects/proveml-all/proveml-demos/adapters/passkey.mjs';
import { inputs } from './build-sources-page.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const signedBy = args.find((_, i) => args[i - 1] === '--signed-by') || 'Shane Deconinck';

// With a passkey enrolled, the sign is the person: the browser half rides
// the assertion along, the signer refuses a review without one, and the
// gate must be addressed as localhost (WebAuthn rejects IP origins).
const passkey = isEnrolled();
const { review, summary, url } = await awaitReview({
    ...inputs,
    signedBy,
    port: 3960,
    assets: { '/references/raw/': join(here, '../references/raw') },
    ...(passkey ? {
        pageScript: passkeyPageScript(),
        signer: passkeySigner({ expectedOrigin: 'http://localhost:3960' }),
        open: false,
    } : {}),
    onServe: () => {
        console.log(`sign-off page: http://localhost:3960/${passkey ? ' (passkey signing armed)' : ''}`);
        if (passkey) import('child_process').then(({ exec }) => exec('open http://localhost:3960/', () => {}));
    },
});
// An accepted signature must never be lost to a write failure: if the
// primary write fails (the volume dropped once, mid-sign), the review lands
// in the fallback and the exit says where.
const out = JSON.stringify(review, null, 1) + '\n';
let dest = join(here, '../review.json');
try {
    writeFileSync(dest, out);
} catch (error) {
    dest = join(tmpdir(), `proveml-review-${Date.now()}.json`);
    writeFileSync(dest, out);
    console.error(`primary write failed (${error.code}); review saved to ${dest}`);
}
console.log(`signed: ${summary.judged}/${summary.total} judged, ${summary.flagged} flagged, ${summary.orphaned.length} orphaned — written to ${dest} (served at ${url})`);
process.exit(summary.flagged > 0 || summary.judged < summary.total ? 1 : 0);
