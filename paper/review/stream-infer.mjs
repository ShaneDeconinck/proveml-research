// Injects the self-checking inference pass into an armed review page.
// Usage: node stream-infer.mjs report/review-page-artifact.html
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2];
let html = readFileSync(target, 'utf8');
const client = readFileSync(join(here, 'infer-client.js'), 'utf8');
if (client.includes('</script>')) throw new Error('client must not contain </script>');
const css = `<style>
.pair[data-scan=checking] .col:first-child{opacity:1;color:inherit;border-left-color:var(--accent)!important;animation:rv-pulse 1.1s ease-in-out infinite}
@keyframes rv-pulse{50%{border-left-color:transparent!important}}
#rv-scan-status{white-space:nowrap}
</style>`;
const inject = css + '\n<script>' + client + '</script>';
const at = html.lastIndexOf('</body>');
if (at < 0) throw new Error('no </body> in target');
html = html.slice(0, at) + inject + '\n' + html.slice(at);
writeFileSync(target, html);
console.log('inference pass injected into', target);
