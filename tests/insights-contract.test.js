import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';

async function exists(url){try{await access(url);return true}catch{return false}}
const ui=await readFile(new URL('../public/js/modules/insights/ui.js',import.meta.url),'utf8');
const manifest=await readFile(new URL('../public/js/modules/insights/manifest.js',import.meta.url),'utf8');

test('Insights is a registered frontend capability depending on Progress and Wellbeing',()=>{const registry=createFrontendModuleRegistry(frontendModules);const module=registry.get('insights');assert.ok(module);assert.deepEqual(module.dependsOn,['progress','wellbeing']);assert.match(manifest,/from '.\/ui\.js'/)});
test('Insights reads only Version 1 Progress and Wellbeing APIs',()=>{assert.match(ui,/\/api\/v1\/progress/);assert.match(ui,/\/api\/v1\/wellbeing\/energy/);assert.doesNotMatch(ui,/\/api\/history|\/api\/session|energy_logs|progress_records/)});
test('Insights keeps evidence thresholds, sample visibility and association-only language',()=>{for(const threshold of ['0–6','7–20','21–41','42+'])assert.match(ui,new RegExp(threshold.replace('+','\\+')));assert.match(ui,/does not prove cause/);assert.match(ui,/association/i);assert.match(ui,/tracked \$\{trackedDays === 1 \? 'day' : 'days'\}/);assert.match(ui,/progress records/);assert.match(ui,/energy check-ins/);assert.doesNotMatch(ui,/causes higher|causes lower|because of sleep/i)});
test('Shared Insights feature implementation is removed',async()=>{assert.equal(await exists(new URL('../public/js/features/insights.js',import.meta.url)),false)});
test('Disabling an Insights dependency disables Insights but not independent capabilities',()=>{const registry=createFrontendModuleRegistry(frontendModules);for(const overrides of [{progress:false},{wellbeing:false}]){const ids=registry.enabled(overrides).map(module=>module.id);assert.equal(ids.includes('insights'),false);assert.equal(ids.includes('daily-plan'),true);assert.equal(ids.includes('journal'),true)}});
