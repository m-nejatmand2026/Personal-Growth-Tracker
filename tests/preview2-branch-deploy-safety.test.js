import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/deploy-preview2-branch.yml', import.meta.url), 'utf8');
const bootstrap = await readFile(new URL('../docs/PREVIEW2_BOOTSTRAP.md', import.meta.url), 'utf8');
const authRollout = await readFile(new URL('../docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md', import.meta.url), 'utf8');
const startHere = await readFile(new URL('../START_PREVIEW2_CHAT.md', import.meta.url), 'utf8');

const CHECKOUT_SHA = 'd23441a48e516b6c34aea4fa41551a30e30af803';
const SETUP_NODE_SHA = '249970729cb0ef3589644e2896645e5dc5ba9c38';
const CANONICAL_PREVIEW2_ORIGIN = 'https://personal-growth-tracker-preview2.m-nejatmand.workers.dev';

test('Preview 2 branch deploy remains isolated to the dedicated branch, Worker and D1', () => {
  assert.match(workflow, /branches: \[feature\/experience-v2\]/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/feature\/experience-v2'/);
  assert.match(workflow, /personal-growth-tracker-preview2/);
  assert.match(workflow, /Preview 2 points at Production D1\. Refusing deployment\./);
  assert.match(workflow, /Preview 2 points at Preview 1 D1\. Refusing deployment\./);
});

test('Preview 2 branch deploy pins third-party actions and does not persist Git credentials', () => {
  assert.match(workflow, new RegExp(`actions/checkout@${CHECKOUT_SHA}`));
  assert.match(workflow, new RegExp(`actions/setup-node@${SETUP_NODE_SHA}`));
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v\d/);
});

test('Preview 2 branch deploy authorizes only the exact guarded migration set', () => {
  assert.match(workflow, /authorized_count='8'/);
  assert.match(workflow, /verify_blob '0008_auth_multi_user\.sql' 'ea383d7edffb6a5cc36b0c0115a5462795d4d911'/);
  assert.match(workflow, /GC_PREVIEW2_MIGRATION_CONFIRM: personal-growth-tracker-preview2/);
  assert.match(workflow, /bash scripts\/migrate-preview2\.sh/);
  assert.match(workflow, /No migrations to apply/);
  assert.doesNotMatch(workflow, /d1 migrations apply/);
});

test('Preview 2 remote resource gate validates actual D1 JSON', () => {
  assert.match(workflow, /serialized\.includes\('\"quick_check\":\"ok\"'\)/);
  assert.match(workflow, /serialized\.includes\('\"status\":\"ok\"'\)/);
  assert.doesNotMatch(workflow, /\\\\\"quick_check\\\\\"/);
  assert.doesNotMatch(workflow, /\\\\\"status\\\\\"/);
});

test('Preview 2 branch smoke gate proves the staged auth boundary, Worker route and isolated D1 health', () => {
  assert.match(workflow, /Preview 2 is publicly reachable/);
  assert.match(workflow, /Anonymous Preview 2 is blocked as expected/);
  assert.match(workflow, /\/workers\/scripts\/\$\{worker\}\/subdomain/);
  assert.match(workflow, /\/d1\/database\?per_page=1000/);
  assert.match(workflow, /personal-growth-tracker-preview2/);
  assert.match(workflow, /personal-growth-tracker-preview'/);
  assert.match(workflow, /personal-growth-tracker'/);
  assert.match(workflow, /Preview 2 D1 overlaps Preview 1 or Production/);
  assert.match(workflow, /PRAGMA quick_check; SELECT 'ok' AS status;/);
  assert.doesNotMatch(workflow, /CF_ACCESS_CLIENT_ID/);
  assert.doesNotMatch(workflow, /CF_ACCESS_CLIENT_SECRET/);
  assert.doesNotMatch(workflow, /CF-Access-Client-Id:/);
  assert.doesNotMatch(workflow, /CF-Access-Client-Secret:/);
});

test('Preview 2 operational docs agree on the canonical auth origin', () => {
  for (const document of [bootstrap, authRollout, startHere]) {
    assert.match(document, new RegExp(CANONICAL_PREVIEW2_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(document, /feature-experience-v2-personal-growth-tracker\.m-nejatmand\.workers\.dev/);
  }
  assert.match(authRollout, /BETTER_AUTH_URL/);
  assert.match(authRollout, /Cloudflare Git-generated commit and branch preview hostnames/);
});

test('Preview 2 operational docs match the current deployment and auth activation controls', () => {
  assert.match(bootstrap, /deploy-preview2-branch\.yml/);
  assert.match(bootstrap, /exactly eight SQL migration files/);
  assert.match(bootstrap, /runs the guarded idempotent Preview 2 migration script/);
  assert.match(startHere, /deploy-preview2-branch\.yml/);
  assert.match(startHere, /GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true/);
  assert.doesNotMatch(startHere, /GC_PREVIEW2_ENABLED=true/);
  assert.match(authRollout, /store \*\*all Growth Compass auth runtime bindings as Preview 2 Worker secrets\*\*/);
  assert.match(authRollout, /GC_AUTH_MODE=enforced/);
  assert.match(authRollout, /Cloudflare Access is \*\*still present\*\*/);
});
