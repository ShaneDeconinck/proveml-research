#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createRenderer } from 'proveml/renderer';

const outDir = join(process.cwd(), 'paper', 'panels');
mkdirSync(outDir, { recursive: true });

const educationStore = {
    'class:204.name': '3MA',
    'class:204.studentCount': 22,
    'class:204.passRate': 43,
    'class:204.evalRate': 38,

    'student:1087.name': 'Emma Vos',
    'student:1087.passed': 2,
    'student:1087.evaluated': 31,
    'student:1087.passRate': 6,
    'student:1087.absent': 47,

    'student:1092.name': 'Sander De Witt',
    'student:1092.passRate': 78,
    'student:1092.evaluated': 41,
    'student:1092.diff': 72,
    'student:1092._diff': 72,
};

const healthcareStore = {
    'patient:308.name': 'Maria Jansen',
    'patient:308.glucose': 142,
    'patient:308.glucose._unit': 'mg/dL',
    'patient:308.hba1c': 7.2,
    'patient:308.systolic': 158,
    'patient:308.diastolic': 94,
    'encounter:701.name': 'Visit 2025-12-03',
    'encounter:701.systolic': 145,
    'encounter:701.diastolic': 88,
    'patient:308.diff': 13,
    'patient:308._diff': 13,
    'lab:4521.name': 'Lipid Panel 2026-03-10',
    'lab:4521.ldl': 168,
    'lab:4521.ldl._unit': 'mg/dL',
};

const sources = {
    eduVerified: `@[class:204]{3MA} has %[studentCount]{22} students with a pass rate of %[passRate]{43}%. ?[below: IS_BELOW_HALF]{This is below the passing threshold}. Only %[evalRate]{38}% of attainment levels have been evaluated -- ?[coverage: IS_LOW_COVERAGE]{coverage is low}.

@[student:1087]{Emma Vos} has passed %[passed]{2} of %[evaluated]{31} evaluated attainment levels (%[passRate]{6}%). ?[low: IS_LOW_PASS]{This is a critically low result}. With %[absent]{47} absences, ?[abs: IS_GREY_RISK]{there is a risk of grey status on multiple attainment levels}. ?[combined: @low AND @abs]{The combination of low results and high absence is notable}.

@[student:1092]{Sander De Witt} has a pass rate of %[passRate]{78}% across %[evaluated]{41} evaluated attainment levels. ?[strong: IS_STRONG]{This is a strong result}. Compared to @[student:1087]{Emma Vos}, the difference of %[diff]{72} percentage points is ?[gap: IS_MUCH_HIGHER]{dramatically higher}.`,

    eduErrors: `@[class:204]{3MA} has %[studentCount]{24} students with a pass rate of %[passRate]{43}%. ?[below: IS_BELOW_HALF]{This is below the passing threshold}.

@[student:1087]{Emma Vos} has passed %[passed]{2} of %[evaluated]{31} evaluated attainment levels (%[passRate]{16}%). ?[low: IS_LOW_PASS]{This is slightly below average}. With %[absent]{47} absences, ?[abs: IS_GREY_RISK]{there is a risk of grey status}.

%[passRate]{82}% pass rate is strong. @[student:9999]{Thomas Berg} has %[absent]{12} absences.`,

    healthVerified: `@[patient:308]{Maria Jansen} presented with a fasting glucose level of %[glucose]{142 mg/dL}. ?[glu: IS_ELEVATED_GLUCOSE]{This exceeds the diagnostic threshold for diabetes}. HbA1c was measured at %[hba1c]{7.2}, above target.

Blood pressure was @[patient:308]{Maria Jansen}'s %[systolic]{158}/%[diastolic]{94} mmHg. Compared to @[encounter:701]{Visit 2025-12-03} (%[systolic]{145}/%[diastolic]{88}), the systolic increase of @[patient:308]{Maria Jansen}'s %[diff]{13} points is ?[rise: IS_MUCH_HIGHER]{substantial}.

@[lab:4521]{Lipid Panel 2026-03-10}: LDL cholesterol was %[ldl]{168 mg/dL}.`,

    healthErrors: `@[patient:308]{Maria Jansen} presented with a fasting glucose level of %[glucose]{118 mg/dL}. ?[glu: IS_ELEVATED_GLUCOSE]{This is within the normal range}.

Blood pressure was @[patient:308]{Maria Jansen}'s %[systolic]{158}/%[diastolic]{84} mmHg.`
};

