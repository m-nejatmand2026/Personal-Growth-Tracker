import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderToday, todayStage } from '../public/experience/2/js/views/today.js';

const source=await readFile(new URL('../public/experience/2/js/views/today.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/today.css',import.meta.url),'utf8');
const empty={date:'2026-08-21',tomorrow:'2026-08-22',today:[],tomorrowItems:[],summary:{progress:[],direction:[]},goals:[],goalsKnown:true};

test('brand-new Experience 2 Today is a guided first-run state rather than an empty mature dashboard',()=>{const html=renderToday(empty);assert.equal(todayStage(empty),'welcome');assert.match(html,/Welcome to Growth Compass/);assert.match(html,/Build my compass/);assert.match(html,/Direction/);assert.match(html,/Plan/);assert.match(html,/Progress/);assert.match(html,/About 2 minutes/);assert.doesNotMatch(html,/Nothing running|No other plans yet|Nothing planned yet|No duration|Nothing recorded yet/);});

test('first direction advances Today to planning guidance without exposing empty operational widgets',()=>{const model={...empty,goals:[{id:1,name:'Learn German',status:'active'}]};const html=renderToday(model);assert.equal(todayStage(model),'plan');assert.match(html,/Turn direction into a workable plan/);assert.match(html,/Plan what matters/);assert.match(html,/Learn German/);assert.doesNotMatch(html,/Nothing running|No other plans yet|No duration/);});

test('real daily-plan data keeps the operational Today dashboard and progressive sections',()=>{const model={...empty,goals:[],today:[{id:4,title:'Deep work',status:'planned',planned_for:'2026-08-21',planned_minutes:45}]};const html=renderToday(model);assert.equal(todayStage(model),'operational');assert.match(html,/Your day/);assert.match(html,/Deep work/);assert.doesNotMatch(html,/Welcome to Growth Compass/);assert.doesNotMatch(html,/<p class="eyebrow">Now<\/p>/);assert.doesNotMatch(html,/Factual progress today/);});

test('first-run quick goal setup reuses the Goals capability and keeps optional complexity deferred',()=>{assert.match(source,/goalsCapability\.create\(payload\)/);assert.match(source,/data-today-build-compass/);assert.match(source,/How Growth Compass works/);assert.match(source,/No target is required/);assert.match(source,/loadGoalSignal/);assert.match(source,/catch\{return \{known:false,goals:\[\]\};\}/);assert.match(css,/\.today-onboarding/);assert.match(css,/\.today-first-goal-measure/);});
