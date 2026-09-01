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
import { fileURLToPath } from 'url';
import { awaitReview } from 'proveml/review-flow';
import { inputs } from './build-sources-page.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const signedBy = args.find((_, i) => args[i - 1] === '--signed-by') || 'Shane Deconinck';

const { review, summary, url } = await awaitReview({
    ...inputs,
    signedBy,
    port: 3960,
    assets: { '/references/raw/': join(here, '../references/raw') },
    onServe: (u) => console.log(`sign-off page: ${u}`),
});
writeFileSync(join(here, '../review.json'), JSON.stringify(review, null, 1) + '\n');
console.log(`signed: ${summary.judged}/${summary.total} judged, ${summary.flagged} flagged, ${summary.orphaned.length} orphaned — written to audit/review.json (served at ${url})`);
process.exit(summary.flagged > 0 || summary.judged < summary.total ? 1 : 0);
