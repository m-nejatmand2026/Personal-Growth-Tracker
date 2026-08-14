import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { progressModule } from '../public/js/modules/progress/manifest.js';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const todayJs = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const wellbeingJs = await readFile(new URL('../public/js/modules/wellbeing/module.js', import.meta.url), 'utf8');
const capacityJs = await readFile(new URL('../public/js/modules/capacity/module.js', import.meta.url), 'utf8');
const todayCss = await readFile(new URL('../public/css/today.css', import.meta.url), 'utf8');
const wellbeingCss = await readFile(new URL('../public/css/modules/wellbeing.css', import.meta.url), 'utf8');
const capacityCss = await readFile(new URL('../public/css/modules/capacity.css', import.meta.url), 'utf8');
const progressCss = await readFile(new URL('../public/css/modules/progress-today.css', import.meta.url), 'utf8');

test('Today keeps the approved command state capacity plan direction recent journal energy order', () => {
  const render = todayJs.slice(todayJs.indexOf('root.innerHTML'));
  const command = render.indexOf('today-command');
  const state = render.indexOf('${wellbeingState}');
  const capacity = render.indexOf('${renderModel(capacityModel)}');
  const dailyPlan = render.indexOf('${dailyPlanPanel}');
  const direction = render.indexOf('${renderModel(directionModel)}');
  const recent = render.indexOf('${renderModel(recentModel)}');
  const journal = render.indexOf('${journalPreview}');
  const energy = render.indexOf('${wellbeingDetails}');
  assert.ok(command >= 0 && command < state && state < capacity && capacity < dailyPlan && dailyPlan < direction && direction < recent && recent < journal && journal < energy);
});

test('Today remains a composition surface and uses the platform threshold primitive', () => {
  assert.match(todayJs, /renderThresholdTrack/);
  assert.match(todayJs, /platform\/charts\.js/);
  assert.match(todayJs, /frontendModules/);
  assert.doesNotMatch(todayJs, /\/api\/v1\/capacity|\/api\/v1\/progress|\/api\/v1\/wellbeing/);
});

test('targetless weekly direction never claims a zero minimum was reached', () => {
  const model = progressModule.todayDirection({
    items: [{ key: 'writing', name: 'Writing', actual_minutes: 30, minimum_minutes: 0, target_minutes: 0 }]
  });
  assert.equal(model.cards[0].status, 'Facts recorded');
  assert.deepEqual(model.cards[0].threshold, { actual: 30, minimum: 0, target: 0 });

  const empty = progressModule.todayDirection({
    items: [{ key: 'writing', name: 'Writing', actual_minutes: 0, minimum_minutes: 0, target_minutes: 0 }]
  });
  assert.equal(empty.cards[0].status, 'No target set');
});

test('Today capacity describes physical time rather than productivity performance', () => {
  assert.match(capacityJs, /Time reality/);
  assert.match(capacityJs, /of flexible time planned/);
  assert.match(capacityJs, /physical time math, not a productivity score/i);
  assert.match(capacityCss, /time-reality-card/);
});

test('Wellbeing owns visible Daily State and accessible progressive Energy selection', () => {
  assert.match(wellbeingJs, /Daily state/);
  assert.match(wellbeingJs, /How today feels/);
  assert.match(wellbeingJs, /Observations, not performance scores/);
  assert.match(wellbeingJs, /aria-pressed=/);
  assert.match(wellbeingJs, /setAttribute\('aria-pressed'/);
  assert.match(wellbeingJs, /<details class="energy-drawer"/);
  assert.match(wellbeingJs, /Energy map/);
});

test('Today is phone-first and its contributor styles stay module-owned', () => {
  assert.match(todayCss, /@media \(max-width:600px\)/);
  assert.match(todayCss, /grid-template-columns:1fr/);
  assert.doesNotMatch(todayCss, /daily-state-grid|time-reality-card|today-goal-card|daily-plan|journal-preview|energy-grid/);

  assert.match(wellbeingCss, /daily-state-grid/);
  assert.match(wellbeingCss, /@media \(min-width:640px\)/);
  assert.match(wellbeingCss, /energy-cell\{[^}]*min-height:50px/s);
  assert.doesNotMatch(wellbeingCss, /daily-plan|journal-preview|time-reality-card|today-goal-card/);

  assert.match(capacityCss, /time-reality-card/);
  assert.doesNotMatch(capacityCss, /daily-state-grid|today-goal-card|daily-plan|journal-preview/);

  assert.match(progressCss, /today-goal-card/);
  assert.match(progressCss, /activity-feed-row/);
  assert.doesNotMatch(progressCss, /daily-state-grid|time-reality-card|daily-plan|journal-preview/);
});

test('Today styles load after shell foundation while Daily Plan and Journal retain their own styles', () => {
  const shell = indexHtml.indexOf('/css/navigation-shell.css');
  const today = indexHtml.indexOf('/css/today.css');
  const wellbeing = indexHtml.indexOf('/css/modules/wellbeing.css');
  const capacity = indexHtml.indexOf('/css/modules/capacity.css');
  const progress = indexHtml.indexOf('/css/modules/progress-today.css');
  const dailyPlan = indexHtml.indexOf('/css/daily-plan.css');
  const journal = indexHtml.indexOf('/css/journal.css');
  assert.ok(shell >= 0 && shell < today && today < wellbeing && wellbeing < capacity && capacity < progress);
  assert.ok(progress < dailyPlan && progress < journal);
});
