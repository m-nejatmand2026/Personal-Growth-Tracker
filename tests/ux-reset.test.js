import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const today = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const plan = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const resetCss = await readFile(new URL('../public/css/ux-reset.css', import.meta.url), 'utf8');

test('Revision C presentation layer loads after shared experience styling and before accessibility safeguards', () => {
  const framework = indexHtml.indexOf('/css/experience-framework.css');
  const reset = indexHtml.indexOf('/css/ux-reset.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(framework >= 0 && framework < reset && reset < accessibility);
});

test('Revision C keeps Today action-first without moving business logic into composition', () => {
  assert.match(today, /<span aria-hidden="true">＋<\/span> Add<\/button>/);
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

test('Revision C reduces explanatory chrome while preserving minimum touch targets', () => {
  assert.match(resetCss, /\.today-command \{[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
  assert.match(resetCss, /\.command-log-btn \{[\s\S]*min-height: var\(--gc-target-min\);/);
  assert.match(resetCss, /\.plan-module-summary \{[\s\S]*min-height: 56px;/);
  assert.match(resetCss, /#loggerActivityQuery \{[\s\S]*min-height: 52px;/);
  assert.doesNotMatch(resetCss, /min-height:\s*(?:3[0-9]|4[0-3])px/);
});

test('primary capture wording is consistent across desktop rail topbar and mobile navigation', () => {
  assert.match(indexHtml, /rail-log-btn[^>]*>[\s\S]*?＋<\/span> Add<\/button>/);
  assert.match(indexHtml, /top-log-btn[^>]*>[\s\S]*?<span>Add<\/span>/);
  assert.match(indexHtml, /id="quickAddBtn"[\s\S]*?<b>Add<\/b>/);
});
