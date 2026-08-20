import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../scripts/migrate-preview2.sh', import.meta.url), 'utf8');
const branchDeploy = await readFile(new URL('../.github/workflows/deploy-preview2-branch.yml', import.meta.url), 'utf8');

const PROD_ID = 'a182d8c8-c009-461e-ac7e-04694c1047ab';
const PREVIEW1_ID = '1937971c-f2f2-4dad-bc65-3d22952584bb';
const AUTHORIZED_MIGRATIONS = [
  ['0001_init.sql', 'dc9c757af309667e1bf70f66614b5166ac27dce7'],
  ['0002_version_one_core_model.sql', '04753e438bd6bc19868ea700a99961b3696441c3'],
  ['0003_capacity_schedule_flexibility.sql', 'd4f8d9c1250d85ac0865e321fc8a7ed3226ac489'],
  ['0004_daily_plan.sql', 'feca2348e3a4780695db8b01cfef9fe104ae355c'],
  ['0005_journal.sql', '0d1e2c0e4988bb313d154d6db06827db203c56a5'],
  ['0006_activities_contract.sql', '5b6d5b038738fd055ff3b7456e8c2f69dd20c89b'],
  ['0007_wellbeing_energy.sql', '3c3a3c25a28ff6c23b00c2d4828d55e9c0217201'],
  ['0008_auth_multi_user.sql', 'ea383d7edffb6a5cc36b0c0115a5462795d4d911']
];

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

test('explicit Preview 2 migration keeps generated Wrangler config repository-relative and surfaces command failures', () => {
  assert.match(script, /mktemp '\.\/\.preview2-migrate\.XXXXXX\.json'/);
  assert.match(script, /unable to list Preview 2 migrations before apply/);
  assert.match(script, /unable to list Preview 2 migrations after apply/);
  assert.match(script, /unable to run Preview 2 PRAGMA quick_check/);
  assert.doesNotMatch(script, /mktemp --suffix=\.json/);
});

test('explicit Preview 2 migration verifies pending state and database integrity', () => {
  assert.match(script, /d1 migrations list DB --remote --env "\$TARGET_ENV"/);
  assert.match(script, /d1 migrations apply DB --remote --env "\$TARGET_ENV"/);
  assert.match(script, /PRAGMA quick_check;/);
  assert.match(script, /pending migrations remain after apply/);
  assert.match(script, /quick_check did not report ok/);
  assert.doesNotMatch(script, /wrangler@\$\{WRANGLER_VERSION\} deploy/);
});

test('Preview 2 branch deployment can apply only the explicitly authorized migration set', () => {
  assert.match(branchDeploy, /Apply only the explicitly authorized Preview 2 migration set/);
  assert.match(branchDeploy, /GC_PREVIEW2_MIGRATION_CONFIRM: personal-growth-tracker-preview2/);
  assert.match(branchDeploy, /bash scripts\/migrate-preview2\.sh/);
  assert.match(branchDeploy, /authorized_count='8'/);
  for (const [filename, sha] of AUTHORIZED_MIGRATIONS) {
    assert.match(branchDeploy, new RegExp(filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(branchDeploy, new RegExp(sha));
  }
  assert.doesNotMatch(branchDeploy, /wrangler@4\.123\.0 d1 migrations apply/);
});

test('Preview 2 branch deployment rechecks that no migrations remain before Worker deploy', () => {
  assert.match(branchDeploy, /Verify no pending Preview 2 migrations before deploy/);
  assert.match(branchDeploy, /d1 migrations list DB --remote --env preview2/);
  assert.match(branchDeploy, /Preview 2 still has pending D1 migrations after the authorized migration operation/);
});
