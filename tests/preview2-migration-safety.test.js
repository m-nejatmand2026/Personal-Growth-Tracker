import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../scripts/migrate-preview2.sh', import.meta.url), 'utf8');
const branchDeploy = await readFile(new URL('../.github/workflows/deploy-preview2-branch.yml', import.meta.url), 'utf8');

const PROD_ID = 'a182d8c8-c009-461e-ac7e-04694c1047ab';
const PREVIEW1_ID = '1937971c-f2f2-4dad-bc65-3d22952584bb';

test('explicit Preview 2 migration command is hard-pinned to the isolated target', () => {
  assert.match(script, /TARGET_NAME='personal-growth-tracker-preview2'/);
  assert.match(script, /TARGET_ENV='preview2'/);
  assert.match(script, new RegExp(PROD_ID));
  assert.match(script, new RegExp(PREVIEW1_ID));
  assert.match(script, /Expected exactly one Preview 2 D1 database/);
  assert.match(script, /resolved D1 is Production/);
  assert.match(script, /resolved D1 is Preview 1/);
  assert.match(script, /Preview 2 D1 collides with an existing environment/);
});

test('explicit migration requires a deliberate confirmation and secret-backed Cloudflare credentials', () => {
  assert.match(script, /GC_PREVIEW2_MIGRATION_CONFIRM/);
  assert.match(script, /REQUIRED_CONFIRMATION='personal-growth-tracker-preview2'/);
  assert.match(script, /CLOUDFLARE_API_TOKEN/);
  assert.match(script, /CLOUDFLARE_ACCOUNT_ID/);
  assert.doesNotMatch(script, /(?:API_TOKEN|ACCOUNT_ID)='[^']+'/);
});

test('explicit Preview 2 migration verifies pending state and database integrity', () => {
  assert.match(script, /d1 migrations list DB --remote --env "\$TARGET_ENV"/);
  assert.match(script, /d1 migrations apply DB --remote --env "\$TARGET_ENV"/);
  assert.match(script, /PRAGMA quick_check;/);
  assert.match(script, /pending migrations remain after apply/);
  assert.match(script, /quick_check did not report ok/);
  assert.doesNotMatch(script, /wrangler@\$\{WRANGLER_VERSION\} deploy/);
});

test('automatic Preview 2 branch deployment still refuses to apply migrations', () => {
  assert.match(branchDeploy, /Refuse pending Preview 2 migrations/);
  assert.match(branchDeploy, /d1 migrations list DB --remote --env preview2/);
  assert.match(branchDeploy, /Automatic deployment remains blocked until migrations are applied explicitly outside automatic CI/);
  assert.doesNotMatch(branchDeploy, /d1 migrations apply/);
});
