import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app=await readFile(new URL('../public/experience/2/js/app.js',import.meta.url),'utf8');
const view=await readFile(new URL('../public/experience/2/js/views/activities.js',import.meta.url),'utf8');
const capability=await readFile(new URL('../public/experience/2/js/capabilities/activities.js',import.meta.url),'utf8');
const plan=await readFile(new URL('../public/experience/2/js/views/plan.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/activities.css',import.meta.url),'utf8');
const index=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');

test('Experience 2 Activities is a real canonical management surface',()=>{
  assert.match(app,/loadActivities,renderActivities,bindActivities/);
  assert.match(app,/current==='activities'/);
  assert.match(view,/activitiesCapability\.list\(\)/);
  assert.match(view,/activitiesCapability\.creationContext\(\)/);
  assert.match(capability,/api\.get\(`?\/v1\/activities/);
  assert.doesNotMatch(view,/renderFoundation|\/v1\/activities|\bapi\./);
});

test('Experience 2 Activities keeps writes behind its public capability',()=>{
  assert.match(view,/activitiesCapability\.create\(payload\)/);
  assert.match(view,/activitiesCapability\.update\(item\.id,payload\)/);
  assert.match(view,/activitiesCapability\.archive\(item\.id\)/);
  assert.match(capability,/api\.post\('\/v1\/activities',input\)/);
  assert.match(capability,/api\.put\(activityPath\(id\),input\)/);
  assert.match(capability,/api\.delete\(activityPath\(id\)\)/);
  assert.doesNotMatch(view,/progressCapability|\/v1\/progress/);
});

test('Activity management preserves Plan versus factual Progress semantics',()=>{
  assert.match(view,/planning structure, not evidence of completion/i);
  assert.match(view,/Existing factual Progress records are not rewritten/);
  assert.match(view,/Existing factual Progress remains unchanged/);
  assert.doesNotMatch(view,/mark complete|completed automatically|catch.?up|streak debt/i);
});

test('Activities editor and archive confirmation are keyboard-modal safe',()=>{
  assert.match(view,/role="dialog" aria-modal="true" aria-labelledby="activityEditorTitle"/);
  assert.match(view,/role="dialog" aria-modal="true" aria-labelledby="activityArchiveTitle"/);
  assert.match(view,/event\.key==='Escape'/);
  assert.match(view,/event\.key!=='Tab'/);
  assert.match(view,/previousFocus\?\.focus/);
  assert.doesNotMatch(view,/window\.confirm|confirm\(/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/\.activity-editor-close\{width:48px;height:48px/);
});

test('Plan and shell expose Activities without changing the five-item mobile dock',()=>{
  assert.match(plan,/data-plan-open="activities"/);
  assert.match(plan,/navigate\?\.\(button\.dataset\.planOpen\)/);
  assert.match(index,/desktop-rail[\s\S]*data-view="activities"/);
  assert.match(index,/mobile-secondary[\s\S]*data-view="activities"/);
  const dock=index.match(/<nav class="mobile-dock"[\s\S]*?<\/nav>/)?.[0]||'';
  assert.equal((dock.match(/data-view=/g)||[]).length,4);
  assert.equal((dock.match(/data-open-add/g)||[]).length,1);
  assert.doesNotMatch(dock,/data-view="activities"/);
});

test('Experience 2 PWA precaches Activities in its isolated refreshed cache',()=>{
  assert.match(sw,/growth-compass-preview2-e2-v11/);
  for(const asset of ['/experience/2/css/activities.css','/experience/2/js/views/activities.js','/experience/2/js/capabilities/activities.js'])assert.ok(sw.includes(`'${asset}'`),`${asset} must be precached`);
  assert.doesNotMatch(sw,/growth-compass-preview1|experience\/1/);
});
