import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';
import { legacyBetaRoutes } from '../worker/router.js';

async function exists(url){try{await access(url);return true}catch{return false}}

test('generic Area Goal Activity Progress dependency chain is explicit and removable',()=>{
  const worker=createModuleRegistry(platformModules);
  const frontend=createFrontendModuleRegistry(frontendModules);
  assert.deepEqual(worker.get('goals').dependsOn,['areas']);
  assert.deepEqual(worker.get('activities').dependsOn,['goals']);
  assert.deepEqual(worker.get('progress').dependsOn,['activities']);
  const workerIds=worker.enabled({areas:false}).map(m=>m.id);
  const frontendIds=frontend.enabled({areas:false}).map(m=>m.id);
  for(const id of ['goals','activities','progress']){assert.equal(workerIds.includes(id),false);assert.equal(frontendIds.includes(id),false)}
  for(const id of ['daily-plan','journal','wellbeing']) assert.equal(workerIds.includes(id),true);
});

test('legacy Beta routes are a finite classified surface with a public-launch sunset',()=>{
  const expected=['GET:/api/bootstrap','GET:/api/history','GET:/api/week','POST:/api/energy','POST:/api/roadmap','POST:/api/session','PUT:/api/momente','PUT:/api/roadmap/*','PUT:/api/targets','DELETE:/api/session'].sort();
  const actual=legacyBetaRoutes.map(route=>`${route.method}:${route.path||`${route.prefix}*`}`).sort();
  assert.deepEqual(actual,expected);
  for(const route of legacyBetaRoutes){assert.ok(['read-model','forwarder','retired'].includes(route.classification));assert.equal(route.sunset,'before-public-launch')}
});

test('primary runtime has no shared Logger Insights or Energy implementations',async()=>{
  for(const path of ['../public/js/features/logger.js','../public/js/features/insights.js','../public/js/config/energy.js']) assert.equal(await exists(new URL(path,import.meta.url)),false);
  const app=await readFile(new URL('../public/js/app.js',import.meta.url),'utf8');
  assert.match(app,/moduleRegistry\.get\('logger'\)/);assert.match(app,/moduleRegistry\.get\('insights'\)/);
  assert.doesNotMatch(app,/features\/logger|features\/insights|onIntent|dailyPlanId|growth-compass:/);
});

test('Today contains composition only for Capacity Progress and Wellbeing',async()=>{
  const today=await readFile(new URL('../public/js/features/today.js',import.meta.url),'utf8');
  assert.match(today,/createFrontendModuleRegistry/);assert.match(today,/\.get\('capacity'\)/);assert.match(today,/\.get\('progress'\)/);assert.match(today,/\.get\('wellbeing'\)/);
  assert.doesNotMatch(today,/\/api\/v1\/capacity|\/api\/energy|config\/energy|\bENERGY\b|calisthen|german|guitar|reading|Momente/i);
});
