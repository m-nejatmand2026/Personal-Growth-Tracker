import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const progressJs = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insightsJs = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');
const pagesCss = await readFile(new URL('../public/css/product-rebuild-pages.css', import.meta.url), 'utf8');
const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('Progress keeps factual actuals separate from optional minimum and target guidance', () => {
  assert.match(progressJs, /Actual time/);
  assert.match(progressJs, /Good-enough minimums met/);
  assert.match(progressJs, /week\.minimumCount \?/);
  assert.match(progressJs, /Plans never appear here until you explicitly record them as done/);
  assert.match(progressJs, /Minimum/);
  assert.match(progressJs, /Target/);
  assert.match(progressJs, /Actual vs optional guidance/);
});

test('Progress minimum summary counts only goals that actually have a minimum', () => {
  assert.match(progressJs, /Number\(item\.minimum_minutes \|\| 0\) > 0 && Number\(item\.actual_minutes \|\| 0\) >= Number\(item\.minimum_minutes \|\| 0\)/);
  assert.match(progressJs, /itemsWithMinimum = measurableItems\.filter\(\(item\) => Number\(item\.minimum_minutes \|\| 0\) > 0\)\.length/);
  assert.match(progressJs, /minimumCount: itemsWithMinimum/);
});

test('Progress history preserves mixed measurement facts and legacy read-only records', () => {
  assert.match(progressJs, /item\.minutes != null/);
  assert.match(progressJs, /item\.quantity != null/);
  assert.match(progressJs, /item\.boolean_value != null/);
  assert.match(progressJs, /return 'Time'/);
  assert.match(progressJs, /return 'Quantity'/);
  assert.match(progressJs, /return 'Yes \/ No'/);
  assert.match(progressJs, /Earlier Beta/);
  assert.match(progressJs, /record_kind === 'progress'/);
  assert.match(progressJs, /Evidence only here\. Interpretation belongs in Insights\./);
});

test('Progress does not pull Wellbeing through a legacy or undeclared history path', () => {
  assert.doesNotMatch(progressJs, /\/api\/history|wellbeing|Energy history/);
  assert.match(progressJs, /\/api\/v1\/progress/);
});

test('Insights exposes evidence readiness and association-only language without claiming causation', () => {
  for (const threshold of ['0–6', '7–20', '21–41', '42+']) assert.match(insightsJs, new RegExp(threshold.replace('+','\\+')));
  assert.match(insightsJs, /tracked \$\{trackedDays === 1 \? 'day' : 'days'\}/);
  assert.match(insightsJs, /energy check-ins/);
  assert.match(insightsJs, /activityDays/);
  assert.match(insightsJs, /No defensible matched pattern yet/);
  assert.match(insightsJs, /does not prove cause/);
  assert.doesNotMatch(insightsJs, /causes higher|causes lower|because of sleep/i);
});

test('Insights distinguishes unavailable evidence from an honest empty sample', () => {
  const unavailableStart = insightsJs.indexOf('function unavailableHtml()');
  const renderStart = insightsJs.indexOf('export async function renderInsights()');
  assert.ok(unavailableStart >= 0 && renderStart > unavailableStart);
  const unavailableBlock = insightsJs.slice(unavailableStart, renderStart);
  assert.match(unavailableBlock, /Evidence is unavailable/);
  assert.match(unavailableBlock, /No summaries were generated\. Try again later\./);
  const catchReturn = insightsJs.indexOf('root.innerHTML = unavailableHtml();');
  const trackedDays = insightsJs.indexOf('const trackedDays');
  assert.ok(catchReturn >= 0 && catchReturn < trackedDays, 'failure state must return before evidence-count rendering');
});

test('Progress and Insights Product Rebuild presentation remains responsive and touch-safe', () => {
  assert.match(indexHtml, /\/css\/product-rebuild-pages\.css/);
  assert.doesNotMatch(indexHtml, /\/css\/figma-current(?:-live|-semantics)?\.css/);
  assert.match(pagesCss, /\.gc-progress-stats\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(pagesCss, /\.gc-insight-facts\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(pagesCss, /\.gc-progress-fact>button\{min-width:44px;min-height:44px/);
  assert.match(pagesCss, /@media\(max-width:760px\)/);
});
