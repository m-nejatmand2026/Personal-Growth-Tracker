import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';

async function exists(url){try{await access(url);return true}catch{return false}}

const worker=createModuleRegistry(platformModules).get('daily-plan');
const frontend=createFrontendModuleRegistry(frontendModules).get('daily-plan');

test('Daily Plan is an independent root capability',()=>{assert.ok(worker);assert.ok(frontend);assert.deepEqual(worker.dependsOn,[]);assert.deepEqual(frontend.dependsOn,[]);assert.deepEqual(worker.ownsTables,['daily_plan_items']);assert.deepEqual(worker.compatibilityTables,[])});

test('Daily Plan owns backend persistence domain routes and public contract',async()=>{for(const path of ['../worker/data/daily-plan.js','../worker/domain/daily-plan.js','../worker/routes/daily-plan.js'])assert.equal(await exists(new URL(path,import.meta.url)),false);for(const path of ['../worker/modules/daily-plan/data.js','../worker/modules/daily-plan/domain.js','../worker/modules/daily-plan/routes.js','../worker/modules/daily-plan/public.js'])assert.equal(await exists(new URL(path,import.meta.url)),true)});

test('Daily Plan persistence touches only daily_plan_items',async()=>{const source=await readFile(new URL('../worker/modules/daily-plan/data.js',import.meta.url),'utf8');assert.match(source,/daily_plan_items/);assert.doesNotMatch(source,/\bgoal_activities\b|\bprogress_records\b|\bsessions\b|\bgoals\b/)});

test('Daily Plan public contract is narrow and SQL-free',async()=>{const source=await readFile(new URL('../worker/modules/daily-plan/public.js',import.meta.url),'utf8');assert.match(source,/dailyPlanContractV1/);assert.match(source,/getReference/);assert.match(source,/listForDate/);assert.doesNotMatch(source,/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i)});

test('Daily Plan does not depend on Activities Logger or Progress',async()=>{for(const path of ['data.js','domain.js','routes.js','public.js']){const source=await readFile(new URL(`../worker/modules/daily-plan/${path}`,import.meta.url),'utf8');assert.doesNotMatch(source,/modules\/activities|modules\/progress|sessions/)}const source=await readFile(new URL('../public/js/modules/daily-plan/module.js',import.meta.url),'utf8');assert.doesNotMatch(source,/features\/logger|openLogger|modules\/activities/)});

test('Daily Plan completion publishes a selected fact and shell chooses the reaction',async()=>{const source=await readFile(new URL('../public/js/modules/daily-plan/module.js',import.meta.url),'utf8');const app=await readFile(new URL('../public/js/app.js',import.meta.url),'utf8');assert.match(source,/daily-plan\.completion-selected/);assert.match(source,/events\?\.publish/);assert.doesNotMatch(source,/completion-requested|openLogger/);assert.match(app,/eventBus\.subscribe\(\s*['"]daily-plan\.completion-selected['"]/s);assert.match(app,/logger\.open\(input\)/)});

test('Daily Plan activity fields remain optional snapshots not module dependency',async()=>{const source=await readFile(new URL('../worker/modules/daily-plan/domain.js',import.meta.url),'utf8');assert.match(source,/activity_key/);assert.match(source,/activity_label/);assert.doesNotMatch(source,/activity.*required/i);assert.doesNotMatch(source,/activitiesContractV1/)});

test('Disabling Daily Plan does not disable unrelated capabilities',()=>{const ids=createModuleRegistry(platformModules).enabled({'daily-plan':false}).map(module=>module.id);assert.equal(ids.includes('daily-plan'),false);for(const id of ['areas','goals','plans','capacity','journal'])assert.equal(ids.includes(id),true)});
