#!/usr/bin/env node
/**
 * The paper's rendered figures, in the house style of abovebeyond.ai/proveml.
 *
 * Three panels, each rendered by the real proveml renderer (0.4.0) against a
 * small SEC-shaped store, then screenshotted with headless Chrome at 2x:
 *
 *   fig-verify-errors.png   what the reader sees when claims fail
 *   fig-audit-mode.png      the same mechanism with proof paths visible
 *   fig-display.png         the claim is exact, the reader sees $391.0 billion
 *
 * Usage: node paper/generate-figures.mjs [--html-only]
 * Tokens (colors, fonts, mark styles) are copied from the site's stylesheet so
 * the paper and the site show the same thing.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { renderProveml } from 'proveml/render';
import { thresholds } from 'proveml/thresholds';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'panels');
mkdirSync(out, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const store = {
    'company:aapl.name': 'Apple Inc.',
    'company:aapl.revenue': 391035000000, 'company:aapl.revenue._unit': 'USD', 'company:aapl.revenue._display': 'currency:USD:1',
    'company:aapl.netIncome': 93736000000, 'company:aapl.netIncome._unit': 'USD', 'company:aapl.netIncome._display': 'currency:USD:1',
    'company:aapl.eps': 6.08, 'company:aapl.eps._unit': 'USD/shares',
    'company:msft.name': 'Microsoft Corporation',
    'company:msft.revenue': 245122000000, 'company:msft.revenue._unit': 'USD', 'company:msft.revenue._display': 'currency:USD:1',
    'company:msft.assets': 512163000000, 'company:msft.assets._unit': 'USD', 'company:msft.assets._display': 'currency:USD:1',
    'company:msft.debtToEquity': 0.16,
    'account:901.name': 'Acme Corp',
    'account:901.balance': 12400, 'account:901.balance._unit': 'EUR', 'account:901.balance._display': 'currency:EUR:0',
};
const registry = { ...thresholds };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Spline+Sans+Mono:wght@400;500&display=swap');
:root { --ink:#0e2433; --muted:#47616f; --haze-line:rgba(14,36,51,.18); --card:#fafcfd; --tint:#dfe8eb;
  --mark-ok:#126b3a; --mark-ok-lijn:rgba(18,107,58,.5); --mark-inf:#0e5730; --mark-inf-vlak:rgba(18,107,58,.14);
  --mark-bad:#a8352a; --mark-bad-lijn:rgba(168,53,42,.7); --mark-unk:#a35a06; --accent:#1a4fb4; }
* { box-sizing:border-box; }
body { margin:0; background:#fff; color:var(--ink); font-family:Lato, system-ui, sans-serif; }
.page { width:1180px; padding:34px 40px 30px; }
figcaption { font-family:"Spline Sans Mono", ui-monospace, monospace; font-size:15px; letter-spacing:.04em; color:var(--muted); margin:0 0 14px; }
.out { font-size:29px; line-height:1.95; max-width:1100px; }
.out p { margin:0 0 14px; }
.verdict { margin-top:18px; padding-top:12px; border-top:1px solid var(--haze-line); font-family:"Spline Sans Mono", ui-monospace, monospace; font-size:16px; color:var(--muted); }
.verdict b { color:var(--mark-bad); font-weight:500; } .verdict b.ok { color:var(--mark-ok); }
.proveml-entity.proveml-verified { color:var(--mark-ok); border:1px solid var(--mark-ok-lijn); border-radius:2px; padding:.05em .35em; }
.proveml-fact.proveml-verified { color:var(--mark-ok); border-bottom:1.5px dotted var(--mark-ok); }
.proveml-mismatch, .proveml-name-mismatch, .proveml-inference.proveml-failed { color:var(--mark-bad); text-decoration:line-through; text-decoration-thickness:1.5px; text-decoration-color:var(--mark-bad-lijn); }
.proveml-inference.proveml-verified { color:var(--mark-inf); background:var(--mark-inf-vlak); border-radius:2px; padding:.08em .25em; box-decoration-break:clone; -webkit-box-decoration-break:clone; }
.proveml-unverifiable, .proveml-no-context, .proveml-entity:not(.proveml-verified) { color:var(--mark-unk); border-bottom:1.5px dashed var(--mark-unk); }
.proveml-proof { font-family:"Spline Sans Mono", ui-monospace, monospace; font-size:.5em; color:var(--muted); margin-left:.35em; white-space:nowrap; vertical-align:.15em; }
/* the display figure */
.rows { display:grid; grid-template-columns:200px 1fr; row-gap:22px; column-gap:22px; align-items:start; }
.rows .k { font-family:"Spline Sans Mono", ui-monospace, monospace; font-size:15px; letter-spacing:.05em; text-transform:uppercase; color:var(--muted); padding-top:10px; }
.src { margin:0; font-family:"Spline Sans Mono", ui-monospace, monospace; font-size:21px; line-height:1.7; background:var(--card); border:1px solid var(--haze-line); border-radius:4px; padding:12px 16px; white-space:pre-wrap; }
.src i { font-style:normal; color:var(--accent); }
.audit { font-family:"Spline Sans Mono", ui-monospace, monospace; font-size:17px; color:var(--muted); line-height:1.7; }
`;

function page(caption, body, verdict) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="page"><figure style="margin:0"><figcaption>${caption}</figcaption>${body}${verdict ? `<div class="verdict">${verdict}</div>` : ''}</figure></div></body></html>`;
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const shot = (name, height) => {
    const html = join(out, `${name}.html`), png = join(here, `fig-${name}.png`);
    execFileSync(CHROME, ['--headless=new', '--hide-scrollbars', '--force-device-scale-factor=2', `--window-size=1180,${height}`, '--virtual-time-budget=6000', `--screenshot=${png}`, `file://${html}`], { stdio: 'ignore' });
    return png;
};

