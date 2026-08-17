import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';

async function exists(url) {
  try { await access(url); return true; } catch { return false; }
}

const data = await readFile(new URL('../worker/modules/progress/data.js', import.meta.url), 'utf8');
const publicContract = await readFile(new URL('../worker/modules/progress/public.js', import.meta.url), 'utf8');
const routes = await readFile(new URL('../worker/modules/progress/routes.js', import.meta.url), 'utf8');
const activitiesPublic = await readFile(new URL('../worker/modules/activities/public.js', import.meta.url), 'utf8');
const activitiesFrontend = await readFile(new URL('../public/js/modules/activities/module.js', import.meta.url), 'utf8');
const logger = await readFile(new URL('../public/js/modules/logger/ui.js', import.meta.url), 'utf8');
const legacySessionRoute = await readFile(new URL('../worker/routes/sessions.js', import.meta.url), 'utf8');
const todayPublic = await readFile(new URL('../worker/modules/today/public.js', import.meta.url), 'utf8');
const legacyWeekRoute = await readFile(new URL('../worker/routes/week.js', import.meta.url), 'utf8');
const frontendManifest = await readFile(new URL('../public/js/modules/progress/manifest.js', import.meta.url), 'utf8');
const frontendUi = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');

test('Progress is a registered Activities-dependent Version 1 capability', () => {
  const worker = createModuleRegistry(platformModules).get('progress');
  const frontend = createFrontendModuleRegistry(frontendModules).get('progress');
  assert.ok(worker);
  assert.ok(frontend);
  assert.deepEqual(worker.dependsOn, ['activities']);
  assert.deepEqual(frontend.dependsOn, ['activities']);
  assert.deepEqual(worker.ownsTables, ['progress_records']);
  assert.deepEqual(worker.compatibilityTables, ['sessions']);
});

test('Progress persistence owns canonical records and never creates legacy sessions', () => {
  assert.match(data, /\bINSERT\s+INTO\s+progress_records\b/i);
  assert.match(data, /\bFROM\s+progress_records\b/i);
  assert.match(data, /\bFROM\s+sessions\b/i);
  assert.doesNotMatch(data, /\bINSERT\s+INTO\s+sessions\b/i);
  assert.doesNotMatch(data, /\bUPDATE\s+sessions\b/i);
});

test('Legacy sessions are isolated to the original default profile', () => {
  assert.match(data, /profileId\s*!==\s*['"]default['"]/);
  assert.match(data, /return \[\]/);
});

test('Progress resolves Activity and Goal identity only through Activities public contract', () => {
  assert.match(publicContract, /activitiesContractV1/);
  assert.match(publicContract, /from '\.\.\/activities\/public\.js'/);
  assert.doesNotMatch(publicContract, /activities\/data\.js/);
  assert.doesNotMatch(publicContract, /\b(?:FROM|JOIN)\s+goal_activities\b/i);
  assert.doesNotMatch(publicContract, /\b(?:FROM|JOIN)\s+goals\b/i);
});

test('Activities public contract supports historical archived references', () => {
  assert.match(activitiesPublic, /includeArchived\s*=\s*false/);
  assert.match(activitiesPublic, /includeArchived/);
});

test('Progress API writes and deletes canonical factual records', () => {
  assert.match(routes, /createProgressRoute/);
  assert.match(routes, /progressContractV1/);
  assert.match(routes, /createFromActivityKey/);
  assert.match(routes, /deleteProgressRecord/);
  assert.doesNotMatch(routes, /\bINSERT\s+INTO\s+sessions\b/i);
});

test('Logger Done path consumes Activities capability and canonical Progress API', () => {
  assert.match(app, /activities\s*=\s*moduleRegistry\.get\('activities'\)/);
  assert.match(app, /create\(\{\s*onSaved:\s*load,\s*activities\s*\}\)/);
  assert.match(logger, /activityCapability\?\.list/);
  assert.match(logger, /activityCapability\.create/);
  assert.doesNotMatch(logger, /\/api\/v1\/activities|\/api\/v1\/goals/);
  assert.match(activitiesFrontend, /\/api\/v1\/activities/);
  assert.match(logger, /\/api\/v1\/progress/);
  assert.doesNotMatch(logger, /\/api\/session/);
  assert.doesNotMatch(logger, /Back, Abs, Push-ups|Speaking, Grammar, Vocabulary|Chords, Technique, Song practice/);
});

test('Legacy session endpoint forwards writes to Progress and cannot mutate sessions', () => {
  assert.match(legacySessionRoute, /progressContractV1/);
  assert.match(legacySessionRoute, /from '\.\.\/modules\/progress\/public\.js'/);
  assert.match(legacySessionRoute, /compatibility: 'progress-v1'/);
  assert.match(legacySessionRoute, /410/);
  assert.doesNotMatch(legacySessionRoute, /progress\/domain\.js/);
  assert.doesNotMatch(legacySessionRoute, /\b(?:INSERT|UPDATE|DELETE)\b[\s\S]*\bsessions\b/i);
});

test('Legacy week route delegates to Today, which reads Progress publicly', () => {
  assert.match(legacyWeekRoute, /todayContractV1/);
  assert.match(legacyWeekRoute, /modules\/today\/public\.js/);
  assert.match(todayPublic, /progressContractV1/);
  assert.match(todayPublic, /progress\/public\.js/);
  assert.doesNotMatch(todayPublic, /\bFROM\s+sessions\b/i);
});

test('Progress frontend owns its UI and app composes the registered module', async () => {
  assert.match(frontendManifest, /from '.\/ui\.js'/);
  assert.match(frontendManifest, /id: 'progress'/);
  assert.match(frontendUi, /\/api\/v1\/progress/);
  assert.match(frontendUi, /data-delete-progress/);
  assert.match(app, /moduleRegistry\.get\('progress'\)/);
  assert.doesNotMatch(app, /features\/progress\.js/);
  assert.equal(await exists(new URL('../public/js/features/progress.js', import.meta.url)), false);
});

test('Shared Progress business data file is removed', async () => {
  assert.equal(await exists(new URL('../worker/data/progress.js', import.meta.url)), false);
});

test('Disabling Activities disables Progress without affecting independent modules', () => {
  const workerIds = createModuleRegistry(platformModules).enabled({ activities: false }).map((module) => module.id);
  const frontendIds = createFrontendModuleRegistry(frontendModules).enabled({ activities: false }).map((module) => module.id);
  assert.equal(workerIds.includes('progress'), false);
  assert.equal(frontendIds.includes('progress'), false);
  assert.equal(workerIds.includes('daily-plan'), true);
  assert.equal(workerIds.includes('journal'), true);
});
