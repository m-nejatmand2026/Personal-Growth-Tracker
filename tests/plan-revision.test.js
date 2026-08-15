import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const planJs = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const goalsUi = await readFile(new URL('../public/js/modules/goals/ui.js', import.meta.url), 'utf8');
const goalsModule = await readFile(new URL('../public/js/modules/goals/module.js', import.meta.url), 'utf8');
const capacityModule = await readFile(new URL('../public/js/modules/capacity/module.js', import.meta.url), 'utf8');
const planCss = await readFile(new URL('../public/css/plan-revision.css', import.meta.url), 'utf8');
const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const rebuildPages = await readFile(new URL('../public/css/product-rebuild-pages.css', import.meta.url), 'utf8');
const planExperience = `${planJs}\n${goalsModule}\n${capacityModule}`;

test('Recovered Plan exposes Goals Activities Schedule budgets Capacity and Compass in that order', () => {
  const goals = planJs.indexOf('<span>Goals</span>');
  const activities = planJs.indexOf('<span>Activities</span>');
  const schedule = planJs.indexOf('<span>Schedule</span>');
  const budgets = planJs.indexOf('<span>Goal time budgets</span>');
  const capacity = planJs.indexOf('<span>Time & capacity</span>');
  const compass = planJs.indexOf('<span>Compass</span>');
  assert.ok(goals >= 0 && goals < activities && activities < schedule && schedule < budgets && budgets < capacity && capacity < compass);
  assert.match(planJs, /data-plan-scroll="plan-module-goals"/);
  assert.match(planJs, /data-plan-scroll="plan-module-activities"/);
  assert.match(planJs, /data-plan-scroll="commitmentEditor"/);
  assert.match(planJs, /data-plan-scroll="plan-module-plans"/);
  assert.match(planJs, /data-plan-scroll="capacityPanel"/);
  assert.match(planJs, /data-plan-scroll="compassSection"/);
});

test('Goals stay first while Activities and supporting planning modules follow explicitly', () => {
  assert.match(planJs, /EXPERIENCE_ORDER = Object\.freeze\(\{ goals: 10, activities: 15, areas: 20, plans: 30, capacity: 40 \}\)/);
  assert.match(planJs, /Choose what deserves attention, then fit it to the time you actually have\./);
});

test('Goal creation uses human questions before optional expert controls', () => {
  const name = goalsUi.indexOf('id="goalName"');
  const area = goalsUi.indexOf('id="goalArea"');
  const measurementQuestion = goalsUi.indexOf('How will you know you are making progress?');
  const target = goalsUi.indexOf('id="goalTargetBuilder"');
  const advanced = goalsUi.indexOf('id="goalAdvancedOptions"');
  assert.ok(name >= 0 && name < area && area < measurementQuestion && measurementQuestion < target && target < advanced);
  for (const label of ['Time spent','Quantity','Completed','Milestones','Aim for','Targets are guidance, not debt']) assert.match(goalsUi, new RegExp(label));
  for (const id of ['goalMinimum','goalPriority','goalStatus','goalWhy','goalDescription']) assert.ok(goalsUi.indexOf(`id="${id}"`) > advanced);
});

test('Plan overview uses module-owned concrete available planned and still-flexible time language', () => {
  assert.match(planExperience, /Available this week/); assert.match(planExperience, /Planned this week/); assert.match(planExperience, /Still flexible/); assert.match(planExperience, /after recurring commitments/); assert.match(planExperience, /Plan over by/); assert.match(planExperience, /Schedule over by/);
  assert.match(planJs, /module\.planSummary/); assert.match(planJs, /dependencyModelsFor/); assert.doesNotMatch(planJs, /models\.areas|models\.goals|models\.capacity/); assert.doesNotMatch(planJs, /Spacious|Balanced|Very full|How full\?|productivity score|performance score/i);
});

test('Plan retains phone-first touch-safe foundations and Product Rebuild responsive layout', () => {
  assert.match(indexHtml, /\/css\/plan-revision\.css/); assert.match(indexHtml, /\/css\/product-rebuild-pages\.css/); assert.match(planCss, /var\(--gc-target-min\)/); assert.match(planCss, /@media\(max-width:680px\)/); assert.match(planCss, /scroll-margin-top/); assert.match(rebuildPages, /\.gc-plan-stats\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/); assert.match(rebuildPages, /@media\(max-width:760px\)[\s\S]*\.gc-plan-stats\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('Plan shell remains composition only and does not absorb module API calls', () => {
  assert.doesNotMatch(planJs, /\/api\/v1\/areas|\/api\/v1\/goals|\/api\/v1\/activities|\/api\/v1\/capacity|\/api\/v1\/plan\/versions/); assert.match(planJs, /createFrontendModuleRegistry/); assert.match(planJs, /module\.load/); assert.match(planJs, /module\.render/); assert.match(planJs, /module\.planSummary/); assert.match(planJs, /module\.planWorkingSummary/);
});
