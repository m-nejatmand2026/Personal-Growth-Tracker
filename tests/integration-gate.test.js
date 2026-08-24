import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const quality = await readFile(new URL('../.github/workflows/quality.yml', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const coreIntegration = await readFile(new URL('./integration/worker-d1.integration.js', import.meta.url), 'utf8');
const directionIntegration = await readFile(new URL('./integration/direction-lifecycle.integration.js', import.meta.url), 'utf8');
const activityIntegration = await readFile(new URL('./integration/activity-lifecycle.integration.js', import.meta.url), 'utf8');
const integrationFiles = [coreIntegration, directionIntegration, activityIntegration];

test('Quality keeps real Worker and D1 integration evidence release-blocking', () => {
  assert.equal(packageJson.devDependencies.wrangler, '4.123.0');
  assert.equal(
    packageJson.scripts['test:integration'],
    'node --test tests/integration/worker-d1.integration.js && node --test tests/integration/direction-lifecycle.integration.js && node --test tests/integration/activity-lifecycle.integration.js'
  );
  assert.match(quality, /npm test/);
  assert.match(quality, /wrangler@4\.123\.0/);
  assert.match(quality, /npm run test:integration/);
  assert.ok(quality.indexOf('npm test') < quality.indexOf('npm run test:integration'));
});

test('integration gates use separate Cloudflare harness processes with local isolated D1 and real migrations', () => {
  for (const source of integrationFiles) {
    assert.match(source, /createTestHarness/);
    assert.match(source, /configPath: '\.\/wrangler\.jsonc'/);
    assert.match(source, /applyD1Migrations\('DB'\)/);
    assert.match(source, /server\?\.close\(\)/);
    assert.doesNotMatch(source, /--remote|env:\s*['"]preview['"]|1937971c|a182d8c8/);
  }
  assert.match(coreIntegration, /\/api\/health/);
  assert.match(coreIntegration, /\/api\/v1\/areas/);
  assert.match(directionIntegration, /Direction archive restore and permanent removal keep factual Progress/);
  assert.match(activityIntegration, /Activity archive restore and permanent removal keep factual Progress and its Direction/);
});
