import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/deploy-preview2-branch.yml', import.meta.url), 'utf8');

const CHECKOUT_SHA = 'd23441a48e516b6c34aea4fa41551a30e30af803';
const SETUP_NODE_SHA = '249970729cb0ef3589644e2896645e5dc5ba9c38';

test('Preview 2 branch deploy remains isolated to the dedicated branch, Worker and D1', () => {
  assert.match(workflow, /branches: \[feature\/experience-v2\]/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/feature\/experience-v2'/);
  assert.match(workflow, /personal-growth-tracker-preview2/);
  assert.match(workflow, /Preview 2 points at Production D1\. Refusing deployment\./);
  assert.match(workflow, /Preview 2 points at Preview 1 D1\. Refusing deployment\./);
  assert.doesNotMatch(workflow, /d1 migrations apply/);
});

test('Preview 2 branch deploy pins third-party actions and does not persist Git credentials', () => {
  assert.match(workflow, new RegExp(`actions/checkout@${CHECKOUT_SHA}`));
  assert.match(workflow, new RegExp(`actions/setup-node@${SETUP_NODE_SHA}`));
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v\d/);
});

test('Preview 2 remote resource gate validates actual D1 JSON', () => {
  assert.match(workflow, /serialized\.includes\('\"quick_check\":\"ok\"'\)/);
  assert.match(workflow, /serialized\.includes\('\"status\":\"ok\"'\)/);
  assert.doesNotMatch(workflow, /\\\\\"quick_check\\\\\"/);
  assert.doesNotMatch(workflow, /\\\\\"status\\\\\"/);
});

test('Preview 2 branch smoke gate proves private Access boundary, Worker route and isolated D1 health', () => {
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
