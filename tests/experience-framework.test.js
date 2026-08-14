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

test('shared experience framework loads after business module styles and before final accessibility safeguards', () => {
  const frameworkIndex = indexHtml.indexOf('/css/experience-framework.css');
  assert.ok(frameworkIndex > indexHtml.indexOf('/css/journal.css'));
  assert.ok(frameworkIndex > indexHtml.indexOf('/css/modules/wellness-boost.css'));
  assert.ok(frameworkIndex < indexHtml.indexOf('/css/accessibility-regression.css'));
});

test('framework owns reusable calm page, feature, choice, stat and tone primitives', () => {
  for (const selector of [
    '.gc-page-frame{',
    '.gc-page-header{',
    '.gc-stat-grid{',
    '.gc-feature-card{',
    '.gc-choice-list{',
    '.gc-choice-row{',
    '.gc-tone--reset{',
    '.gc-tone--calm{',
    '.gc-tone--focus{',
    '.gc-tone--restore{'
  ]) assert.match(framework, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(framework, /--gc-reading-max:60rem/);
  assert.match(framework, /--gc-copy-max:56ch/);
});

test('major first-class views share the same calm header contract', () => {
  assert.match(today, /today-command gc-page-header gc-page-header--action/);
  assert.match(plan, /plan-overview gc-page-header gc-page-header--with-stats/);
  assert.match(progress, /progress-dashboard gc-page-header gc-page-header--with-stats/);
  assert.match(insights, /insights-hero gc-page-header gc-page-header--aside/);
  assert.match(framework, /\.journal-hero\{display:grid/);
  assert.match(journal, /class="journal-hero"/);
});

test('major page introductions use short human-facing copy rather than dashboard explanations', () => {
  assert.match(today, /Choose what fits today/);
  assert.match(today, /Log what actually happens\./);
  assert.match(plan, /Plan around the life you have/);
  assert.match(plan, /Set direction, then fit it to your time\./);
  assert.match(progress, /Your history first\. Targets are guidance, not debt\./);
  assert.match(insights, /Patterns, when the evidence is ready/);
  assert.doesNotMatch(today, /Your daily command center/);
  assert.doesNotMatch(plan, /Make ambition fit the life you actually have/);
  assert.doesNotMatch(insights, /See patterns only when there is enough evidence/);
});

test('shared framework reduces mobile header density without shrinking touch targets', () => {
  assert.match(framework, /@media\(max-width:760px\)/);
  assert.match(framework, /\.topbar-title h1\{font-size:clamp\(1\.55rem,7vw,1\.9rem\)/);
  assert.match(framework, /\.gc-choice-row\{min-height:68px/);
  assert.match(framework, /\.gc-feature-card__visual\{width:64px;height:64px/);
  assert.doesNotMatch(framework, /min-height:\s*(?:3[0-9]|4[0-3])px/);
});