const panelCss = `
:root {
  --teal: #1a7a6d;
  --violet: #6b4c9a;
  --red: #c0392b;
  --amber: #b8860b;
  --blue: #2f6fb3;
  --gray-200: #ddd8d1;
  --gray-400: #9a938b;
  --gray-600: #5c5751;
  --gray-800: #2b2825;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 22px 28px;
  background: #fff;
  color: var(--gray-800);
  font-family: "Charter", "Georgia", serif;
}
.figure {
  max-width: 1180px;
}
.label {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: 14px;
}
.narrative {
  font-size: 18px;
  line-height: 1.9;
}
.narrative p { margin: 0 0 12px 0; }
.meta {
  margin-top: 16px;
  padding-top: 10px;
  border-top: 1px solid var(--gray-200);
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 12px;
  color: var(--gray-600);
}
.meta strong { color: var(--gray-800); }
.source {
  white-space: pre-wrap;
  font-family: Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.75;
  color: var(--gray-800);
}
.source .s-entity { color: var(--teal); font-weight: 600; }
.source .s-fact { color: var(--blue); }
.source .s-inference { color: var(--violet); }

.proveml-entity {
  color: var(--entity-color, var(--teal));
  font-weight: 600;
  border-bottom: 1.6px solid var(--entity-color, var(--teal));
  text-decoration: none;
}
.proveml-entity.proveml-name-mismatch,
.proveml-entity.proveml-unverifiable {
  color: var(--red);
  border-bottom-color: var(--red);
}

.proveml-fact {
  font-weight: 600;
}
.proveml-fact.proveml-verified {
  border-bottom: 2px dotted var(--entity-color, var(--teal));
}
.proveml-fact.proveml-mismatch {
  color: var(--red);
  border-bottom: 2px dotted var(--red);
}
.proveml-fact.proveml-unverifiable,
.proveml-fact.proveml-no-context {
  color: var(--amber);
  border-bottom: 2px dotted var(--amber);
}

.proveml-inference.proveml-verified {
  border-bottom: 2px dashed var(--violet);
}
.proveml-inference.proveml-failed {
  color: var(--red);
  border-bottom: 2px dashed var(--red);
}

.proveml-proof {
  margin-left: 4px;
  color: var(--gray-400);
  font-family: Menlo, Consolas, monospace;
  font-size: 0.75em;
  font-weight: 400;
  white-space: nowrap;
}
`;

const educationRenderer = createRenderer(educationStore);
const healthcareRenderer = createRenderer(healthcareStore);

function count(html, pattern) {
    const matches = html.match(pattern);
    return matches ? matches.length : 0;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightSource(source) {
    return escapeHtml(source)
        .replace(/(@\[[^\]]+\]\{[^}]+\})/g, '<span class="s-entity">$1</span>')
        .replace(/(%\[[^\]]+\]\{[^}]+\})/g, '<span class="s-fact">$1</span>')
        .replace(/(\?\[[^\]]+\](?:\{[^}]+\})?)/g, '<span class="s-inference">$1</span>');
}

function footer(html, verification) {
    const entities = count(html, /class="proveml-entity/g);
    const facts = count(html, /class="proveml-fact/g);
    const inferences = count(html, /class="proveml-inference/g);
    const mismatches = count(html, /proveml-mismatch/g) + count(html, /proveml-failed/g);
    return `${verification.verified}/${verification.total} claims verified · ${entities} entities · ${facts} facts · ${inferences} inferences${mismatches ? ` · ${mismatches} issues` : ''}`;
}

function page({ title, bodyClass = '', content, meta = '' }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${panelCss}</style>
</head>
<body class="${bodyClass}">
  <main class="figure">
    <div class="label">${title}</div>
    ${content}
    ${meta ? `<div class="meta">${meta}</div>` : ''}
  </main>
</body>
</html>`;
}

function writePanel(name, html) {
    writeFileSync(join(outDir, name), html, 'utf8');
    console.log(`Wrote paper/panels/${name}`);
}

const eduVerified = educationRenderer.render(sources.eduVerified);
const eduErrors = educationRenderer.render(sources.eduErrors);
const eduAudit = educationRenderer.render(sources.eduVerified, { showProofPaths: true });
const healthVerified = healthcareRenderer.render(sources.healthVerified);
const healthErrors = healthcareRenderer.render(sources.healthErrors);

writePanel(
    'edu-verify.html',
    page({
        title: 'Verify mode: education example',
        content: `<div class="narrative">${eduVerified.html}</div>`,
        meta: footer(eduVerified.html, eduVerified.verification)
    })
);

writePanel(
    'edu-errors.html',
    page({
        title: 'Verify mode: detected errors',
        content: `<div class="narrative">${eduErrors.html}</div>`,
        meta: footer(eduErrors.html, eduErrors.verification)
    })
);

writePanel(
    'edu-audit.html',
    page({
        title: 'Audit mode: education example',
        bodyClass: 'audit',
        content: `<div class="narrative">${eduAudit.html}</div>`,
        meta: footer(eduAudit.html, eduAudit.verification)
    })
);

writePanel(
    'edu-source.html',
    page({
        title: 'ProveML source markup',
        content: `<pre class="source">${highlightSource(sources.eduVerified)}</pre>`
    })
);

writePanel(
    'health-verify.html',
    page({
        title: 'Verify mode: healthcare example',
        content: `<div class="narrative">${healthVerified.html}</div>`,
        meta: footer(healthVerified.html, healthVerified.verification)
    })
);

writePanel(
    'health-errors.html',
    page({
        title: 'Verify mode: healthcare errors',
        content: `<div class="narrative">${healthErrors.html}</div>`,
        meta: footer(healthErrors.html, healthErrors.verification)
    })
);

writePanel(
    'index.html',
    page({
        title: 'ProveML paper panels',
        content: `<div class="narrative">
          <p><a href="./edu-verify.html">Education verify</a></p>
          <p><a href="./edu-errors.html">Education errors</a></p>
          <p><a href="./edu-audit.html">Education audit</a></p>
          <p><a href="./edu-source.html">Education source</a></p>
          <p><a href="./health-verify.html">Healthcare verify</a></p>
          <p><a href="./health-errors.html">Healthcare errors</a></p>
        </div>`
    })
);
