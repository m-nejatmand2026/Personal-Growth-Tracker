import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const planJs = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const areasModule = await readFile(new URL('../public/js/modules/areas/module.js', import.meta.url), 'utf8');
const areasUi = await readFile(new URL('../public/js/modules/areas/ui.js', import.meta.url), 'utf8');
const goalsModule = await readFile(new URL('../public/js/modules/goals/module.js', import.meta.url), 'utf8');
const goalsUi = await readFile(new URL('../public/js/modules/goals/ui.js', import.meta.url), 'utf8');
const areasCss = await readFile(new URL('../public/css/modules/areas.css', import.meta.url), 'utf8');
const goalsCss = await readFile(new URL('../public/css/modules/goals.css', import.meta.url), 'utf8');

test('Life Areas are visibly user-owned and manageable', () => {
  assert.match(areasUi, /<h2>Life areas<\/h2>/);
  assert.match(areasUi, /Your own broad parts of life/);
  assert.match(areasUi, /Starter suggestions are optional/);
  assert.match(areasUi, /These are your categories, not Growth Compass categories/);
  assert.match(areasUi, /＋ New life area/);
  assert.match(areasUi, /Create my own/);
  assert.match(areasUi, /data-edit-area/);
  assert.match(areasUi, /data-move-area/);
  assert.match(areasUi, /data-archive-area/);
  assert.match(areasUi, /Goals and historical facts stay intact/);
});

test('Life Area reorder normalizes the full visible order rather than relying on existing sort gaps', () => {
  assert.match(areasUi, /Promise\.all\(ordered\.map\(\(area, position\)/);
  assert.match(areasUi, /const sortOrder = \(position \+ 1\) \* 10/);
  assert.match(areasUi, /sort_order: sortOrder/);
});

test('Areas frontend capability owns create update and archive API actions', () => {
  assert.match(areasModule, /async create\(input\)/);
  assert.match(areasModule, /async update\(id, input\)/);
  assert.match(areasModule, /async archive\(id\)/);
  assert.match(areasModule, /\/api\/v1\/areas/);
});

test('Goal editor creates a missing Life Area through its declared Areas capability', () => {
  assert.match(goalsModule, /dependsOn: \['areas'\]/);
  assert.match(goalsModule, /areasCapability: dependencies\?\.areas \|\| null/);
  assert.match(goalsUi, /＋ New life area/);
  assert.match(goalsUi, /Create it here without leaving this Goal/);
  assert.match(goalsUi, /areasCapability\.create\(\{/);
  assert.match(goalsUi, /select\.add\(new Option/);
  assert.match(goalsUi, /select\.value = String\(created\.id\)/);
  assert.doesNotMatch(goalsUi, /\/api\/v1\/areas/);
});

test('contextual Life Area creation preserves the in-progress Goal form', () => {
  const handlerStart = goalsUi.indexOf("$('#goalNewAreaConfirm')?.addEventListener");
  const handlerEnd = goalsUi.indexOf("$('#goalForm')?.addEventListener", handlerStart);
  const handler = goalsUi.slice(handlerStart, handlerEnd);
  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart);
  assert.match(handler, /areasCapability\.create/);
  assert.match(handler, /Life area created/);
  assert.doesNotMatch(handler, /reloadPlatform/);
  assert.doesNotMatch(handler, /resetGoalEditor/);
});

test('Plan composition injects only declared frontend dependencies', () => {
  assert.match(planJs, /function dependenciesFor\(module\)/);
  assert.match(planJs, /module\.dependsOn/);
  assert.match(planJs, /registry\.get\(id\)/);
  assert.match(planJs, /dependencies: dependenciesFor\(module\)/);
  assert.doesNotMatch(planJs, /goals.*areasCapability|areasCapability.*goals/s);
});

test('Areas and Goals own their new presentation and keep touch targets', () => {
  assert.match(indexHtml, /\/css\/modules\/areas\.css/);
  assert.match(indexHtml, /\/css\/modules\/goals\.css/);
  assert.match(areasCss, /min-height:var\(--gc-target-min\)/);
  assert.match(goalsCss, /min-height:var\(--gc-target-min\)/);
  assert.doesNotMatch(areasCss, /goal-/);
  assert.doesNotMatch(goalsCss, /area-manage-row|area-row-actions/);
});
