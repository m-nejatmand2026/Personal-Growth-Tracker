import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createModuleRegistry } from '../worker/platform/module-registry.js';
import { platformModules } from '../worker/modules/catalog.js';
import { goalsModule } from '../public/js/modules/goals/module.js';
import { capacityModule } from '../public/js/modules/capacity/module.js';

const planSource = await readFile(new URL('../public/js/features/plan.js', import.meta.url), 'utf8');

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

const handler = async () => ({});

test('Plan receives only declared dependency models and no longer knows contributor model shapes', () => {
  assert.match(planSource, /dependencyModelsFor/);
  assert.match(planSource, /module\.planSummary/);
  assert.doesNotMatch(planSource, /models\.areas|models\.goals|models\.capacity/);
  assert.doesNotMatch(planSource, /formatMinutes|timeFitCard/);
});

test('Plan overview summaries are module-owned stable presentation contracts', () => {
  const goals = goalsModule.planSummary({
    model: { goals: [{ status: 'active' }, { status: 'archived' }, { status: 'active' }] },
    models: { areas: { areas: [{}, {}, {}] } }
  });
  assert.deepEqual(goals, [{
    id: 'goals.active',
    order: 10,
    label: 'Active goals',
    value: 2,
    detail: '3 life areas'
  }]);

  const capacity = capacityModule.planSummary({
    model: {
      timeFit: {
        week: {
          availableMinutes: 600,
          plannedMinutes: 420,
          remainingMinutes: 180,
          overByMinutes: 0,
          overcommittedMinutes: 0,
          plannedPct: 70
        }
      }
    }
  });
  assert.deepEqual(
    capacity.map(({ id, order, label, value, detail }) => ({ id, order, label, value, detail })),
    [
      {
        id: 'capacity.available-week',
        order: 20,
        label: 'Available this week',
        value: '10h',
        detail: 'after recurring commitments'
      },
      {
        id: 'capacity.planned-week',
        order: 30,
        label: 'Planned this week',
        value: '7h',
        detail: 'goal time currently planned'
      },
      {
        id: 'capacity.time-fit-week',
        order: 40,
        label: 'Still flexible',
        value: '3h',
        detail: 'not currently assigned to goal time'
      }
    ]
  );
});

test('Worker registry rejects static routes that overlap a dynamic route for the same method', () => {
  assert.throws(
    () => createModuleRegistry([
      workerModule({
        id: 'fixed',
        routes: [{ method: 'GET', pattern: '/api/v1/items/42', handler }]
      }),
      workerModule({
        id: 'dynamic',
        routes: [{ method: 'GET', pattern: /^\/api\/v1\/items\/\d+$/, handler }]
      })
    ]),
    /Overlapping route registration/
  );
});

test('Worker routing refuses ambiguous concrete regex matches instead of using registration order', () => {
  const registry = createModuleRegistry([
    workerModule({
      id: 'first',
      routes: [{ method: 'GET', pattern: /^\/api\/v1\/items\/\d+$/, handler }]
    }),
    workerModule({
      id: 'second',
      routes: [{ method: 'GET', pattern: /^\/api\/v1\/items\/(?:42|\d+)$/, handler }]
    })
  ]);

  assert.throws(
    () => registry.match('GET', '/api/v1/items/42'),
    /Ambiguous route match/
  );
});

test('representative Version 1 routes keep their intended module owner', () => {
  const registry = createModuleRegistry(platformModules);
  for (const [method, path, owner] of [
    ['GET', '/api/v1/areas', 'areas'],
    ['PUT', '/api/v1/goals/42', 'goals'],
    ['GET', '/api/v1/capacity', 'capacity'],
    ['GET', '/api/v1/today', 'today']
  ]) {
    assert.equal(registry.match(method, path)?.module.id, owner);
  }
});
