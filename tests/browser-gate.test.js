import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const quality = await readFile(new URL('../.github/workflows/quality.yml', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const browserTest = await readFile(new URL('./browser/browser-e2e.browser.js', import.meta.url), 'utf8');
const runner = await readFile(new URL('../scripts/run-browser-e2e.sh', import.meta.url), 'utf8');

test('Quality keeps pinned Chromium and WebKit browser acceptance release-blocking', () => {
  assert.equal(packageJson.devDependencies.playwright, '1.62.0');
  assert.equal(packageJson.scripts['test:browser'], 'node --test tests/browser/browser-e2e.browser.js');
  assert.match(quality, /playwright@1\.62\.0/);
  assert.match(quality, /playwright install --with-deps chromium webkit/);
  assert.match(quality, /bash scripts\/run-browser-e2e\.sh/);
  assert.ok(quality.indexOf('npm run test:integration') < quality.indexOf('run-browser-e2e.sh'));
});

test('browser acceptance runs only against an isolated local Worker and local D1', () => {
  assert.match(runner, /d1 migrations apply DB/);
  assert.match(runner, /--local/);
  assert.match(runner, /--persist-to/);
  assert.match(runner, /wrangler dev/);
  assert.match(runner, /127\.0\.0\.1:8787\/api\/health/);
  assert.match(runner, /GC_E2E_BASE_URL=http:\/\/127\.0\.0\.1:8787/);
  assert.doesNotMatch(runner, /--remote|workers\.dev|1937971c|a182d8c8/);
});

test('browser acceptance proves Product Rebuild workflows across desktop and 375px browsers', () => {
  assert.match(browserTest, /chromium/);
  assert.match(browserTest, /webkit/);
  assert.match(browserTest, /width:\s*375,\s*height:\s*812/);
  assert.match(browserTest, /product-rebuild\.css/);
  assert.match(browserTest, /product-rebuild-pages\.css/);
  assert.match(browserTest, /gc-today-rebuild/);
  assert.match(browserTest, /gc-add-activity-sheet/);
  assert.match(browserTest, /gc-plan-rebuild/);
  assert.match(browserTest, /gc-progress-rebuild/);
  assert.match(browserTest, /wellness-boost-library-view/);
  assert.match(browserTest, /gc-insights-rebuild/);
  assert.match(browserTest, /#topMore > summary/);
  assert.match(browserTest, /must not overflow horizontally/);
  assert.doesNotMatch(browserTest, /preview-empty\.css|body must have no rendered box|blank canvas/);
  assert.doesNotMatch(browserTest, /https:\/\//);
});
