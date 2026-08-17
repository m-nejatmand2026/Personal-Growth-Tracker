import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app=await readFile(new URL('../public/experience/2/js/app.js',import.meta.url),'utf8');
const logger=await readFile(new URL('../public/experience/2/js/views/logger.js',import.meta.url),'utf8');
const activities=await readFile(new URL('../public/experience/2/js/capabilities/activities.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/logger.css',import.meta.url),'utf8');
const shellCss=await readFile(new URL('../public/experience/2/css/shell.css',import.meta.url),'utf8');
const index=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/experience/2/sw.js',import.meta.url),'utf8');
const browserRunner=await readFile(new URL('../scripts/run-browser-e2e.sh',import.meta.url),'utf8');
const browserTest=await readFile(new URL('./browser/experience2-logger.browser.js',import.meta.url),'utf8');

test('Experience 2 global Add opens a real Logger and defaults to factual Done',()=>{
  assert.match(app,/import\{createLogger\}from'\.\/views\/logger\.js'/);
  assert.match(app,/logger\.open\(\{entryMode:'done'\}\)/);
  assert.doesNotMatch(app,/Logger follows the real Today \+ Capacity foundation/);
  assert.equal((index.match(/data-open-add/g)||[]).length,2);
  assert.match(index,/class="rail-add" data-open-add aria-label="Add activity"/);
  assert.match(index,/class="dock-add" data-open-add aria-label="Add activity"/);
  assert.match(shellCss,/\.rail-add\{[^}]*min-height:48px/s);
});

test('Experience 2 Logger keeps Plan and Start now out of factual Progress',()=>{
  assert.match(logger,/>Done</);
  assert.match(logger,/>Plan</);
  assert.match(logger,/>Start now</);
  assert.match(logger,/Plan adds an intention to your day — not Progress/);
  assert.match(logger,/Progress waits until Done/);
  assert.match(logger,/if\(entryMode==='planned'\|\|entryMode==='in_progress'\)\{await api\.post\('\/v1\/daily-plan'/);
  const branch=logger.indexOf("if(entryMode==='planned'||entryMode==='in_progress')");
  const progress=logger.indexOf("api.post('/v1/progress'",branch);
  assert.ok(branch>=0&&progress>branch);
  const between=logger.slice(branch,progress);
  assert.doesNotMatch(between,/\/v1\/progress/);
  assert.match(logger,/Start now must use Today/);
});

test('Experience 2 Logger reaches Activities and Goals only through its Activities capability boundary',()=>{
  assert.match(logger,/activitiesCapability\.list\(\)/);
  assert.match(logger,/activitiesCapability\.creationContext\(\)/);
  assert.match(logger,/activitiesCapability\.create\(/);
  assert.doesNotMatch(logger,/\/v1\/activities/);
  assert.doesNotMatch(logger,/\/v1\/goals/);
  assert.match(activities,/api\.get\('\/v1\/goals'\)/);
  assert.match(activities,/api\.get\(`\/v1\/activities/);
  assert.match(activities,/api\.post\('\/v1\/activities'/);
});

test('Experience 2 Logger provides the complete everyday input path',()=>{
  const render=logger.slice(logger.indexOf('host.innerHTML=`<div class="logger-backdrop"'));
  const activity=render.indexOf('id="loggerActivityQuery"');
  const recent=render.indexOf('id="loggerRecent"');
  const duration=render.indexOf('id="loggerDuration"');
  const when=render.indexOf('data-plan-only');
  const details=render.indexOf('class="logger-more"');
  const save=render.indexOf('id="loggerSave"');
  assert.ok(activity>=0&&activity<recent&&recent<duration&&duration<when&&when<details&&details<save);
  assert.match(logger,/const PRESETS=\[15,30,45,60\]/);
  assert.match(logger,/Search or type an activity/);
  assert.match(logger,/What does this support\?/);
  assert.match(logger,/Focus \/ variation/);
  assert.match(logger,/recentRepeats/);
});

test('Experience 2 Logger modal is accessible and phone-first',()=>{
  assert.match(logger,/role="dialog" aria-modal="true" aria-labelledby="loggerTitle"/);
  assert.match(logger,/event\.key==='Escape'/);
  assert.match(logger,/event\.key!=='Tab'/);
  assert.match(logger,/opener\?\.focus/);
  assert.match(css,/@media\(max-width:720px\)\{\.logger-panel\{inset:0/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/\.logger-close\{width:48px;height:48px/);
  assert.match(css,/\.logger-save\{min-height:54px/);
});

test('Experience 2 Logger remains physically independent from frozen Experience 1',()=>{
  assert.doesNotMatch(logger,/experience\/1|\.\.\/\.\.\/\.\.\/js\/modules\/logger/);
  assert.doesNotMatch(activities,/experience\/1|public\/js/);
  assert.match(index,/\/experience\/2\/css\/logger\.css/);
});

test('Experience 2 PWA precaches the complete Logger dependency chain',()=>{
  assert.match(sw,/growth-compass-preview2-e2-v3/);
  for(const asset of ['/experience/2/css/logger.css','/experience/2/js/views/logger.js','/experience/2/js/capabilities/activities.js'])assert.ok(sw.includes(`'${asset}'`),`${asset} must be precached`);
});

test('release-blocking browser acceptance exercises Experience 2 Logger on desktop and 375px Chromium/WebKit',()=>{
  assert.match(browserRunner,/GC_E2E_BASE_URL=http:\/\/127\.0\.0\.1:8787\/experience\/2\/ node --test tests\/browser\/experience2-logger\.browser\.js/);
  assert.match(browserTest,/BROWSERS=\[\['Chromium',chromium\],\['WebKit',webkit\]\]/);
  assert.match(browserTest,/desktop accepts Experience 2 Logger/);
  assert.match(browserTest,/375px accepts Experience 2 Logger/);
  assert.match(browserTest,/global Add must default to factual Done/);
  assert.match(browserTest,/closing Logger must restore focus to Add/);
});
