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

test('framework owns reusable calm page, feature, choice, stat and tone primitives', () => {
  for (const selector of ['.gc-page-frame{','.gc-page-header{','.gc-stat-grid{','.gc-feature-card{','.gc-choice-list{','.gc-choice-row{','.gc-tone--reset{','.gc-tone--calm{','.gc-tone--focus{','.gc-tone--restore{']) {
    assert.match(framework, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(framework, /--gc-reading-max:60rem/);
  assert.match(framework, /--gc-copy-max:56ch/);
});

test('major first-class Current views each expose a semantic destination header', () => {
  assert.match(today, /<h2 id="todaySanctuaryTitle">Today<\/h2>/);
  assert.match(plan, /<h2 id="planCurrentTitle">Plan<\/h2>/);
  assert.match(progress, /<h2 id="progressCurrentTitle">Progress<\/h2>/);
  assert.match(insights, /<h2 id="insightsCurrentTitle">Insights<\/h2>/);
  assert.match(journal, /<h2 id="journalCurrentTitle">Journal<\/h2>/);
  assert.match(wellness, /<h2 id="wellnessCurrentTitle">Wellness<\/h2>/);
});

test('first-class introductions remain concise and non-duplicative', () => {
  assert.match(today, /<h2 id="todaySanctuaryTitle">Today<\/h2><strong class="today-greeting">Good morning\.<\/strong>/);
  assert.match(today, /\$\{dailyPlanPanel\}/);
  assert.match(plan, /Set direction, then fit it to the week ahead\./);
  assert.match(progress, /What actually happened\. Targets and minimums are guidance, not debt\./);
  assert.match(insights, /Patterns only when the evidence is strong enough\. Association never proves cause\./);
  assert.match(journal, /Write when there is something you want to remember\./);
  assert.match(wellness, /A quieter space to reset, focus, or restore\./);
  assert.doesNotMatch(today, /Your daily command center/);
  assert.doesNotMatch(plan, /Make ambition fit the life you actually have/);
});

test('shared framework reduces mobile header density without shrinking touch targets', () => {
  assert.match(framework, /@media\(max-width:760px\)/);
  assert.match(framework, /\.topbar-title h1\{font-size:clamp\(1\.55rem,7vw,1\.9rem\)/);
  assert.match(framework, /\.gc-choice-row\{min-height:68px/);
  assert.match(framework, /\.gc-feature-card__visual\{width:64px;height:64px/);
  assert.doesNotMatch(framework, /min-height:\s*(?:3[0-9]|4[0-3])px/);
});
