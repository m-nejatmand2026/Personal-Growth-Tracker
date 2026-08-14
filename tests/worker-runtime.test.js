import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../worker/index.js';

async function json(response) {
  return JSON.parse(await response.text());
}

function assertSecurityHeaders(response) {
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('permissions-policy') || '', /camera=\(\)/);
  assert.match(response.headers.get('content-security-policy') || '', /frame-ancestors 'none'/);
  assert.match(response.headers.get('content-security-policy') || '', /script-src 'self'/);
  assert.match(response.headers.get('strict-transport-security') || '', /max-age=31536000/);
}

test('Worker routes unknown API requests through the real API router', async () => {
  const response = await worker.fetch(
    new Request('https://growth-compass.test/api/does-not-exist'),
    {}
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assertSecurityHeaders(response);
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

test('Worker converts malformed JSON into a controlled client error', async () => {
  const response = await worker.fetch(
    new Request('https://growth-compass.test/api/v1/areas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json'
    }),
    {}
  );

  assert.equal(response.status, 400);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await json(response), { error: 'Invalid JSON request body' });
});

test('Worker does not disclose unexpected internal errors to API clients', async () => {
  const originalError = console.error;
  console.error = () => {};

  try {
    const response = await worker.fetch(
      new Request('https://growth-compass.test/api/v1/areas'),
      {}
    );

    assert.equal(response.status, 500);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await json(response), { error: 'Unexpected server error' });
  } finally {
    console.error = originalError;
  }
});

test('Worker delegates non-API requests to the bound asset service and adds browser security headers', async () => {
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
  assertSecurityHeaders(response);
  assert.equal(await response.text(), 'asset-response');
  assert.deepEqual(calls, ['https://growth-compass.test/wellness']);
});

test('Worker returns a controlled 404 when assets are unavailable', async () => {
  const response = await worker.fetch(
    new Request('https://growth-compass.test/not-an-api'),
    {}
  );

  assert.equal(response.status, 404);
  assertSecurityHeaders(response);
  assert.equal(await response.text(), 'Not found');
});
