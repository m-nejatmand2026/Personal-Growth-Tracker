import test from 'node:test';
import assert from 'node:assert/strict';

import { platformModules } from '../worker/modules/catalog.js';

function routeText(pattern) {
  if (typeof pattern === 'string') return pattern;
  if (pattern instanceof RegExp) return pattern.source.replaceAll('\\/', '/');
  return String(pattern || '');
}

test('every registered Worker business module declares contract version 1', () => {
  assert.ok(platformModules.length > 0);
  for (const module of platformModules) {
    assert.equal(module.contractVersion, 1, `${module.id} must explicitly declare contractVersion 1`);
  }
});

test('every registered Version 1 business route stays under the /api/v1 namespace', () => {
  for (const module of platformModules) {
    for (const route of module.routes || []) {
      const text = routeText(route.pattern);
      assert.match(text, /\/api\/v1(?:\/|$)/, `${module.id} route is outside /api/v1: ${text}`);
    }
  }
});

test('registered business routes use a bounded HTTP method vocabulary', () => {
  const allowed = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  for (const module of platformModules) {
    for (const route of module.routes || []) {
      assert.ok(allowed.has(route.method), `${module.id} has unsupported route method ${route.method}`);
    }
  }
});
