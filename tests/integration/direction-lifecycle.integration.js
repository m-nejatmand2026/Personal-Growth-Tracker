import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createTestHarness } from 'wrangler';

const WORKER_NAME = 'personal-growth-tracker';
let server;

function worker() {
  return server.getWorker(WORKER_NAME);
}

async function jsonRequest(path, init = {}) {
  const headers = new Headers(init.headers || {});
  if (init.body != null && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await server.fetch(path, { ...init, headers });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; }
  catch { throw new Error(`Expected JSON from ${init.method || 'GET'} ${path}; HTTP ${response.status}: ${text.slice(0, 240)}`); }
  return { response, body };
}

before(async () => {
  server = createTestHarness({ workers: [{ configPath: './wrangler.jsonc' }] });
  await server.listen();
  await worker().applyD1Migrations('DB');
});

after(async () => {
  await server?.close();
  server = undefined;
});

test('Direction archive restore and permanent removal keep factual Progress', async () => {
  const goalCreated = await jsonRequest('/api/v1/goals', { method: 'POST', body: JSON.stringify({ name: 'Lifecycle Direction' }) });
  assert.equal(goalCreated.response.status, 201);
  const goal = goalCreated.body.item;
  const activityCreated = await jsonRequest('/api/v1/activities', { method: 'POST', body: JSON.stringify({ name: 'Lifecycle Activity', goal_id: goal.id }) });
  assert.equal(activityCreated.response.status, 201);
  const activity = activityCreated.body.item;
  const progressCreated = await jsonRequest('/api/v1/progress', { method: 'POST', body: JSON.stringify({ activity_key: activity.key, occurred_on: '2026-08-23', minutes: 35 }) });
  assert.equal(progressCreated.response.status, 201);

  const archived = await jsonRequest(`/api/v1/goals/${goal.id}`, { method: 'DELETE' });
  assert.equal(archived.response.status, 200);
  assert.equal(archived.body.item.status, 'archived');
  const archivedList = await jsonRequest('/api/v1/goals?include_archived=1');
  assert.equal(archivedList.body.items.some(item => Number(item.id) === Number(goal.id) && item.status === 'archived'), true);

  const restored = await jsonRequest(`/api/v1/goals/${goal.id}`, { method: 'PUT', body: JSON.stringify({ status: 'active' }) });
  assert.equal(restored.response.status, 200);
  assert.equal(restored.body.item.status, 'active');

  await jsonRequest(`/api/v1/goals/${goal.id}`, { method: 'DELETE' });
  const removed = await jsonRequest(`/api/v1/goals/${goal.id}/permanent`, { method: 'DELETE' });
  assert.equal(removed.response.status, 200);
  assert.equal(removed.body.removed, true);
  const allGoals = await jsonRequest('/api/v1/goals?include_archived=1');
  assert.equal(allGoals.body.items.some(item => Number(item.id) === Number(goal.id)), false);

  const env = await worker().getEnv();
  const fact = await env.DB.prepare("SELECT minutes,goal_id,activity_id FROM progress_records WHERE profile_id='default' AND occurred_on='2026-08-23' ORDER BY id DESC LIMIT 1").first();
  assert.equal(Number(fact.minutes), 35);
  assert.equal(fact.goal_id, null);
  assert.equal(fact.activity_id, null);
});
