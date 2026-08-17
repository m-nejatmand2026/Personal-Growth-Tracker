import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
const app=await readFile(new URL('../public/experience/2/js/app.js',import.meta.url),'utf8');
const plan=await readFile(new URL('../public/experience/2/js/views/plan.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/plan.css',import.meta.url),'utf8');
const index=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');

test('Experience 2 Plan replaces the placeholder with real Capacity data',()=>{assert.match(app,/loadPlan/);assert.match(app,/renderPlan/);assert.match(plan,/\/v1\/capacity\?date=/);assert.match(plan,/period=\$\{safePeriod\}/);assert.doesNotMatch(plan,/Plan foundation/);assert.match(index,/\/experience\/2\/css\/plan\.css/)});

test('Plan exposes day week month horizons and defaults to week',()=>{assert.match(plan,/new Set\(\['day','week','month'\]\)/);assert.match(plan,/period='week'/);assert.match(plan,/data-plan-period/);assert.match(plan,/Planning horizon/)});

test('Plan keeps capacity arithmetic factual and non-moralized',()=>{assert.match(plan,/Capacity is arithmetic, not a productivity score\./);assert.match(plan,/Plan describes intended time/);assert.match(plan,/Nothing on this screen becomes factual Progress automatically/);assert.match(plan,/unfinished intentions do not become debt/);assert.doesNotMatch(plan,/productivity score|streak|points|level up/i)});

test('Plan shows relationships instead of disconnected metric cards',()=>{assert.match(plan,/planned_goal_minutes/);assert.match(plan,/flexible_minutes/);assert.match(plan,/committed_minutes/);assert.match(plan,/overcommitted_minutes/);assert.match(plan,/plan-capacity-bar/);assert.match(plan,/planned from/);assert.match(plan,/after recurring commitments/)});

test('Plan renders real Goal allocation and recurring commitments without claiming completion',()=>{assert.match(plan,/Planned Goal time/);assert.match(plan,/period_target_minutes/);assert.match(plan,/period_minimum_minutes/);assert.match(plan,/Recurring commitments/);assert.match(plan,/Targets are planned attention, not completed Progress\./)});

test('Plan has responsive styling and reduced-motion protection',()=>{assert.match(css,/\.plan-grid/);assert.match(css,/@media\(max-width:900px\)/);assert.match(css,/@media\(max-width:620px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)});
