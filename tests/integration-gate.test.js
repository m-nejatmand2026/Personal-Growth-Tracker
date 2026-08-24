import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const quality = await readFile(new URL('../.github/workflows/quality.yml', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const integration = await readFile(new URL('./integration/worker-d1.integration.js', import.meta.url), 'utf8');

test('Quality keeps real Worker and D1 integration evidence release-blocking', () => {
  assert.equal(packageJson.devDependencies.wrangler, '4.123.0');
  assert.equal(packageJson.scripts['test:integration'], 'node --test tests/integration/worker-d1.integration.js');
  assert.match(quality, /npm test/);
  assert.match(quality, /wrangler@4\.123\.0/);
  assert.match(quality, /npm run test:integration/);
  assert.ok(quality.indexOf('npm test') < quality.indexOf('npm run test:integration'));
});

test('integration gate uses Cloudflare test harness with local isolated D1 and real migrations', () => {
  assert.match(integration, /createTestHarness/);
  assert.match(integration, /beforeEach\(async \(\) => \{[\s\S]*server = createTestHarness/);
  assert.match(integration, /configPath: '\.\/wrangler\.jsonc'/);
  assert.match(integration, /applyD1Migrations\('DB'\)/);
  assert.match(integration, /afterEach\(async \(\) => \{[\s\S]*server\?\.close\(\)/);
  assert.match(integration, /server = undefined/);
  assert.match(integration, /\/api\/health/);
  assert.match(integration, /\/api\/v1\/areas/);
  assert.match(integration, /\/api\/v1\/goals/);
  assert.doesNotMatch(integration, /--remote|env:\s*['"]preview['"]|1937971c|a182d8c8/);
});
