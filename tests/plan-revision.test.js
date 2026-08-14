import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const planJs = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');
const goalsUi = await readFile(new URL('../public/js/modules/goals/ui.js', import.meta.url), 'utf8');
const planCss = await readFile(new URL('../public/css/plan-revision.css', import.meta.url), 'utf8');
const indexHtml = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('Revision A Plan exposes Goals Capacity Schedule Compass in that order', () => {
  const goals = planJs.indexOf('<b>Goals</b>');
  const capacity = planJs.indexOf('<b>Capacity</b>');
  const schedule = planJs.indexOf('<b>Schedule</b>');
  const compass = planJs.indexOf('<b>Compass</b>');
  assert.ok(goals >= 0 && goals < capacity && capacity < schedule && schedule < compass);
  assert.match(planJs, /data-plan-scroll="plan-module-goals"/);
  assert.match(planJs, /data-plan-scroll="capacityPanel"/);
  assert.match(planJs, /data-plan-scroll="commitmentEditor"/);
  assert.match(planJs, /data-plan-scroll="compassSection"/);
});

test('Goals render before supporting Areas and time-budget modules', () => {
  assert.match(planJs, /EXPERIENCE_ORDER = Object\.freeze\(\{ goals: 10, areas: 20, plans: 30, capacity: 40 \}\)/);
  assert.match(planJs, /Set direction, then fit it to your time\./);
});

test('Goal creation uses human questions before optional expert controls', () => {
  const name = goalsUi.indexOf('id="goalName"');
  const area = goalsUi.indexOf('id="goalArea"');
  const measurementQuestion = goalsUi.indexOf('How will you know you are making progress?');
  const target = goalsUi.indexOf('id="goalTargetBuilder"');
  const advanced = goalsUi.indexOf('id="goalAdvancedOptions"');
  assert.ok(name >= 0 && name < area && area < measurementQuestion && measurementQuestion < target && target < advanced);
  assert.match(goalsUi, /Time spent/);
  assert.match(goalsUi, /Quantity/);
  assert.match(goalsUi, /Completed/);
  assert.match(goalsUi, /Milestones/);
  assert.match(goalsUi, /Aim for/);
  assert.match(goalsUi, /Targets are guidance, not debt/);
  for (const id of ['goalMinimum','goalPriority','goalStatus','goalWhy','goalDescription']) {
    assert.ok(goalsUi.indexOf(`id="${id}"`) > advanced);
  }
});

test('Plan overview uses concrete available planned and still-flexible time language', () => {
  assert.match(planJs, /Available this week/);
  assert.match(planJs, /Planned this week/);
  assert.match(planJs, /Still flexible/);
  assert.match(planJs, /after recurring commitments/);
  assert.match(planJs, /Plan over by/);
  assert.match(planJs, /Schedule over by/);
  assert.doesNotMatch(planJs, /Spacious|Balanced|Very full|How full\?|Current plan/i);
  assert.doesNotMatch(planJs, /productivity score|performance score/i);
});

test('Plan Revision A stylesheet is token based phone first and touch sized', () => {
  assert.match(indexHtml, /\/css\/plan-revision\.css/);
  assert.match(planCss, /#planView\.active\{display:grid/);
  assert.doesNotMatch(planCss, /#planView\{[^}]*display:grid/);
  assert.match(planCss, /var\(--gc-target-min\)/);
  assert.match(planCss, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(planCss, /@media\(max-width:680px\)/);
  assert.match(planCss, /@media\(min-width:760px\)/);
  assert.match(planCss, /scroll-margin-top/);
});

test('Plan shell remains composition only and does not absorb module API calls', () => {
  assert.doesNotMatch(planJs, /\/api\/v1\/areas|\/api\/v1\/goals|\/api\/v1\/capacity|\/api\/v1\/plan\/versions/);
  assert.match(planJs, /createFrontendModuleRegistry/);
  assert.match(planJs, /module\.load/);
  assert.match(planJs, /module\.render/);
});
