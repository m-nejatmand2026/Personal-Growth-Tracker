import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';

async function exists(url){try{await access(url);return true}catch{return false}}
const worker=createModuleRegistry(platformModules).get('journal');
const frontend=createFrontendModuleRegistry(frontendModules).get('journal');

test('Journal is an independent root capability',()=>{assert.ok(worker);assert.ok(frontend);assert.deepEqual(worker.dependsOn,[]);assert.deepEqual(frontend.dependsOn,[]);assert.deepEqual(worker.ownsTables,['journal_entries']);assert.deepEqual(worker.compatibilityTables,[])});

test('Journal owns persistence domain routes and public contract',async()=>{for(const path of ['../worker/data/journal.js','../worker/domain/journal.js','../worker/routes/journal.js'])assert.equal(await exists(new URL(path,import.meta.url)),false);for(const path of ['../worker/modules/journal/data.js','../worker/modules/journal/domain.js','../worker/modules/journal/routes.js','../worker/modules/journal/public.js'])assert.equal(await exists(new URL(path,import.meta.url)),true)});

test('Journal persistence accesses journal_entries only',async()=>{const source=await readFile(new URL('../worker/modules/journal/data.js',import.meta.url),'utf8');assert.match(source,/\bjournal_entries\b/);assert.doesNotMatch(source,/\bprogress_records\b|\bsessions\b|\bgoals\b|\bgoal_activities\b/)});

test('Journal public contract remains SQL-free',async()=>{const source=await readFile(new URL('../worker/modules/journal/public.js',import.meta.url),'utf8');assert.match(source,/journalContractV1/);assert.match(source,/exportJournalV1/);assert.doesNotMatch(source,/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i)});

test('Journal frontend stays isolated from Progress Insights AI and private modules',async()=>{const source=await readFile(new URL('../public/js/modules/journal/module.js',import.meta.url),'utf8');assert.doesNotMatch(source,/modules\/(?:goals|activities|plans|capacity|daily-plan)/);assert.doesNotMatch(source,/features\/(?:progress|insights|logger)/);assert.match(source,/not used by Progress, Insights or AI/)});

test('Journal preview publishes a selected fact and shell chooses navigation',async()=>{const source=await readFile(new URL('../public/js/modules/journal/module.js',import.meta.url),'utf8');const app=await readFile(new URL('../public/js/app.js',import.meta.url),'utf8');assert.match(source,/journal\.preview-selected/);assert.match(source,/events\?\.publish/);assert.doesNotMatch(source,/journal\.view-requested|openView/);assert.match(app,/eventBus\.subscribe\(\s*['"]journal\.preview-selected['"]/s)});

test('Disabling Journal leaves every unrelated capability available',()=>{const ids=createModuleRegistry(platformModules).enabled({journal:false}).map(module=>module.id);assert.equal(ids.includes('journal'),false);for(const id of ['areas','goals','activities','plans','capacity','daily-plan'])assert.equal(ids.includes(id),true)});
