import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const today = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const plan = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const progress = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insights = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');
const journal = await readFile(new URL('../public/js/modules/journal/module.js', import.meta.url), 'utf8');
const liveCss = await readFile(new URL('../public/css/figma-current-live.css', import.meta.url), 'utf8');
const currentCss = await readFile(new URL('../public/css/figma-current.css', import.meta.url), 'utf8');
const accessibilityCss = await readFile(new URL('../public/css/accessibility-regression.css', import.meta.url), 'utf8');

test('Figma Current presentation layers load after prior experience foundations and before final accessibility safeguards', () => {
  const framework = indexHtml.indexOf('/css/experience-framework.css');
  const current = indexHtml.indexOf('/css/figma-current.css');
  const live = indexHtml.indexOf('/css/figma-current-live.css');
  const semantics = indexHtml.indexOf('/css/figma-current-semantics.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(framework >= 0 && framework < current && current < live && live < semantics && semantics < accessibility);
});

test('Today keeps live overview and agenda first without moving business logic into composition', () => {
  assert.match(today, /today-current-overview/);
  assert.match(today, /\$\{currentOverview\(directionModel, capacityModel\)\}[\s\S]*\$\{dailyPlanPanel\}/);
  assert.doesNotMatch(today, /\/api\/v1\/|fetch\(/);
});

test('Plan uses progressive disclosure while preserving module-owned rendering and dependencies', () => {
  assert.match(plan, /<details class="plan-module-block plan-module-disclosure"/);
  assert.match(plan, /module\.id === 'goals' \? 'open' : ''/);
  assert.match(plan, /module\.render\(/);
  assert.match(plan, /module\.bind\(/);
  assert.doesNotMatch(plan, /\/api\/v1\//);
});

test('Progress foregrounds factual evidence and keeps guidance explicit', () => {
  assert.match(progress, /<h2 id="progressCurrentTitle">Progress<\/h2>/);
  assert.match(progress, /<h3 id="progressWeekTitle">This week<\/h3>/);
  assert.match(progress, /By goal/);
  assert.match(progress, /Recent activity/);
  assert.match(progress, /Evidence only here\. Patterns live in Insights\./);
});

test('Insights shows current evidence state first and keeps methodology on demand', () => {
  assert.match(insights, /<h2 id="insightsCurrentTitle">Insights<\/h2>/);
  assert.match(insights, /EVIDENCE READINESS/);
  assert.match(insights, /No matched patterns yet/);
  assert.match(insights, /<details class="insight-method-disclosure os-section">/);
});

test('mobile navigation exposes five primary destinations plus an accessible secondary More menu', () => {
  assert.match(indexHtml, /id="quickAddBtn"[\s\S]*?<b>Add<\/b>/);
  assert.match(indexHtml, /<details id="topMore" class="top-more">/);
  assert.match(indexHtml, /aria-label="More sections and settings"/);
  for (const id of ['insightsBtn', 'journalBtn', 'settingsBtn']) assert.match(indexHtml, new RegExp(`id="${id}"`));
  assert.match(liveCss, /\.top-more>summary\{width:48px!important;height:48px!important/);
  assert.match(app, /function closeTopMore\(\)/);
  assert.doesNotMatch(indexHtml, /<header class="topbar" aria-hidden="true">/);
});

test('desktop rail owns primary and secondary navigation with a separate logging action', () => {
  assert.match(indexHtml, /data-view="today" class="rail-nav-btn active"/);
  assert.match(indexHtml, /data-view="wellness-boost" class="rail-nav-btn"/);
  assert.match(indexHtml, /data-view="insights" class="rail-nav-btn rail-secondary"/);
  assert.match(indexHtml, /rail-log-btn[^>]*>[\s\S]*?Log activity<\/button>/);
  assert.match(currentCss, /\.app-rail\{position:fixed!important/);
});

test('Journal uses a real destination heading and preserves its privacy boundary', () => {
  assert.match(journal, /<h2 id="journalCurrentTitle">Journal<\/h2>/);
  assert.match(journal, /Journal text is not used by Progress, Insights or AI in this beta/);
});

test('Logger semantic guidance remains available for assistive technology', () => {
  assert.match(accessibilityCss, /\.logger-mode-fieldset legend,\s*\.logger-mode-hint\s*\{[\s\S]*display: block;[\s\S]*position: absolute;[\s\S]*inline-size: 1px;[\s\S]*clip-path: inset\(50%\);/);
});

test('canonical Current layers preserve 44px interaction floors and reduced motion', () => {
  assert.match(currentCss, /min-height:44px!important/);
  assert.match(currentCss, /@media\(prefers-reduced-motion:reduce\)/);
});
