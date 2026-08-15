import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { normalizeDayContextInput, normalizeEnergyInput, normalizeSleepInput } from '../worker/modules/wellbeing/domain.js';

async function exists(url){try{await access(url);return true}catch{return false}}
const data=await readFile(new URL('../worker/modules/wellbeing/data.js',import.meta.url),'utf8');
const publicContract=await readFile(new URL('../worker/modules/wellbeing/public.js',import.meta.url),'utf8');
const routes=await readFile(new URL('../worker/modules/wellbeing/routes.js',import.meta.url),'utf8');
const frontendWellbeing=await readFile(new URL('../public/js/modules/wellbeing/module.js',import.meta.url),'utf8');
const migration=await readFile(new URL('../migrations/0007_wellbeing_energy.sql',import.meta.url),'utf8');
const legacyEnergyRoute=await readFile(new URL('../worker/routes/energy.js',import.meta.url),'utf8');
const historyRoute=await readFile(new URL('../worker/routes/history.js',import.meta.url),'utf8');
const bootstrap=await readFile(new URL('../worker/compatibility/legacy-beta/bootstrap.js',import.meta.url),'utf8');
const todayPublic=await readFile(new URL('../worker/modules/today/public.js',import.meta.url),'utf8');
const today=await readFile(new URL('../public/js/features/today.js',import.meta.url),'utf8');
const settings=await readFile(new URL('../public/js/features/settings.js',import.meta.url),'utf8');
const targetsRoute=await readFile(new URL('../worker/routes/targets.js',import.meta.url),'utf8');

test('Wellbeing owns only profile-scoped Version 1 observation tables at runtime',()=>{const module=createModuleRegistry(platformModules).get('wellbeing');assert.ok(module);assert.deepEqual(module.dependsOn,[]);assert.deepEqual(module.ownsTables,['energy_logs_v1','sleep_logs_v1','day_context_logs_v1']);assert.deepEqual(module.compatibilityTables,[]);assert.deepEqual(module.publishes,['wellbeing.energy-recorded','wellbeing.sleep-recorded','wellbeing.context-recorded'])});
test('Wellbeing energy migration is additive and preserves legacy observations',()=>{assert.match(migration,/Module-Owner:\s*wellbeing/i);assert.match(migration,/Compatibility-Tables:\s*energy_logs/i);assert.match(migration,/CREATE TABLE IF NOT EXISTS energy_logs_v1/i);assert.match(migration,/INSERT OR IGNORE INTO energy_logs_v1/i);assert.match(migration,/FROM energy_logs/i);assert.doesNotMatch(migration,/DROP TABLE|DELETE FROM energy_logs/i)});
test('Wellbeing persistence is isolated to owned observation tables',()=>{for(const table of ['energy_logs_v1','sleep_logs_v1','day_context_logs_v1'])assert.match(data,new RegExp(`\\b${table}\\b`));assert.doesNotMatch(data,/\bFROM\s+energy_logs\b|\bFROM\s+goals\b|\bFROM\s+progress_records\b|\bFROM\s+sessions\b/i)});
test('Wellbeing public contract is SQL-free',()=>{assert.match(publicContract,/wellbeingContractV1/);assert.match(publicContract,/exportWellbeingV1/);assert.doesNotMatch(publicContract,/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i)});
test('Wellbeing exposes validated canonical writes for every observation type',()=>{for(const method of ['recordEnergy','recordSleep','recordDayContext']){assert.match(publicContract,new RegExp(`\\b${method}\\b`));assert.match(frontendWellbeing,new RegExp(`\\b${method}\\b`))}for(const route of ['recordEnergyRoute','recordSleepRoute','recordDayContextRoute'])assert.match(routes,new RegExp(`\\b${route}\\b`))});
test('Wellbeing input contracts accept valid observations and reject invalid ones',()=>{assert.ok(normalizeEnergyInput({occurred_on:'2026-08-14',label:'Calm',row_idx:2,col_idx:4,energy_score:1,valence_score:2}).value);assert.ok(normalizeEnergyInput({occurred_on:'invalid'}).error);assert.ok(normalizeSleepInput({occurred_on:'2026-08-14',bedtime:'23:15',wake_time:'07:00',minutes:465,quality:4}).value);assert.ok(normalizeSleepInput({occurred_on:'2026-08-14',bedtime:'25:00',minutes:480}).error);assert.ok(normalizeDayContextInput({occurred_on:'2026-08-14',context_key:'travel'}).value);assert.ok(normalizeDayContextInput({occurred_on:'2026-08-14',context_key:'founder-specific'}).error)});
test('Legacy energy endpoint forwards writes to Wellbeing V1 only',()=>{assert.match(legacyEnergyRoute,/wellbeingContractV1/);assert.match(legacyEnergyRoute,/recordEnergy/);assert.doesNotMatch(legacyEnergyRoute,/INSERT\s+INTO\s+energy_logs\b/i)});
test('History and bootstrap consume Wellbeing through its public contract',()=>{assert.match(historyRoute,/wellbeingContractV1/);assert.match(bootstrap,/wellbeingContractV1/);assert.doesNotMatch(historyRoute,/FROM\s+energy_logs/i);assert.doesNotMatch(bootstrap,/FROM\s+energy_logs/i)});
test('Runtime weekly direction comes from Plans and Progress rather than legacy targets',async()=>{assert.match(todayPublic,/plansContractV1/);assert.match(todayPublic,/progressContractV1/);assert.doesNotMatch(todayPublic,/weekly_targets|getTargets/);assert.doesNotMatch(bootstrap,/getTargets|momente_lessons|roadmap_items/);assert.equal(await exists(new URL('../worker/data/targets.js',import.meta.url)),false)});
test('Today contains no founder-specific fixed schedule ontology',async()=>{assert.doesNotMatch(today,/config\/schedule|\bTASKS\b/);assert.doesNotMatch(today,/calisthen|german|guitar|reading|Momente|catch-up/i);assert.equal(await exists(new URL('../public/js/config/schedule.js',import.meta.url)),false)});
test('Legacy target mutation is retired and Settings points planning back to Plan',()=>{assert.match(targetsRoute,/410/);assert.doesNotMatch(targetsRoute,/weekly_targets|UPDATE\s+weekly_targets/i);assert.doesNotMatch(settings,/\/api\/targets|data-target=|data-minimum=/);assert.match(settings,/planning belongs in Plan/i);assert.match(settings,/live in Plan/i)});
