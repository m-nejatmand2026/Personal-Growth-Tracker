import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const appJs = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const todayJs = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const dailyPlanJs = await readFile(new URL('../public/js/modules/daily-plan/module.js', import.meta.url), 'utf8');
const activitiesJs = await readFile(new URL('../public/js/modules/activities/module.js', import.meta.url), 'utf8');
const activitiesUi = await readFile(new URL('../public/js/modules/activities/ui.js', import.meta.url), 'utf8');
const goalsJs = await readFile(new URL('../public/js/modules/goals/module.js', import.meta.url), 'utf8');
const planJs = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const recoveryCss = await readFile(new URL('../public/css/functional-recovery.css', import.meta.url), 'utf8');
const activitiesCss = await readFile(new URL('../public/css/modules/activities.css', import.meta.url), 'utf8');

test('global Add recovers factual Done as its default consequence', () => {
  assert.match(appJs, /\[data-open-logger\][\s\S]*logger\.open\(\{ entryMode: 'done', date: state\.date \}\)/);
  assert.match(indexHtml, /id="quickAddBtn"[^>]*aria-label="Add activity"/);
});

test('Today daily items expose Start Done and secondary options directly', () => {
  const row = dailyPlanJs.slice(dailyPlanJs.indexOf('function todayPlanRow'), dailyPlanJs.indexOf('function todayNow'));
  assert.match(row, /data-plan-start/);
  assert.match(row, /class="gc-day-done" data-plan-done/);
  assert.match(row, /class="gc-day-more" data-plan-review/);
  assert.match(recoveryCss, /\.gc-day-item-actions \.gc-day-done/);
});

test('Today keeps Tomorrow one tap away without automatic rollover', () => {
  assert.match(dailyPlanJs, /function tomorrowPreview/);
  assert.match(dailyPlanJs, />Tomorrow</);
  assert.match(dailyPlanJs, /data-plan-date="\$\{escapeHtml\(model\.tomorrow\)\}"/);
  assert.match(dailyPlanJs, /date: button\.dataset\.planDate \|\| model\.date/);
  assert.match(dailyPlanJs, /Plan only what is useful/);
  assert.doesNotMatch(dailyPlanJs, /automatically.*tomorrow|carry.*forward|overdue.*today/i);
});

test('Today distinguishes Plan activity from global factual Add', () => {
  assert.match(dailyPlanJs, /> Plan activity<\/button>/);
  assert.match(dailyPlanJs, /data-plan-capture="planned"/);
  assert.match(dailyPlanJs, /data-plan-capture="in_progress"/);
  assert.match(dailyPlanJs, /entryMode: 'done'/);
});

test('Today keeps Progress wellbeing and Journal visible before deeper detail', () => {
  assert.match(todayJs, /function visibleContext/);
  assert.match(todayJs, /gc-today-visible-context/);
  assert.match(todayJs, /directionSection\(directionModel\)/);
  assert.match(todayJs, /\$\{wellbeingState\}/);
  assert.match(todayJs, /\$\{journalPreview\}/);
  const visibleIndex = todayJs.indexOf('${visibleContext({ directionModel, wellbeingState, journalPreview })}');
  const disclosureIndex = todayJs.indexOf('<details class="gc-today-more">');
  assert.ok(visibleIndex >= 0 && disclosureIndex > visibleIndex, 'visible Today context must render before the deeper-details disclosure');
  assert.match(todayJs, /More detail/);
  assert.match(todayJs, /Recent facts and deeper wellbeing/);
  assert.match(recoveryCss, /\.gc-today-visible-context/);
});

test('Plan no longer injects a visible transient loading card', () => {
  assert.doesNotMatch(planJs, /root\.innerHTML\s*=\s*`<section class="plan-loading"/);
  assert.match(appJs, /await renderCurrentView\(name\)/);
  assert.match(appJs, /if \(transitionToken !== viewTransitionToken \|\| state\.view !== name\) return;/);
  assert.match(appJs, /revealView\(name\)/);
});

test('Plan restores visible Goal direction through a module-owned working-summary contract', () => {
  assert.match(goalsJs, /planWorkingSummary\(\{ model \}\)/);
  assert.match(goalsJs, /id: `goals\.focus\.\$\{goal\.id\}`/);
  assert.match(goalsJs, /label: goal\.name/);
  assert.match(planJs, /module\.planWorkingSummary/);
  assert.match(planJs, /function planWorkingSurface/);
  assert.match(planJs, /What deserves attention/);
  assert.doesNotMatch(planJs, /goal\.name|goal\.area_name|time_target_minutes|time_minimum_minutes/);
  assert.match(recoveryCss, /\.gc-plan-goal-focus/);
});

test('Plan restores Schedule as a direct planning destination', () => {
  assert.match(planJs, /data-plan-scroll="commitmentEditor"><span>Schedule<\/span>/);
  assert.match(planJs, /Recurring commitments/);
  assert.match(planJs, /if \(target\?\.matches\('details'\)\) target\.open = true/);
});

test('Activities becomes a real module-owned Plan management surface', () => {
  assert.match(activitiesJs, /slots:\s*Object\.freeze\(\[\{ name: 'plan', order: 15 \}\]\)/);
  assert.match(activitiesJs, /activitiesPanelHtml/);
  assert.match(activitiesJs, /bindActivitiesPanel/);
  assert.match(activitiesJs, /this\.list\(\)/);
  assert.match(activitiesJs, /this\.creationContext\(\)/);
  assert.match(activitiesUi, /id="activitiesPanel"/);
  assert.match(activitiesUi, /id="activityManageForm"/);
  assert.match(activitiesUi, /data-activity-edit/);
  assert.match(activitiesUi, /data-activity-archive/);
  assert.match(activitiesUi, /await create\?/);
  assert.match(activitiesUi, /await update\?/);
  assert.match(activitiesUi, /await archive\?/);
  assert.match(planJs, /data-plan-scroll="plan-module-activities"><span>Activities<\/span>/);
  assert.match(indexHtml, /\/css\/modules\/activities\.css/);
  assert.match(activitiesCss, /\.activities-panel/);
});

test('functional recovery styling loads after visual polish and before accessibility safeguards', () => {
  const polish = indexHtml.indexOf('/css/product-polish.css');
  const recovery = indexHtml.indexOf('/css/functional-recovery.css');
  const accessibility = indexHtml.indexOf('/css/accessibility-regression.css');
  assert.ok(polish >= 0 && polish < recovery && recovery < accessibility);
});