// 1. verify mode with failures
const errorsMd = `@[company:aapl]{Apple Inc.} reported revenue of %[revenue]{420000000000 USD} with net income of %[netIncome]{93736000000 USD}.

@[company:goog]{Alphabet Inc.} reported assets of %[assets]{450256000000 USD}.

@[account:901]{Acme Corp} has %[balance]{12400 EUR}. ?[neg: IS_NEGATIVE_BALANCE]{The balance is critically low}.`;
const errors = renderProveml(errorsMd, store, { thresholds: registry });
writeFileSync(join(out, 'verify-errors.html'), page('verify mode · what the reader sees', `<div class="out">${errors.html}</div>`,
    `<b>${errors.verification.verified}</b> of ${errors.verification.total} claims verified · a wrong figure is struck through, an unknown record and a judgement that does not hold are marked, every verified amount is shown by the store's display rule`));

// 2. audit mode
const auditMd = `@[company:aapl]{Apple Inc.} reported revenue of %[revenue]{391035000000 USD} with net income of %[netIncome]{93736000000 USD} and earnings per share of %[eps]{6.08 USD/shares}.

@[company:msft]{Microsoft Corporation} reported revenue of %[revenue]{245122000000 USD} with total assets of %[assets]{512163000000 USD} and a debt-to-equity ratio of %[debtToEquity]{0.16}.`;
const audit = renderProveml(auditMd, store, { thresholds: registry, showProofPaths: true });
writeFileSync(join(out, 'audit-mode.html'), page('audit mode · the path behind every claim', `<div class="out">${audit.html.replace(/<span class="proveml-proof">\[trust:[^<]*<\/span>/g, '')}</div>`,
    `<b class="ok">${audit.verification.verified}</b> of ${audit.verification.total} claims verified · each claim carries the fact-store path it was checked against`));

// 2b. verify mode, mostly correct (technical report): two planted errors in ten claims
const correctMd = `@[company:aapl]{Apple Inc.} reported revenue of %[revenue]{391035000000 USD} with net income of %[netIncome]{93736000000 USD} and earnings per share of %[eps]{6.08 USD/shares}.

@[company:msft]{Microsoft Corporation} reported revenue of %[revenue]{245122000000 USD} with total assets of %[assets]{512163000000 USD}. Its long-term debt of %[longTermDebt]{42688000000 USD} yields a debt-to-equity ratio of %[debtToEquity]{1.23}.`;
const correct = renderProveml(correctMd, store, { thresholds: registry });
writeFileSync(join(out, 'verify-correct.html'), page('verify mode · two planted errors', `<div class="out">${correct.html}</div>`,
    `<b class="ok">${correct.verification.verified}</b> of ${correct.verification.total} claims verified · a field the store does not hold is marked as unverifiable, a wrong ratio is struck through`));

// 3. display: exact claim, readable rendering
const displayMd = `@[company:aapl]{Apple Inc.} reported revenue of %[revenue]{391035000000 USD}.`;
const display = renderProveml(displayMd, store, { thresholds: registry });
const shown = display.verification.details[1].display;
writeFileSync(join(out, 'display.html'), page('one claim, three views',
    `<div class="rows">
      <div class="k">the model writes</div><pre class="src">${esc(displayMd).replace('391035000000 USD', '<i>391035000000 USD</i>')}</pre>
      <div class="k">the store declares</div><pre class="src">company:aapl.revenue          = 391035000000\ncompany:aapl.revenue._unit    = "USD"\ncompany:aapl.revenue._display = <i>"currency:USD:1"</i></pre>
      <div class="k">the reader sees</div><div class="out" style="padding-top:2px">${display.html}</div>
      <div class="k">the audit shows</div><div class="audit">company:aapl.revenue = 391035000000 USD &nbsp;(shown as ${esc(shown)}) &nbsp;·&nbsp; verified by exact equality</div>
    </div>`, ''));

if (!process.argv.includes('--html-only')) {
    for (const [name, h] of [['verify-errors', 400], ['verify-correct', 400], ['audit-mode', 500], ['display', 500]]) console.log('wrote', shot(name, h));
}
