import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/deploy-preview.yml', import.meta.url), 'utf8');
const quality = await readFile(new URL('../.github/workflows/quality.yml', import.meta.url), 'utf8');
const wrangler = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

const CHECKOUT_SHA = 'd23441a48e516b6c34aea4fa41551a30e30af803';
const SETUP_NODE_SHA = '249970729cb0ef3589644e2896645e5dc5ba9c38';

test('Quality tests the exact PR head SHA later supplied by workflow_run', () => {
  assert.match(quality, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(quality, /persist-credentials: false/);
  assert.match(quality, new RegExp(`actions/checkout@${CHECKOUT_SHA}`));
  assert.match(quality, new RegExp(`actions/setup-node@${SETUP_NODE_SHA}`));
  assert.doesNotMatch(quality, /npm install|npm ci/);
  assert.match(quality, /run: npm test/);
});

test('preview deployment is privileged only after successful Quality on the trusted feature branch', () => {
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflows: \[Quality\]/);
  assert.match(workflow, /types: \[completed\]/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /workflow_run\.event == 'pull_request'/);
  assert.match(workflow, /workflow_run\.head_branch == 'feature\/experience-refinement'/);
  assert.match(workflow, /workflow_run\.head_repository\.full_name == github\.repository/);
  assert.doesNotMatch(workflow, /^\s*push:/m);
  assert.doesNotMatch(workflow, /^\s*workflow_dispatch:/m);
});

test('preview deployment checks out exactly the commit that Quality tested without persisting Git credentials', () => {
  assert.match(workflow, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$TESTED_SHA"/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, new RegExp(`actions/checkout@${CHECKOUT_SHA}`));
  assert.match(workflow, new RegExp(`actions/setup-node@${SETUP_NODE_SHA}`));
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v\d/);
});

test('preview deployment is structurally pinned to preview Worker and preview D1', () => {
  assert.match(workflow, /expectedWorkerBaseName = 'personal-growth-tracker'/);
  assert.match(workflow, /expectedPreviewWorkerName = 'personal-growth-tracker-preview'/);
  assert.match(workflow, /Unexpected Worker base name/);
  assert.match(workflow, /Unexpected preview Worker name/);
  assert.match(workflow, /1937971c-f2f2-4dad-bc65-3d22952584bb/);
  assert.match(workflow, /a182d8c8-c009-461e-ac7e-04694c1047ab/);
  assert.match(workflow, /Preview environment points at production D1\. Refusing deployment\./);

  const config = JSON.parse(wrangler);
  const previewDb = config.env?.preview?.d1_databases?.find((item) => item.binding === 'DB');
  assert.equal(config.name, 'personal-growth-tracker');
  assert.equal(previewDb?.database_name, 'personal-growth-tracker-preview');
  assert.equal(previewDb?.database_id, '1937971c-f2f2-4dad-bc65-3d22952584bb');
  assert.notEqual(previewDb?.database_id, 'a182d8c8-c009-461e-ac7e-04694c1047ab');
});

test('automatic preview deployment never applies migrations and every Wrangler deploy is explicit preview', () => {
  assert.match(workflow, /d1 migrations list DB --remote --env preview/);
  assert.match(workflow, /No migrations to apply/);
  assert.doesNotMatch(workflow, /d1 migrations apply/);

  const deployCommands = workflow.match(/wrangler@4\.123\.0 deploy[^\n]*/g) || [];
  assert.equal(deployCommands.length, 2, 'expected one dry-run and one real preview deploy');
  for (const command of deployCommands) {
    assert.match(command, /--env preview/);
    assert.match(command, /--name personal-growth-tracker-preview/);
  }
  assert.match(deployCommands[0], /--dry-run/);
  assert.doesNotMatch(deployCommands[1], /--dry-run/);
});

test('Cloudflare deployment credentials remain secret-backed', () => {
  assert.match(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
  assert.match(workflow, /Missing CLOUDFLARE_API_TOKEN repository secret/);
  assert.match(workflow, /Missing CLOUDFLARE_ACCOUNT_ID repository secret/);
});

test('preview deployment requires the configured Cloudflare Access service token', () => {
  assert.match(workflow, /secrets\.CF_ACCESS_CLIENT_ID/);
  assert.match(workflow, /secrets\.CF_ACCESS_CLIENT_SECRET/);
  assert.match(workflow, /Missing CF_ACCESS_CLIENT_ID repository secret/);
  assert.match(workflow, /Missing CF_ACCESS_CLIENT_SECRET repository secret/);
  assert.doesNotMatch(workflow, /CLOUDFLARE_ACCESS_CLIENT_ID|CLOUDFLARE_ACCESS_CLIENT_SECRET/);
  assert.doesNotMatch(workflow, /transitional unauthenticated preview smoke test/);
});

test('preview smoke gate proves anonymous API access is blocked and authenticated UI plus API work', () => {
  assert.match(workflow, /https:\/\/personal-growth-tracker-preview\.m-nejatmand\.workers\.dev/);
  assert.match(workflow, /unauth_status=/);
  assert.match(workflow, /Unauthenticated preview API access returned HTTP/);
  assert.match(workflow, /CF-Access-Client-Id:/);
  assert.match(workflow, /CF-Access-Client-Secret:/);
  assert.match(workflow, /grep -F 'Growth Compass'/);
  assert.match(workflow, /\/api\/v1\/areas/);
  assert.match(workflow, /Cloudflare Access boundary \+ authenticated Preview smoke tests passed/);
  assert.doesNotMatch(workflow, /(?:echo|printf)[^\n]*\$(?:\{)?CF_ACCESS_CLIENT_(?:ID|SECRET)/);
});
