import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { progressModule } from '../public/js/modules/progress/manifest.js';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const todayJs = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const todayModuleJs = await readFile(new URL('../public/js/modules/today/manifest.js', import.meta.url), 'utf8');
const wellbeingJs = await readFile(new URL('../public/js/modules/wellbeing/module.js', import.meta.url), 'utf8');
const capacityJs = await readFile(new URL('../public/js/modules/capacity/module.js', import.meta.url), 'utf8');
const dailyPlanJs = await readFile(new URL('../public/js/modules/daily-plan/module.js', import.meta.url), 'utf8');
const currentCss = await readFile(new URL('../public/css/figma-current.css', import.meta.url), 'utf8');
const liveCss = await readFile(new URL('../public/css/figma-current-live.css', import.meta.url), 'utf8');
const semanticCss = await readFile(new URL('../public/css/figma-current-semantics.css', import.meta.url), 'utf8');

test('Figma Current Today puts identity, live overview and next actions before supporting state', () => {
  const render = todayJs.slice(todayJs.indexOf('root.innerHTML'));
  const heading = render.indexOf('today-sanctuary-heading');
  const overview = render.indexOf('${currentOverview(directionModel, capacityModel)}');
  const dailyPlan = render.indexOf('${dailyPlanPanel}');
  const state = render.indexOf('${wellbeingState}');
  assert.ok(heading >= 0 && heading < overview && overview < dailyPlan && dailyPlan < state);
});

test('Today headline metrics are derived from module models rather than placeholder dashboard values', () => {
  assert.match(todayJs, /directionActualMinutes\(directionModel\)/);
  assert.match(todayJs, /capacity\.planSummary\(\{ model \}\)/);
  assert.match(todayJs, /Actual progress/);
  assert.match(todayJs, /Capacity/);
  assert.doesNotMatch(todayJs, /Records\s*9|6 h 40 m|9 h planned/);
});

test('Daily Plan owns its agenda and existing actions', () => {
  assert.match(dailyPlanJs, /variant === 'today-sanctuary'/);
  assert.match(dailyPlanJs, /sanctuary-agenda-list/);
  assert.match(dailyPlanJs, /data-plan-start/);
  assert.match(dailyPlanJs, /data-plan-done/);
  assert.match(dailyPlanJs, /data-plan-edit/);
});

test('Today remains a composition surface and does not duplicate module APIs', () => {
  assert.match(todayJs, /renderThresholdTrack/);
  assert.match(todayJs, /frontendModules/);
  assert.match(todayJs, /capacity\.load\(\{ date \}\)/);
  assert.match(todayJs, /today\.loadSummary\(\{ date, period: directionPeriod \}\)/);
  assert.doesNotMatch(todayJs, /\/api\/v1\/|fetch\(/);
});

test('Today exposes Day Week Month Year through the existing Today capability', () => {
  assert.match(todayJs, /data-direction-period/);
  for (const period of ['day', 'week', 'month', 'year']) assert.match(todayJs, new RegExp(`'${period}'`));
  assert.match(todayModuleJs, /period=\$\{encodeURIComponent\(selectedPeriod\)\}/);
  assert.match(liveCss, /today-period-switch/);
});

test('targetless direction shows Actual without inventing zero guidance', () => {
  const model = progressModule.todayDirection({
    period: 'month',
    items: [{ key: 'writing', name: 'Writing', actual_minutes: 30, minimum_minutes: 0, target_minutes: 0 }]
  });
  assert.equal(model.title, 'Progress direction');
  assert.equal(model.period, 'month');
  assert.equal(model.cards[0].status, 'No target set for this period');
  assert.equal(model.cards[0].threshold, null);
  assert.deepEqual(model.cards[0].metrics, [{ label: 'Actual', minutes: 30 }]);
});

test('Capacity keeps physical-time semantics and contributes live week summary', () => {
  assert.match(capacityJs, /still flexible today/);
  assert.match(capacityJs, /more planned than available/);
  assert.match(capacityJs, /physical time math, not a productivity score/i);
  assert.match(todayJs, /capacity\.planned-week/);
  assert.match(todayJs, /capacity\.time-fit-week/);
});

test('Wellbeing remains module-owned and exposes accessible progressive Energy selection', () => {
  assert.match(wellbeingJs, /Daily state/);
  assert.match(wellbeingJs, /How today feels/);
  assert.match(wellbeingJs, /Observations, not performance scores/);
  assert.match(wellbeingJs, /aria-pressed=/);
  assert.match(wellbeingJs, /setAttribute\('aria-pressed'/);
  assert.match(wellbeingJs, /<details class="energy-drawer"/);
});

test('canonical Figma layers load after foundations while accessibility safeguards remain last', () => {
  const current = indexHtml.indexOf('/css/figma-current.css');
  const live = indexHtml.indexOf('/css/figma-current-live.css');
  const semantics = indexHtml.indexOf('/css/figma-current-semantics.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(current >= 0 && current < live && live < semantics && semantics < accessibility);
  assert.match(currentCss, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(semanticCss, /today-sanctuary-heading h2::before\{content:none!important\}/);
});
