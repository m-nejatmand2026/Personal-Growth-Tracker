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
const rebuildCss = await readFile(new URL('../public/css/product-rebuild.css', import.meta.url), 'utf8');

test('Recovered Today keeps daily action and time reality first then visible supporting context', () => {
  const render = todayJs.slice(todayJs.indexOf('root.innerHTML'));
  const heading = render.indexOf('gc-today-header');
  const dailyPlan = render.indexOf('${dailyPlanPanel}');
  const capacity = render.indexOf('${capacityCard(capacityModel)}');
  const context = render.indexOf('${visibleContext({ directionModel, wellbeingState, journalPreview })}');
  const more = render.indexOf('gc-today-more');
  assert.ok(heading >= 0 && heading < dailyPlan && dailyPlan < capacity && capacity < context && context < more);
  assert.match(todayJs, /function visibleContext/);
  assert.match(todayJs, /directionSection\(directionModel\)/);
  assert.match(todayJs, /\$\{wellbeingState\}/);
  assert.match(todayJs, /\$\{journalPreview\}/);
});

test('Today uses live module data rather than placeholder dashboard values', () => {
  assert.match(todayJs, /metricValue\(model\.metrics, 'Planned'\)/);
  assert.match(todayJs, /metricValue\(model\.metrics, 'Still flexible'\)/);
  assert.match(todayJs, /progress\?\.todayDirection/);
  assert.match(todayJs, /progress\?\.todayRecent/);
  assert.doesNotMatch(todayJs, /Records\s*9|6 h 40 m|9 h planned/);
});

test('Daily Plan owns Now, Your day and activity actions', () => {
  assert.match(dailyPlanJs, /variant === 'today-sanctuary' \|\| variant === 'today-product'/);
  assert.match(dailyPlanJs, /gc-now-card/);
  assert.match(dailyPlanJs, /gc-day-list/);
  assert.match(dailyPlanJs, /data-plan-capture="in_progress"/);
  assert.match(dailyPlanJs, /data-plan-capture="planned"/);
  assert.match(dailyPlanJs, /data-plan-start/);
  assert.match(dailyPlanJs, /data-plan-done/);
  assert.match(dailyPlanJs, /data-plan-review/);
});

test('Today remains a composition surface and does not duplicate module APIs', () => {
  assert.match(todayJs, /renderThresholdTrack/);
  assert.match(todayJs, /frontendModules/);
  assert.match(todayJs, /capacity \? capacity\.loadToday\(\{ date \}\)/);
  assert.match(todayJs, /today \? today\.loadSummary\(\{ date, period: directionPeriod \}\)/);
  assert.doesNotMatch(todayJs, /\/api\/v1\/|fetch\(/);
});

test('Today exposes Day Week Month Year through the existing Today capability', () => {
  assert.match(todayJs, /data-direction-period/);
  for (const period of ['day', 'week', 'month', 'year']) assert.match(todayJs, new RegExp(`'${period}'`));
  assert.match(todayModuleJs, /period=\$\{encodeURIComponent\(selectedPeriod\)\}/);
  assert.match(rebuildCss, /gc-period-switch/);
});

test('targetless direction shows Actual without inventing zero guidance', () => {
  const model = progressModule.todayDirection({ period: 'month', items: [{ key: 'writing', name: 'Writing', actual_minutes: 30, minimum_minutes: 0, target_minutes: 0 }] });
  assert.equal(model.title, 'Progress direction');
  assert.equal(model.period, 'month');
  assert.equal(model.cards[0].status, 'No target set for this period');
  assert.equal(model.cards[0].threshold, null);
  assert.deepEqual(model.cards[0].metrics, [{ label: 'Actual', minutes: 30 }]);
});

test('Capacity keeps physical-time semantics and Today renders concrete time-fit language', () => {
  assert.match(capacityJs, /still flexible today/);
  assert.match(capacityJs, /more planned than available/);
  assert.match(capacityJs, /physical time math, not a productivity score/i);
  assert.match(todayJs, /Today’s time/);
  assert.match(todayJs, /planned/);
  assert.match(todayJs, /flexible/);
});

test('Wellbeing remains module-owned and exposes accessible progressive Energy selection', () => {
  assert.match(wellbeingJs, /Daily state/);
  assert.match(wellbeingJs, /How today feels/);
  assert.match(wellbeingJs, /Observations, not performance scores/);
  assert.match(wellbeingJs, /aria-pressed=/);
  assert.match(wellbeingJs, /setAttribute\('aria-pressed'/);
  assert.match(wellbeingJs, /<details class="energy-drawer"/);
});

test('Product Rebuild and recovery layers load after rejected Current while accessibility stays last', () => {
  const semantics = indexHtml.indexOf('/css/figma-current-semantics.css');
  const rebuild = indexHtml.indexOf('/css/product-rebuild.css');
  const pages = indexHtml.indexOf('/css/product-rebuild-pages.css');
  const recovery = indexHtml.indexOf('/css/functional-recovery.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(semantics >= 0 && semantics < rebuild && rebuild < pages && pages < recovery && recovery < accessibility);
  assert.match(rebuildCss, /@media\(prefers-reduced-motion:reduce\)/);
});
