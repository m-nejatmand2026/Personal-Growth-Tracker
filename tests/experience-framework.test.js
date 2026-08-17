import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const framework = await readFile(new URL('../public/css/experience-framework.css', import.meta.url), 'utf8');
const today = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const plan = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const progress = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insights = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');
const journal = await readFile(new URL('../public/js/modules/journal/module.js', import.meta.url), 'utf8');
const wellness = await readFile(new URL('../public/js/modules/wellness-boost/module.js', import.meta.url), 'utf8');

test('shared experience framework remains between module styles and final accessibility safeguards', () => {
  const frameworkIndex = indexHtml.indexOf('/css/experience-framework.css');
  assert.ok(frameworkIndex > indexHtml.indexOf('/css/journal.css'));
  assert.ok(frameworkIndex > indexHtml.indexOf('/css/modules/wellness-boost.css'));
  assert.ok(frameworkIndex < indexHtml.indexOf('/css/accessibility-regression.css'));
});

test('framework retains reusable calm page and choice primitives', () => {
  for (const selector of ['.gc-page-frame{','.gc-page-header{','.gc-stat-grid{','.gc-feature-card{','.gc-choice-list{','.gc-choice-row{','.gc-tone--calm{']) assert.match(framework, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(framework, /--gc-reading-max:60rem/);
});

test('major first-class views each expose a semantic destination heading', () => {
  assert.match(today, /<h2[^>]*>Today<\/h2>/);
  assert.match(plan, /<h2 id="planCurrentTitle">Plan<\/h2>/);
  assert.match(progress, /<h2 id="progressCurrentTitle">Progress<\/h2>/);
  assert.match(insights, /<h2 id="insightsCurrentTitle">Insights<\/h2>/);
  assert.match(journal, /<h2 id="journalCurrentTitle">Journal<\/h2>/);
  assert.match(wellness, /<h2 id="wellnessCurrentTitle">Wellness<\/h2>/);
});

test('first-class introductions describe their actual product jobs concisely', () => {
  assert.match(today, /One clear step at a time\./);
  assert.match(today, /\$\{dailyPlanPanel\}/);
  assert.match(plan, /Choose what deserves attention, then fit it to the time you actually have\./);
  assert.match(progress, /What actually happened\. Plans never appear here until you explicitly record them as done\./);
  assert.match(insights, /What the evidence may support\. Association is never presented as cause\./);
  assert.match(journal, /A private place to think, remember and notice what matters\./);
  assert.match(wellness, /A quieter space to reset, focus, or restore\./);
});

test('shared framework keeps mobile choices touch-sized', () => {
  assert.match(framework, /@media\(max-width:760px\)/);
  assert.match(framework, /\.gc-choice-row\{min-height:68px/);
  assert.doesNotMatch(framework, /min-height:\s*(?:3[0-9]|4[0-3])px/);
});
