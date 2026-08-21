import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderToday, todayStage } from '../public/experience/2/js/views/today.js';

const source=await readFile(new URL('../public/experience/2/js/views/today.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/experience/2/css/today-first-run.css',import.meta.url),'utf8');
const empty={date:'2026-08-21',tomorrow:'2026-08-22',today:[],tomorrowItems:[],summary:{progress:[],direction:[]},goals:[],goalsKnown:true};

test('brand-new Experience 2 Today presents a growth system instead of an empty mature dashboard',()=>{const html=renderToday(empty);assert.equal(todayStage(empty),'welcome');assert.match(html,/Welcome to Growth Compass/);assert.match(html,/Build a compass for the life you want to grow\./);assert.match(html,/Create my compass/);assert.match(html,/Direction/);assert.match(html,/Plan/);assert.match(html,/Action/);assert.match(html,/Progress/);assert.match(html,/about 90 seconds/);assert.match(html,/Start with one area/);assert.doesNotMatch(html,/Nothing running|No other plans yet|Nothing planned yet|No duration|Nothing recorded yet/);});

test('returning users with existing goals do not get trapped in first-run onboarding',()=>{const model={...empty,goals:[{id:1,name:'Learn German',status:'active'}]};const html=renderToday(model);assert.equal(todayStage(model),'operational');assert.match(html,/Your day is open/);assert.doesNotMatch(html,/Build a compass for the life you want to grow|2 of 4/);});

test('archived goal history is included when deciding whether an account is genuinely brand-new',()=>{const model={...empty,goals:[{id:1,name:'Past direction',status:'archived'}]};assert.equal(todayStage(model),'operational');assert.match(source,/\/v1\/goals\?include_archived=1/);});

test('real daily-plan data keeps the operational Today dashboard and progressive sections',()=>{const model={...empty,goals:[],today:[{id:4,title:'Deep work',status:'planned',planned_for:'2026-08-21',planned_minutes:45}]};const html=renderToday(model);assert.equal(todayStage(model),'operational');assert.match(html,/Your day/);assert.match(html,/Deep work/);assert.doesNotMatch(html,/Build a compass for the life you want to grow/);assert.doesNotMatch(html,/<p class="eyebrow">Now<\/p>/);assert.doesNotMatch(html,/Factual progress today/);});

test('first-run setup starts with a life area and creates real Goal data without premature measurement administration',()=>{assert.match(source,/data-today-build-compass/);assert.match(source,/Where do you want to grow first\?/);for(const area of ['Career','Health','Learning','Finance','Relationships','Personal Growth','Something else'])assert.match(source,new RegExp(area));assert.match(source,/goalsCapability\.createArea\(\{name:areaName,template_key:null,sort_order:100\}\)/);assert.match(source,/goalsCapability\.create\(payload\)/);assert.match(source,/measurement_type:'milestone'/);assert.match(source,/target_period:'none'/);assert.doesNotMatch(source,/name="todayFirstGoalMeasure"/);assert.match(source,/firstRunContinuation='plan'/);assert.match(source,/firstRunContinuation='';navigateTo\('plan'\)/);assert.match(source,/Your compass has started\./);assert.match(source,/Plan my first step/);assert.match(source,/loadGoalSignal/);assert.match(source,/catch\{return \{known:false,goals:\[\]\};\}/);assert.match(css,/\.today-first-area-grid/);assert.match(css,/\.today-created-direction/);assert.match(css,/repeat\(4,minmax\(0,1fr\)\)/);});
