import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app=await readFile(new URL('../public/experience/2/js/app.js',import.meta.url),'utf8');
const today=await readFile(new URL('../public/experience/2/js/views/today.js',import.meta.url),'utf8');
const api=await readFile(new URL('../public/experience/2/js/core/api.js',import.meta.url),'utf8');
const index=await readFile(new URL('../public/experience/2/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/today.css',import.meta.url),'utf8');
const browserRunner=await readFile(new URL('../scripts/run-browser-e2e.sh',import.meta.url),'utf8');
const browserTest=await readFile(new URL('./browser/experience2-today.browser.js',import.meta.url),'utf8');

const experience2=`${app}\n${today}\n${api}\n${index}\n${css}`;

test('Experience 2 Today replaces the placeholder with real isolated backend composition',()=>{
  assert.match(app,/loadToday/);
  assert.match(app,/renderToday/);
  assert.match(today,/\/v1\/daily-plan\?date=/);
  assert.match(today,/\/v1\/today\?date=/);
  assert.match(today,/Daily Plan · intention/);
  assert.match(today,/Factual progress today/);
  assert.match(today,/Direction · this week/);
  assert.doesNotMatch(today,/Today foundation/);
});

test('Experience 2 Today preserves Plan versus Progress semantics',()=>{
  assert.match(today,/Plan is intention\. Progress is fact\./);
  assert.match(today,/Completing an Activity asks for the factual measurement before Progress is written/);
  assert.match(today,/What actually happened\?/);
  assert.match(today,/Record factual Progress/);
  const progressWrite=today.indexOf("await api.post('/v1/progress'");
  assert.notEqual(progressWrite,-1);
  const linkedCompletion=today.slice(progressWrite);
  assert.match(linkedCompletion,/await api\.put\(`\/v1\/daily-plan\/\$\{item\.id\}`\s*,\s*\{status:'completed'\}\)/);
  assert.ok(linkedCompletion.indexOf("await api.post('/v1/progress'") < linkedCompletion.indexOf("await api.put(`/v1/daily-plan/${item.id}`,{status:'completed'})"),'linked Activity must record factual Progress before closing its plan item');
});

test('Experience 2 Today supports direct Start Done and Plans changed recovery without rollover',()=>{
  assert.match(today,/data-today-start/);
  assert.match(today,/data-today-done/);
  assert.match(today,/Plans changed\?/);
  assert.match(today,/Adjust without creating debt/);
  assert.match(today,/Nothing moves automatically/);
  assert.match(today,/Dropped without creating Progress/);
  assert.match(today,/status:'in_progress'/);
  assert.match(today,/status:'dismissed'/);
  assert.doesNotMatch(today,/rollover|carry.?over/i);
});

test('Experience 2 Today never hides legal additional in-progress intentions',()=>{
  assert.match(today,/const activeItems=model\.today\.filter\(item=>item\.status==='in_progress'\)/);
  assert.match(today,/const \[active,\.\.\.additional\]=activeItems/);
  assert.match(today,/Also in progress/);
  assert.match(today,/additional\.map\(item=>itemHtml\(item\)\)/);
  assert.match(css,/\.today-now-also\{/);
  assert.match(browserRunner,/tests\/browser\/experience2-today\.browser\.js/);
  assert.match(browserTest,/additional running intentions must stay visible/);
  assert.match(browserTest,/width:375,height:812/);
  assert.match(browserTest,/\['Chromium',chromium\],\['WebKit',webkit\]/);
});

test('Experience 2 frontend stays physically independent from Experience 1/current frontend',()=>{
  assert.doesNotMatch(experience2,/from ['"]\.\.\/\.\.\/\.\.\/js\//);
  assert.doesNotMatch(experience2,/\/experience\/1\/js\//);
  assert.match(index,/\/experience\/2\/css\/today\.css/);
  assert.match(index,/\/experience\/2\/js\/app\.js/);
});

test('Experience 2 API adapter supports the Today mutation verbs without legacy endpoints',()=>{
  assert.match(api,/put:/);
  assert.match(api,/delete:/);
  assert.doesNotMatch(experience2,/\/api\/session|\/api\/history|\/api\/goals(?!\/)/);
});

test('Experience 2 Today has responsive product styling and keyboard-safe modal structure',()=>{
  assert.match(css,/\.today-grid/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(today,/role="dialog" aria-modal="true"/);
  assert.match(today,/aria-labelledby="todayDoneTitle"/);
  assert.match(today,/aria-labelledby="todayChangeTitle"/);
  assert.match(today,/event\.key==='Escape'/);
  assert.match(today,/event\.key!=='Tab'/);
  assert.match(today,/host\.addEventListener\('keydown',keyHandler\)/);
  assert.match(today,/host\.removeEventListener\('keydown',keyHandler\)/);
  assert.match(today,/opener\?\.focus\?\.\(\{preventScroll:true\}\)/);
  assert.match(today,/initialFocus:'#todayDoneMinutes'/);
  assert.match(today,/initialFocus:'\[data-today-keep\]'/);
});
