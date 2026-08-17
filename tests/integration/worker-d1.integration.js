import test, { after, afterEach, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestHarness } from 'wrangler';

const WORKER_NAME = 'personal-growth-tracker';
const server = createTestHarness({
  workers: [{ configPath: './wrangler.jsonc' }]
});

function worker() {
  return server.getWorker(WORKER_NAME);
}

async function jsonRequest(path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.body != null && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  const response = await server.fetch(path, { ...init, headers });
  const body = await response.json();
  return { response, body };
}

before(async () => {
  await server.listen();
});

beforeEach(async () => {
  await worker().applyD1Migrations('DB');
});

afterEach(async () => {
  await server.reset();
});

after(async () => {
  await server.close();
});

test('production Worker configuration boots locally with the complete D1 migration chain', async () => {
  const { response, body } = await jsonRequest('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: 'ok', database: 'ok' });

  const env = await worker().getEnv();
  const migrationCount = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM d1_migrations'
  ).first();
  assert.equal(Number(migrationCount.count), 7);

  for (const table of [
    'profiles',
    'areas',
    'goals',
    'goal_activities',
    'progress_records',
    'daily_plan_items',
    'journal_entries',
    'energy_logs_v1'
  ]) {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).bind(table).first();
    assert.equal(row?.name, table, `expected migrated table ${table}`);
  }
});

test('Area CRUD executes through the real Worker router and isolated D1', async () => {
  const baseline = await jsonRequest('/api/v1/areas');
  assert.equal(baseline.response.status, 200);
  assert.ok(baseline.body.items.some((item) => item.name === 'Health & Fitness'));

  const created = await jsonRequest('/api/v1/areas', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Integration Test Area',
      icon: 'circle-dot',
      color: '#123456',
      sort_order: 555
    })
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.item.name, 'Integration Test Area');
  assert.equal(created.body.item.profile_id, 'default');
  const id = Number(created.body.item.id);
  assert.ok(Number.isInteger(id) && id > 0);

  const updated = await jsonRequest(`/api/v1/areas/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Integration Test Area Updated' })
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.item.name, 'Integration Test Area Updated');
  assert.equal(updated.body.item.color, '#123456');

  const archived = await jsonRequest(`/api/v1/areas/${id}`, { method: 'DELETE' });
  assert.equal(archived.response.status, 200);
  assert.equal(Number(archived.body.item.active), 0);

  const visible = await jsonRequest('/api/v1/areas');
  assert.equal(visible.body.items.some((item) => Number(item.id) === id), false);

  const all = await jsonRequest('/api/v1/areas?include_archived=1');
  assert.equal(all.body.items.some((item) => Number(item.id) === id && Number(item.active) === 0), true);
});

test('current owner-only runtime does not expose rows belonging to another profile', async () => {
  const env = await worker().getEnv();
  await env.DB.prepare(
    "INSERT INTO profiles(id,display_name,timezone,locale) VALUES('integration-other','Other','UTC','en')"
  ).run();
  const otherArea = await env.DB.prepare(
    "INSERT INTO areas(profile_id,name,sort_order) VALUES('integration-other','Other Profile Private Area',1)"
  ).run();
  const otherAreaId = Number(otherArea.meta.last_row_id);

  const listed = await jsonRequest('/api/v1/areas?include_archived=1');
  assert.equal(
    listed.body.items.some((item) => item.name === 'Other Profile Private Area'),
    false
  );

  const invalidGoal = await jsonRequest('/api/v1/goals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Cross-profile goal must fail',
      area_id: otherAreaId,
      measurement_type: 'time',
      target_period: 'weekly'
    })
  });
  assert.equal(invalidGoal.response.status, 400);
  assert.equal(invalidGoal.body.error, 'Area not found.');

  const ownerCreated = await jsonRequest('/api/v1/areas', {
    method: 'POST',
    body: JSON.stringify({ name: 'Owner Profile Integration Area' })
  });
  assert.equal(ownerCreated.response.status, 201);

  const persisted = await env.DB.prepare(
    "SELECT profile_id FROM areas WHERE name='Owner Profile Integration Area'"
  ).first();
  assert.equal(persisted.profile_id, 'default');
});

test('real Worker validation and security response behavior survive the D1 boundary', async () => {
  const invalid = await jsonRequest('/api/v1/areas', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Invalid color',
      color: 'not-a-color'
    })
  });
  assert.equal(invalid.response.status, 400);
  assert.match(invalid.body.error, /six-digit hex color/);
  assert.equal(invalid.response.headers.get('cache-control'), 'no-store');
  assert.equal(invalid.response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(invalid.response.headers.get('x-frame-options'), 'DENY');

  const missing = await jsonRequest('/api/v1/areas/999999', {
    method: 'PUT',
    body: JSON.stringify({ name: 'Missing' })
  });
  assert.equal(missing.response.status, 404);
  assert.equal(missing.body.error, 'Area not found.');
});
