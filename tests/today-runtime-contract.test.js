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

const workerPublic = await readFile(new URL('../worker/modules/today/public.js', import.meta.url), 'utf8');
const workerRoutes = await readFile(new URL('../worker/modules/today/routes.js', import.meta.url), 'utf8');
const frontendManifest = await readFile(new URL('../public/js/modules/today/manifest.js', import.meta.url), 'utf8');
const todayUi = await readFile(new URL('../public/js/features/today.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');
const logger = await readFile(new URL('../public/js/modules/logger/ui.js', import.meta.url), 'utf8');
const progress = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const insights = await readFile(new URL('../public/js/modules/insights/ui.js', import.meta.url), 'utf8');

test('Today is a table-free Worker composition contract with explicit dependencies', () => {
  const worker = createModuleRegistry(platformModules).get('today');
  const frontend = createFrontendModuleRegistry(frontendModules).get('today');
  assert.ok(worker);
  assert.ok(frontend);
  assert.deepEqual(worker.dependsOn, ['activities', 'plans', 'progress']);
  assert.deepEqual(worker.ownsTables, []);
  assert.equal(createModuleRegistry(platformModules).match('GET', '/api/v1/today')?.module.id, 'today');
});

test('Today Worker composes only public contracts and owns no SQL', () => {
  for (const contract of ['activitiesContractV1', 'plansContractV1', 'progressContractV1']) {
    assert.match(workerPublic, new RegExp(`\\b${contract}\\b`));
  }
  assert.doesNotMatch(workerPublic, /\/(?:data|domain|routes)\.js['"]/);
  assert.doesNotMatch(workerPublic, /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i);
  assert.match(workerRoutes, /todayContractV1\.getDay/);
});

test('Today presentation preserves module-owned Revision A widgets with canonical facts', () => {
  assert.match(frontendManifest, /\/api\/v1\/today\?date=/);
  assert.match(todayUi, /\.get\('capacity'\)/);
  assert.match(todayUi, /\.get\('progress'\)/);
  assert.match(todayUi, /\.get\('today'\)/);
  assert.match(todayUi, /\.get\('wellbeing'\)/);
  assert.doesNotMatch(todayUi, /state\.data|\/api\/(?:bootstrap|week|history|session|energy)/);
});

test('Primary runtime has no legacy bootstrap or founder fallback path', async () => {
  assert.doesNotMatch(app, /\/api\/bootstrap|createFallback|state\.data/);
  for (const source of [logger, progress, insights]) {
    assert.doesNotMatch(source, /state\.data|\/api\/(?:bootstrap|week|history|session|energy)/);
  }
  assert.equal(await exists(new URL('../public/js/core/fallback.js', import.meta.url)), false);
});

test('Disabling a Today dependency disables Today without unrelated damage', () => {
  const ids = createModuleRegistry(platformModules)
    .enabled({ plans: false })
    .map((module) => module.id);
  assert.equal(ids.includes('today'), false);
  assert.equal(ids.includes('progress'), true);
  assert.equal(ids.includes('daily-plan'), true);
  assert.equal(ids.includes('journal'), true);
  assert.equal(ids.includes('wellbeing'), true);
});
