import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';

test('Activities is an isolated registered Version 1 capability', () => {
  const workerRegistry=createModuleRegistry(platformModules);
  const frontendRegistry=createFrontendModuleRegistry(frontendModules);
  const workerActivity=workerRegistry.get('activities');
  const frontendActivity=frontendRegistry.get('activities');
  assert.ok(workerActivity);assert.ok(frontendActivity);
  assert.deepEqual(workerActivity.dependsOn,['goals']);
  assert.deepEqual(frontendActivity.dependsOn,['goals']);
  assert.deepEqual(workerActivity.ownsTables,['goal_activities']);
  assert.deepEqual(workerActivity.compatibilityTables,[]);
  for(const [method,path] of [['GET','/api/v1/activities'],['POST','/api/v1/activities'],['PUT','/api/v1/activities/42'],['DELETE','/api/v1/activities/42']]) assert.equal(workerRegistry.match(method,path)?.module.id,'activities');
  for(const method of ['list','create','update','archive']) assert.equal(typeof frontendActivity[method],'function');
});

test('Activities crosses Goals only through its public contract', async()=>{
  const data=await readFile(new URL('../worker/modules/activities/data.js',import.meta.url),'utf8');
  const routes=await readFile(new URL('../worker/modules/activities/routes.js',import.meta.url),'utf8');
  const goalsPublic=await readFile(new URL('../worker/modules/goals/public.js',import.meta.url),'utf8');
  assert.doesNotMatch(data,/\b(?:FROM|JOIN)\s+goals\b/i);assert.doesNotMatch(data,/\b(?:FROM|JOIN)\s+areas\b/i);
  assert.match(routes,/goalsContractV1/);assert.doesNotMatch(routes,/data\/goals\.js/);
  assert.match(goalsPublic,/goalsContractV1/);assert.match(goalsPublic,/getReference/);assert.match(goalsPublic,/listReferences/);assert.doesNotMatch(goalsPublic,/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i);
});

test('Activity identity is immutable after creation',async()=>{
  const data=await readFile(new URL('../worker/modules/activities/data.js',import.meta.url),'utf8');
  const updateStatement=data.match(/UPDATE goal_activities[\s\S]*?WHERE id=\? AND profile_id=\?/i)?.[0]||'';
  assert.ok(updateStatement);assert.doesNotMatch(updateStatement,/\bkey\s*=/);
});

test('Activities runtime is canonical and legacy compatibility is migration-only',async()=>{
  const migration=await readFile(new URL('../migrations/0006_activities_contract.sql',import.meta.url),'utf8');
  const data=await readFile(new URL('../worker/modules/activities/data.js',import.meta.url),'utf8');
  assert.match(migration,/goal_activities is the canonical Version 1 Activity model/i);
  assert.match(migration,/legacy activities table remains temporarily/i);
  assert.match(migration,/One-time Beta identity normalization/i);
  assert.match(migration,/INSERT OR IGNORE INTO activities/i);
  assert.doesNotMatch(data,/\b(?:FROM|JOIN|INTO|UPDATE)\s+activities\b/i);
  assert.match(data,/INSERT INTO goal_activities/i);
});
