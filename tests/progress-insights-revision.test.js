import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const progressJs = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insightsJs = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');
const progressCss = await readFile(new URL('../public/css/modules/progress.css', import.meta.url), 'utf8');
const insightsCss = await readFile(new URL('../public/css/modules/insights.css', import.meta.url), 'utf8');
const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('Progress keeps Actual Minimum Target explicit and denominator-safe', () => {
  assert.match(progressJs, /Target coverage/);
  assert.match(progressJs, /Minimums reached/);
  assert.match(progressJs, /week\.measurableCount \?/);
  assert.match(progressJs, /time-allocation goals only/);
  assert.match(progressJs, /Below minimum — no catch-up required/);
});

test('Progress history preserves mixed measurement facts', () => {
  assert.match(progressJs, /item\.minutes != null/);
  assert.match(progressJs, /item\.quantity != null/);
  assert.match(progressJs, /item\.boolean_value != null/);
  assert.match(progressJs, /Time, quantity and yes\/no facts stay distinct/);
});

test('Progress does not pull Wellbeing through a legacy or undeclared history path', () => {
  assert.doesNotMatch(progressJs, /\/api\/history|wellbeing|Energy history/);
  assert.match(progressJs, /\/api\/v1\/progress/);
});

test('Insights keeps evidence thresholds sample size and association-only language', () => {
  for (const threshold of ['0–6','7–20','21–41','42+']) assert.match(insightsJs, new RegExp(threshold.replace('+','\\+')));
  assert.match(insightsJs, /tracked days/);
  assert.match(insightsJs, /N=\$\{energy\.length\}/);
  assert.match(insightsJs, /associated with/);
  assert.match(insightsJs, /never causation/);
  assert.doesNotMatch(insightsJs, /causes higher|causes lower|because of sleep/i);
});

test('Progress and Insights presentation remains module-owned and responsive', () => {
  assert.match(indexHtml, /\/css\/modules\/progress\.css/);
  assert.match(indexHtml, /\/css\/modules\/insights\.css/);
  assert.match(progressCss, /@media\(max-width:520px\)/);
  assert.match(progressCss, /@media\(min-width:760px\)/);
  assert.match(insightsCss, /@media\(min-width:700px\)/);
  assert.match(progressCss, /var\(--gc-target-min\)/);
});
