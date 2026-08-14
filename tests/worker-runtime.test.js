import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../worker/index.js';

async function json(response) {
  return JSON.parse(await response.text());
}

test('Worker routes unknown API requests through the real API router', async () => {
  const response = await worker.fetch(
    new Request('https://growth-compass.test/api/does-not-exist'),
    {}
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await json(response), { error: 'API route not found' });
});

test('Worker preserves explicit retirement responses for legacy mutation routes', async () => {
  const response = await worker.fetch(
    new Request('https://growth-compass.test/api/targets', { method: 'PUT' }),
    {}
  );

  assert.equal(response.status, 410);
  assert.deepEqual(await json(response), {
    error: 'Legacy weekly target editing has moved to Plan.'
  });
});

test('Worker delegates non-API requests to the bound asset service', async () => {
  const calls = [];
  const request = new Request('https://growth-compass.test/wellness');
  const response = await worker.fetch(request, {
    ASSETS: {
      async fetch(received) {
        calls.push(received.url);
        return new Response('asset-response', { status: 200 });
      }
    }
  });

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'asset-response');
  assert.deepEqual(calls, ['https://growth-compass.test/wellness']);
});

test('Worker returns a controlled 404 when assets are unavailable', async () => {
  const response = await worker.fetch(
    new Request('https://growth-compass.test/not-an-api'),
    {}
  );

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not found');
});
