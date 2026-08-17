import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app=await readFile(new URL('../public/experience/2/js/app.js',import.meta.url),'utf8');
const view=await readFile(new URL('../public/experience/2/js/views/goals.js',import.meta.url),'utf8');
const goals=await readFile(new URL('../public/experience/2/js/capabilities/goals.js',import.meta.url),'utf8');
const areas=await readFile(new URL('../public/experience/2/js/capabilities/areas.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/goals.css',import.meta.url),'utf8');
const shellCss=await readFile(new URL('../public/experience/2/css/shell.css',import.meta.url),'utf8');
const index=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');

test('Experience 2 Goals replaces the placeholder with canonical Goals and Areas data',()=>{
  assert.match(app,/loadGoals,renderGoals,bindGoals/);
  assert.match(app,/current==='goals'/);
  assert.match(goals,/api\.get\('\/v1\/goals'\)/);
  assert.match(goals,/areasCapability\.list\(\)/);
  assert.doesNotMatch(view,/renderFoundation\('goals'/);
});

test('Experience 2 Goals preserves recursive modularity through the Areas capability',()=>{
  assert.match(goals,/dependsOn:Object\.freeze\(\['areas'\]\)/);
  assert.match(goals,/createArea\(input\)\{return areasCapability\.create\(input\);\}/);
  assert.doesNotMatch(view,/\/v1\/areas|\/v1\/goals/);
  assert.match(areas,/api\.post\('\/v1\/areas'/);
  assert.match(areas,/api\.put\(areaPath\(id\),input\)/);
});

test('Experience 2 Goal editor uses human progress choices and optional guidance without debt language',()=>{
  for(const label of ['Time spent','Quantity','Completed','Milestones'])assert.match(view,new RegExp(label));
  assert.match(view,/Optional target/);
  assert.match(view,/Good-enough minimum/);
  assert.match(view,/Targets are guidance, not debt/);
  assert.match(view,/Progress remains factual evidence/);
  assert.match(view,/daily:'day',weekly:'week',monthly:'month',yearly:'year'/);
  assert.doesNotMatch(view,/replace\('ly',''\)/);
  assert.doesNotMatch(view,/catch.?up|overdue|streak debt/i);
});

test('Experience 2 Goal editor never writes Progress and keeps contextual Life Area creation behind Goals capability',()=>{
  assert.doesNotMatch(view,/\/v1\/progress|api\.post|api\.put|api\.delete/);
  assert.match(view,/goalsCapability\.createArea/);
  assert.match(view,/goalsCapability\.create\(payload\)/);
  assert.match(view,/goalsCapability\.update\(goal\.id,payload\)/);
  assert.match(view,/goalsCapability\.archive\(goal\.id\)/);
});

test('Experience 2 Goal editor is responsive and keyboard-modal safe',()=>{
  assert.match(view,/role="dialog" aria-modal="true" aria-labelledby="goalEditorTitle"/);
  assert.match(view,/event\.key==='Escape'/);
  assert.match(view,/event\.key!=='Tab'/);
  assert.match(view,/host\.onkeydown=trap/);
  assert.match(view,/host\.onkeydown=null/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/\.goal-editor-close\{width:48px;height:48px/);
});

test('Experience 2 mobile shell exposes Goals through a real secondary navigation path',()=>{
  assert.match(index,/class="mobile-secondary" aria-label="More destinations"/);
  assert.match(index,/mobile-secondary[\s\S]*data-view="goals"/);
  assert.match(shellCss,/@media\(max-width:900px\)[\s\S]*\.mobile-secondary\{display:flex/);
  assert.match(shellCss,/\.mobile-secondary \.nav-item\{[^}]*min-height:40px/s);
});

test('Experience 2 PWA precaches Goals, Areas and presentation assets in a new isolated cache version',()=>{
  assert.match(sw,/growth-compass-preview2-e2-v4/);
  for(const asset of ['/experience/2/css/goals.css','/experience/2/js/views/goals.js','/experience/2/js/capabilities/goals.js','/experience/2/js/capabilities/areas.js'])assert.ok(sw.includes(`'${asset}'`),`${asset} must be precached`);
  assert.doesNotMatch(sw,/growth-compass-preview1|experience\/1/);
});
