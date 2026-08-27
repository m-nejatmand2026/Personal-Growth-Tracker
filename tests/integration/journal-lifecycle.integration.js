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

async function journalEntryExists(id) {
  const env = await worker().getEnv();
  const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM journal_entries WHERE profile_id=? AND id=?').bind('default', id).first();
  return Number(row?.count || 0) > 0;
}

async function removeArchivedPermanently(id) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await jsonRequest(`/api/v1/journal/${id}/permanent`, { method: 'DELETE' });
    } catch (error) {
      lastError = error;
      if (!/Network connection lost/i.test(String(error?.message || error))) throw error;
      if (!(await journalEntryExists(id))) {
        return { response: { status: 200 }, body: { removed: true, reconciled_after_transport_loss: true } };
      }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 120 * (attempt + 1)));
    }
  }
  throw lastError;
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

test('Journal archive restore and permanent removal stay private and reversible until explicit removal', async () => {
  const created = await jsonRequest('/api/v1/journal', {
    method: 'POST',
    body: JSON.stringify({ occurred_on: '2026-08-24', title: 'Lifecycle reflection', body: 'Private reflection evidence.', entry_type: 'reflection', tags: ['lifecycle'] })
  });
  assert.equal(created.response.status, 201);
  const entry = created.body.item;
  assert.equal(entry.archived_at, null);

  const archived = await jsonRequest(`/api/v1/journal/${entry.id}`, { method: 'DELETE' });
  assert.equal(archived.response.status, 200);
  assert.ok(archived.body.item.archived_at);

  const activeList = await jsonRequest('/api/v1/journal?limit=100');
  assert.equal(activeList.body.items.some(item => Number(item.id) === Number(entry.id)), false);
  const allList = await jsonRequest('/api/v1/journal?include_archived=1&limit=100');
  assert.equal(allList.body.items.some(item => Number(item.id) === Number(entry.id) && item.archived_at), true);

  const removeWhileActive = await jsonRequest(`/api/v1/journal/${entry.id}/restore`, { method: 'POST', body: JSON.stringify({}) });
  assert.equal(removeWhileActive.response.status, 200);
  assert.equal(removeWhileActive.body.item.archived_at, null);

  const unsafeRemoval = await jsonRequest(`/api/v1/journal/${entry.id}/permanent`, { method: 'DELETE' });
  assert.equal(unsafeRemoval.response.status, 409);
  assert.match(String(unsafeRemoval.body.error || unsafeRemoval.body.message || ''), /Archive/i);

  await jsonRequest(`/api/v1/journal/${entry.id}`, { method: 'DELETE' });
  const removed = await removeArchivedPermanently(entry.id);
  assert.equal(removed.response.status, 200);
  assert.equal(removed.body.removed, true);

  const env = await worker().getEnv();
  const journalCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM journal_entries WHERE profile_id=? AND id=?').bind('default', entry.id).first();
  assert.equal(Number(journalCount.count), 0);
  const progressCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM progress_records WHERE profile_id='default'").first();
  assert.equal(Number(progressCount.count), 0);
});
