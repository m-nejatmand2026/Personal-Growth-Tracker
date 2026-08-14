import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const progressJs = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insightsJs = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');
const progressCss = await readFile(new URL('../public/css/modules/progress.css', import.meta.url), 'utf8');
const insightsCss = await readFile(new URL('../public/css/modules/insights.css', import.meta.url), 'utf8');
const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('Progress keeps Actual Minimum Target explicit and denominator-safe in human language', () => {
  assert.match(progressJs, /Toward your targets/);
  assert.match(progressJs, /Good-enough minimums met/);
  assert.match(progressJs, /week\.minimumCount \?/);
  assert.match(progressJs, /only goals using time targets/);
  assert.match(progressJs, /Some minimums are still ahead — no catch-up needed/);
  assert.match(progressJs, /shows progress up to each target, never above 100%/);
  assert.doesNotMatch(progressJs, /Target coverage|capped at each target|Minimums reached/);
});

test('Progress minimum summary counts only Goals that actually have a minimum', () => {
  assert.match(progressJs, /Number\(item\.minimum_minutes \|\| 0\) > 0 && Number\(item\.actual_minutes \|\| 0\) >= Number\(item\.minimum_minutes \|\| 0\)/);
  assert.match(progressJs, /itemsWithMinimum = measurableItems\.filter\(\(item\) => Number\(item\.minimum_minutes \|\| 0\) > 0\)\.length/);
  assert.match(progressJs, /minimumCount: itemsWithMinimum/);
});

test('Progress history preserves mixed measurement facts in plain language', () => {
  assert.match(progressJs, /item\.minutes != null/);
  assert.match(progressJs, /item\.quantity != null/);
  assert.match(progressJs, /item\.boolean_value != null/);
  assert.match(progressJs, /Time, quantity and yes\/no progress remain separate/);
  assert.match(progressJs, /Earlier Beta history/);
  assert.match(progressJs, /Read-only history from the earlier Beta version/);
  const history = progressJs.indexOf('${historySection}${goalsSection}');
  assert.ok(history >= 0, 'factual history must render before goal guidance');
});

test('Progress does not pull Wellbeing through a legacy or undeclared history path', () => {
  assert.doesNotMatch(progressJs, /\/api\/history|wellbeing|Energy history/);
  assert.match(progressJs, /\/api\/v1\/progress/);
});

test('Insights keeps evidence thresholds sample size and association-only language without analytics jargon', () => {
  for (const threshold of ['0–6 days','7–20 days','21–41 days','42+ days']) assert.match(insightsJs, new RegExp(threshold.replace('+','\\+')));
  assert.match(insightsJs, /tracked days/);
  assert.match(insightsJs, /\$\{energy\.length\} check-ins/);
  assert.match(insightsJs, /how many observations support it/);
  assert.match(insightsJs, /associated with/);
  assert.match(insightsJs, /does not prove cause/);
  assert.doesNotMatch(insightsJs, /\bN=/);
  assert.doesNotMatch(insightsJs, /Evidence guardrail|Descriptive stage|paired wellbeing data/i);
  assert.doesNotMatch(insightsJs, /causes higher|causes lower|because of sleep/i);
});

test('Insights distinguishes unavailable evidence from an honest empty sample', () => {
  assert.match(insightsJs, /let evidenceAvailable = true/);
  assert.match(insightsJs, /evidenceAvailable = false/);
  assert.match(insightsJs, /Evidence is temporarily unavailable/);
  assert.match(insightsJs, /could not read both Progress and Wellbeing evidence/);
  assert.match(insightsJs, /so no summaries or relationships were generated/);
});

test('Progress and Insights presentation remains module-owned and responsive', () => {
  assert.match(indexHtml, /\/css\/modules\/progress\.css/);
  assert.match(indexHtml, /\/css\/modules\/insights\.css/);
  assert.match(progressCss, /@media\(max-width:520px\)/);
  assert.match(progressCss, /@media\(min-width:760px\)/);
  assert.match(insightsCss, /@media\(min-width:700px\)/);
  assert.match(progressCss, /var\(--gc-target-min\)/);
});
