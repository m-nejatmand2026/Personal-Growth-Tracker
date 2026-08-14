import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../public/css/accessibility-regression.css',import.meta.url),'utf8');
const design=await readFile(new URL('../public/css/design-system.css',import.meta.url),'utf8');
const charts=await readFile(new URL('../public/js/platform/charts.js',import.meta.url),'utf8');
const insights=await readFile(new URL('../public/js/modules/insights/ui.js',import.meta.url),'utf8');
const install=await readFile(new URL('../public/js/platform/install-app.js',import.meta.url),'utf8');

test('final accessibility stylesheet loads last so acceptance safeguards cannot be bypassed by feature CSS',()=>{
  const accessibility=index.indexOf('/css/accessibility-regression.css');
  const installCss=index.indexOf('/css/install-app.css');
  assert.ok(accessibility>installCss&&installCss>=0);
});

test('375px acceptance layer prevents horizontal shell overflow without imposing a desktop minimum width',()=>{
  assert.match(css,/@media \(max-width: 375px\)/);
  assert.match(css,/overflow-x:\s*clip/);
  assert.match(css,/min-inline-size:\s*0/);
  assert.match(css,/max-inline-size:\s*100%/);
  assert.match(css,/100dvh/);
  assert.doesNotMatch(css,/min-(?:inline-)?size:\s*(?:4\d\d|[5-9]\d\d|\d{4,})px/);
});

test('motion focus and modal safeguards remain global platform concerns',()=>{
  assert.match(design,/prefers-reduced-motion:\s*reduce/);
  assert.match(design,/:focus-visible/);
  assert.match(css,/body\.gc-modal-open/);
  assert.match(css,/prefers-reduced-motion:\s*reduce/);
});

test('threshold graphics expose equivalent Actual Minimum Target text',()=>{
  assert.match(charts,/accessibleSummary/);
  assert.match(charts,/Actual \$\{actualText\}; Minimum \$\{minimumText\}; Target \$\{targetText\}/);
  assert.match(charts,/role="group"/);
  assert.match(charts,/gc-sr-only/);
  assert.match(charts,/aria-hidden="true"/);
});

test('Insights exposes visual readiness and current evidence stage semantically',()=>{
  assert.match(insights,/insight-readiness-ring" role="img"/);
  assert.match(insights,/aria-current="step"/);
  assert.match(insights,/Current tracked days:/);
  assert.match(insights,/N=\$\{energy\.length\}/);
});

test('iPhone installation instructions use the shared modal accessibility controller',()=>{
  assert.match(install,/activateModal/);
  assert.match(install,/role="dialog" aria-modal="true" aria-labelledby="installAppTitle"/);
  assert.match(install,/Add to Home Screen/);
  assert.doesNotMatch(install,/beforeinstallprompt|\.prompt\(\)/);
});
