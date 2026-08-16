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

function assetPath(received) {
  const target = received instanceof Request ? received.url : String(received);
  return new URL(target).pathname;
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

test('platform health route verifies D1 without reading profile data', async () => {
  const statements = [];
  const response = await worker.fetch(
    new Request('https://growth-compass.test/api/health'),
    {
      DB: {
        prepare(statement) {
          statements.push(statement);
          return {
            async first() {
              return { ok: 1 };
            }
          };
        }
      }
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assertSecurityHeaders(response);
  assert.deepEqual(await json(response), { status: 'ok', database: 'ok' });
  assert.deepEqual(statements, ['SELECT 1 AS ok']);
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

test('Worker converts malformed JSON into a controlled client error without custom error logging', async () => {
  const originalError = console.error;
  const logs = [];
  console.error = (...parts) => logs.push(parts.join(' '));

  try {
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
    assert.deepEqual(logs, []);
  } finally {
    console.error = originalError;
  }
});

test('Worker does not disclose unexpected internal errors and logs only operational request context', async () => {
  const originalError = console.error;
  const logs = [];
  console.error = (...parts) => logs.push(parts.join(' '));

  try {
    const response = await worker.fetch(
      new Request('https://growth-compass.test/api/v1/areas', {
        headers: { 'cf-ray': 'test-ray-123' }
      }),
      {}
    );

    assert.equal(response.status, 500);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await json(response), { error: 'Unexpected server error' });
    assert.equal(logs.length, 1);

    const entry = JSON.parse(logs[0]);
    assert.equal(entry.event, 'api_error');
    assert.equal(entry.path, '/api/v1/areas');
    assert.equal(entry.method, 'GET');
    assert.equal(entry.status, 500);
    assert.equal(entry.ray_id, 'test-ray-123');
    assert.equal(typeof entry.error_name, 'string');
    assert.equal(typeof entry.message, 'string');
    assert.equal('body' in entry, false);
    assert.equal('profile' in entry, false);
  } finally {
    console.error = originalError;
  }
});

test('Worker serves the Preview 2 selector from its dedicated static entrypoint', async () => {
  const calls = [];
  const selector = '<!doctype html><html><body>Current / Recovered · New / Ambient Luxury</body></html>';
  const response = await worker.fetch(
    new Request('https://growth-compass.test/'),
    {
      ASSETS: {
        async fetch(received) {
          calls.push(assetPath(received));
          return new Response(selector, { status: 200, headers: { 'content-type': 'text/html' } });
        }
      }
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assertSecurityHeaders(response);
  assert.equal(await response.text(), selector);
  assert.deepEqual(calls, ['/selector/index.html']);
});

test('Worker serves Experience 1 through the frozen-source runtime adapter', async () => {
  const calls = [];
  const recovered = '<!doctype html><html><head><link rel="manifest" href="/manifest.webmanifest"></head><body>Recovered</body></html>';
  const response = await worker.fetch(
    new Request('https://growth-compass.test/experience/1/'),
    {
      ASSETS: {
        async fetch(received) {
          calls.push(assetPath(received));
          return new Response(recovered, { status: 200, headers: { 'content-type': 'text/html' } });
        }
      }
    }
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assertSecurityHeaders(response);
  const html = await response.text();
  assert.match(html, /href="\/experience\/1\/manifest\.webmanifest"/);
  assert.match(html, /src="\/experience\/1\/bootstrap\.js"/);
  assert.equal(html.includes('href="/manifest.webmanifest"'), false);
  assert.deepEqual(calls, ['/experience/1/index.html']);
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
