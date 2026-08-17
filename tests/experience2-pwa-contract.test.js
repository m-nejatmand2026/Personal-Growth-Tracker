import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw=fs.readFileSync('public/experience/2/sw.js','utf8');

test('Experience 2 service worker keeps API data out of offline cache',()=>{
  assert.match(sw,/growth-compass-preview2-e2-/);
  assert.match(sw,/url\.pathname\.startsWith\('\/api\/'\)/);
  const apiGuard=sw.indexOf("url.pathname.startsWith('/api/')");
  const respondWith=sw.indexOf('event.respondWith');
  assert.ok(apiGuard>=0&&respondWith>=0&&apiGuard<respondWith,'API requests must return before cache/network fallback handling');
});
