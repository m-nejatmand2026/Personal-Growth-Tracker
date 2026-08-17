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

test('Preview 2 remote smoke gate checks actual JSON rather than backslash-escaped text', () => {
  assert.match(workflow, /grep -F '\"status\":\"ok\"'/);
  assert.match(workflow, /grep -F '\"database\":\"ok\"'/);
  assert.doesNotMatch(workflow, /grep -F '\\\"status\\\":\\\"ok\\\"'/);
  assert.doesNotMatch(workflow, /grep -F '\\\"database\\\":\\\"ok\\\"'/);
});

test('Preview 2 branch smoke gate proves Access, selector, both experiences and D1 health', () => {
  assert.match(workflow, /Unauthenticated Preview 2 health returned HTTP/);
  assert.match(workflow, /CF-Access-Client-Id:/);
  assert.match(workflow, /CF-Access-Client-Secret:/);
  assert.match(workflow, /'Experience 1'/);
  assert.match(workflow, /'Current \/ Recovered'/);
  assert.match(workflow, /'\/experience\/1\/'/);
  assert.match(workflow, /'Experience 2'/);
  assert.match(workflow, /'New \/ Ambient Luxury'/);
  assert.match(workflow, /'\/experience\/2\/'/);
  assert.match(workflow, /\/api\/health/);
});
