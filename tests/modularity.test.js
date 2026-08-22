import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { createEventDispatcher } from '../worker/platform/events.js';
import { platformModules } from '../worker/modules/catalog.js';
import { createFrontendModuleRegistry } from '../public/js/platform/module-registry.js';
import { frontendModules } from '../public/js/modules/catalog.js';
import { createEventBus } from '../public/js/platform/event-bus.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function filesUnder(directory) {
  const absolute = path.join(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(child));
    else if (/\.(js|ts)$/.test(entry.name)) files.push(child);
  }
  return files;
}

function importedSpecifiers(source) {
  const results = [];
  const pattern = /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(source))) results.push(match[1]);
  return results;
}

function workerModule(overrides) {
  return {
    id: 'sample',
    contractVersion: 1,
    dependsOn: [],
    defaultEnabled: true,
    ownsTables: [],
    compatibilityTables: [],
    routes: [],
    publishes: [],
    subscribes: [],
    ...overrides
  };
}

test('Worker module catalog is valid, dependency-safe and route-conflict free', () => {
  const registry = createModuleRegistry(platformModules);
  assert.equal(registry.has('areas'), true);
  assert.equal(registry.has('goals'), true);
  assert.equal(registry.has('plans'), true);
  assert.equal(registry.has('capacity'), true);
  assert.equal(registry.has('today'), true);
  assert.equal(registry.match('GET', '/api/v1/areas')?.module.id, 'areas');
  assert.equal(registry.match('GET', '/api/v1/capacity')?.module.id, 'capacity');
  assert.equal(registry.match('GET', '/api/v1/today')?.module.id, 'today');
});

test('Worker registry rejects unpublished or undeclared cross-module subscriptions', () => {
  assert.throws(
    () => createModuleRegistry([
      workerModule({ id: 'reader', subscribes: ['sample.changed'] })
    ]),
    /unpublished event/
  );

  assert.throws(
    () => createModuleRegistry([
      workerModule({ id: 'publisher', publishes: ['sample.changed'] }),
      workerModule({ id: 'reader', subscribes: ['sample.changed'] })
    ]),
    /without depending on publisher/
  );

  const registry = createModuleRegistry([
    workerModule({ id: 'publisher', publishes: ['sample.changed'] }),
    workerModule({ id: 'reader', dependsOn: ['publisher'], subscribes: ['sample.changed'] })
  ]);
  assert.equal(registry.eventPublisher('sample.changed'), 'publisher');
});

test('Worker event dispatcher uses explicit injected handlers for declared facts', async () => {
  const modules = [
    workerModule({ id: 'publisher', publishes: ['sample.changed'] }),
    workerModule({ id: 'reader', dependsOn: ['publisher'], subscribes: ['sample.changed'] })
  ];
  createModuleRegistry(modules);

  assert.throws(
    () => createEventDispatcher(modules),
    /no runtime handler/
  );

  const received = [];
  const dispatcher = createEventDispatcher(modules, {
    reader: {
      'sample.changed': async ({ payload, subscriberModuleId }) => {
        received.push([subscriberModuleId, payload.id]);
      }
    }
  });

  await dispatcher.emit('sample.changed', { id: 42 }, {});
  assert.deepEqual(received, [['reader', 42]]);
});

test('Frontend module catalog has explicit dependency ordering', () => {
  const registry = createFrontendModuleRegistry(frontendModules);
  const ids = registry.modules.map((module) => module.id);
  assert.ok(ids.indexOf('areas') < ids.indexOf('goals'));
  assert.ok(ids.indexOf('goals') < ids.indexOf('plans'));
  assert.ok(ids.indexOf('plans') < ids.indexOf('capacity'));
});

test('Frontend cross-module facts have one registered publisher', () => {
  const registry = createFrontendModuleRegistry(frontendModules);
  assert.equal(registry.eventPublisher('daily-plan.completion-selected'), 'daily-plan');
  assert.equal(registry.eventPublisher('journal.preview-selected'), 'journal');
});

test('Frontend registry rejects undeclared and multiply-owned events', () => {
  const base = { contractVersion: 1, dependsOn: [], defaultEnabled: true, slots: [], publishes: [], subscribes: [] };
  assert.throws(
    () => createFrontendModuleRegistry([{ ...base, id: 'reader', subscribes: ['sample.changed'] }]),
    /unpublished event/
  );
  assert.throws(
    () => createFrontendModuleRegistry([
      { ...base, id: 'first', publishes: ['sample.changed'] },
      { ...base, id: 'second', publishes: ['sample.changed'] }
    ]),
    /multiple publishers/
  );
});

test('Frontend event bus publishes without coupling publisher to subscribers', async () => {
  const bus = createEventBus();
  const received = [];
  const unsubscribe = bus.subscribe('goal.updated', async (payload) => received.push(payload.id));
  await bus.publish('goal.updated', { id: 42 });
  unsubscribe();
  await bus.publish('goal.updated', { id: 99 });
  assert.deepEqual(received, [42]);
});

test('Business modules do not import another module private implementation', async () => {
  for (const base of ['worker/modules', 'public/js/modules']) {
    for (const file of await filesUnder(base)) {
      if (file.endsWith('/catalog.js')) continue;
      const relative = file.replaceAll('\\', '/');
      const owner = relative.split('/modules/')[1]?.split('/')[0];
      const source = await readFile(path.join(root, file), 'utf8');
      for (const specifier of importedSpecifiers(source)) {
        const marker = '/modules/';
        if (!specifier.includes(marker)) continue;
        const target = specifier.split(marker)[1]?.split('/')[0];
        assert.equal(target, owner, `${file} illegally imports private module ${target}`);
      }
    }
  }
});

test('Core and platform layers do not depend on business modules', async () => {
  for (const base of ['worker/core', 'worker/platform', 'public/js/core', 'public/js/platform']) {
    for (const file of await filesUnder(base)) {
      const source = await readFile(path.join(root, file), 'utf8');
      for (const specifier of importedSpecifiers(source)) {
        assert.equal(specifier.includes('/modules/'), false, `${file} must not import a business module`);
      }
    }
  }
});
