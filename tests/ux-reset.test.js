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
const resetCss = await readFile(new URL('../public/css/ux-reset.css', import.meta.url), 'utf8');
const navigationCss = await readFile(new URL('../public/css/navigation-shell.css', import.meta.url), 'utf8');
const wellbeingCss = await readFile(new URL('../public/css/modules/wellbeing.css', import.meta.url), 'utf8');
const progressCss = await readFile(new URL('../public/css/modules/progress.css', import.meta.url), 'utf8');
const insightsCss = await readFile(new URL('../public/css/modules/insights.css', import.meta.url), 'utf8');
const accessibilityCss = await readFile(new URL('../public/css/accessibility-regression.css', import.meta.url), 'utf8');

test('Revision C presentation layer loads after shared experience styling and before accessibility safeguards', () => {
  const framework = indexHtml.indexOf('/css/experience-framework.css');
  const reset = indexHtml.indexOf('/css/ux-reset.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(framework >= 0 && framework < reset && reset < accessibility);
});

test('Stitch Today keeps the agenda first without moving business logic into composition', () => {
  assert.match(today, /today-sanctuary-heading/);
  assert.match(today, /\$\{dailyPlanPanel\}[\s\S]*\$\{wellbeingState\}[\s\S]*\$\{renderModel\(capacityModel\)\}/);
  assert.doesNotMatch(today, /\/api\/v1\/|fetch\(/);
});

test('Plan uses progressive disclosure while preserving module-owned rendering and dependencies', () => {
  assert.match(plan, /<details class="plan-module-block plan-module-disclosure"/);
  assert.match(plan, /module\.id === 'goals' \? 'open' : ''/);
  assert.match(plan, /target\?\.closest\('details\.plan-module-disclosure'\)/);
  assert.match(plan, /module\.render\(/);
  assert.match(plan, /module\.bind\(/);
  assert.doesNotMatch(plan, /\/api\/v1\//);
});

test('Progress foregrounds recent facts and moves goal guidance behind progressive disclosure', () => {
  assert.match(progress, /<h2>This week<\/h2>/);
  assert.match(progress, /<h2>Recent<\/h2>/);
  assert.match(progress, /<details class="progress-goals-section progress-detail-disclosure os-section">/);
  assert.match(progressCss, /\.progress-detail-disclosure>summary\{[^}]*min-height:56px/);
  assert.doesNotMatch(progress, /What actually happened|Recently recorded progress/);
});

test('Insights shows current evidence state first and keeps methodology on demand', () => {
  assert.match(insights, /<h2>\$\{escapeHtml\(stage\.label\)\}<\/h2>/);
  assert.match(insights, /No matched patterns yet/);
  assert.match(insights, /<details class="insight-method-disclosure os-section">/);
  assert.match(insightsCss, /\.insight-method-disclosure>summary\{[^}]*min-height:56px/);
  assert.doesNotMatch(insights, /Patterns, when the evidence is ready|What becomes useful with more history/);
});

test('evidence-backed mobile simplification keeps state and Progress compact without shrinking targets', () => {
  assert.match(wellbeingCss, /\.daily-state-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(wellbeingCss, /\.state-card\{[^}]*min-height:82px/);
  assert.match(progressCss, /\.gc-stat-grid\.progress-stat-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(progressCss, /@media\(max-width:520px\)[\s\S]*\.gc-stat-grid\.progress-stat-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
});

test('mobile topbar uses one accessible More control and desktop delegates actions to the rail', () => {
  assert.match(indexHtml, /<details id="topMore" class="top-more">/);
  assert.match(indexHtml, /aria-label="More sections and settings"/);
  for (const id of ['insightsBtn', 'journalBtn', 'settingsBtn']) assert.match(indexHtml, new RegExp(`id="${id}"`));
  assert.match(navigationCss, /\.top-more>summary\{[^}]*width:var\(--gc-target-min\);height:var\(--gc-target-min\)/);
  assert.match(navigationCss, /@media \(min-width:900px\)[\s\S]*\.top-actions\{display:none\}/);
  assert.match(app, /function closeTopMore\(\)/);
  assert.match(app, /more\?\.open && !more\.contains\(event\.target\)/);
});

test('Journal does not repeat the shell-owned destination title', () => {
  assert.match(journal, /journal-hero journal-action-hero/);
  assert.doesNotMatch(journal, /journal-hero[^`]*<h2>Journal<\/h2>/);
});

test('Revision C reduces explanatory chrome while preserving minimum touch targets', () => {
  assert.match(resetCss, /\.today-command \{[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(resetCss, /\.command-log-btn \{[\s\S]*min-height: var\(--gc-target-min\);/);
  assert.match(resetCss, /\.plan-module-summary \{[\s\S]*min-height: 56px;/);
  assert.match(resetCss, /#loggerActivityQuery \{[\s\S]*min-height: 52px;/);
  assert.doesNotMatch(resetCss, /min-height:\s*(?:3[0-9]|4[0-3])px/);
});

test('Logger visual simplification preserves its mode legend and dynamic guidance for assistive technology', () => {
  assert.match(
    accessibilityCss,
    /\.logger-mode-fieldset legend,\s*\.logger-mode-hint\s*\{[\s\S]*display: block;[\s\S]*position: absolute;[\s\S]*inline-size: 1px;[\s\S]*clip-path: inset\(50%\);/
  );
});

test('primary capture wording is consistent across desktop rail topbar and mobile navigation', () => {
  assert.match(indexHtml, /rail-log-btn[^>]*>[\s\S]*?＋<\/span> Add<\/button>/);
  assert.match(indexHtml, /top-log-btn[^>]*>[\s\S]*?<span>Add<\/span>/);
  assert.match(indexHtml, /id="quickAddBtn"[\s\S]*?<b>Add<\/b>/);
});
