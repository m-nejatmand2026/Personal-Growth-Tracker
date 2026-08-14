import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/deploy-preview.yml', import.meta.url), 'utf8');
const wrangler = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

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
});

test('preview deployment is structurally pinned to preview Worker and preview D1', () => {
  assert.match(workflow, /personal-growth-tracker-preview/);
  assert.match(workflow, /1937971c-f2f2-4dad-bc65-3d22952584bb/);
  assert.match(workflow, /a182d8c8-c009-461e-ac7e-04694c1047ab/);
  assert.match(workflow, /Preview environment points at production D1\. Refusing deployment\./);

  const config = JSON.parse(wrangler);
  const previewDb = config.env?.preview?.d1_databases?.find((item) => item.binding === 'DB');
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
  for (const command of deployCommands) assert.match(command, /--env preview/);
  assert.match(deployCommands[0], /--dry-run/);
  assert.doesNotMatch(deployCommands[1], /--dry-run/);
});

test('Cloudflare credentials remain secret-backed and preview is smoke tested after deployment', () => {
  assert.match(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /secrets\.CLOUDFLARE_ACCOUNT_ID/);
  assert.match(workflow, /Missing CLOUDFLARE_API_TOKEN repository secret/);
  assert.match(workflow, /Missing CLOUDFLARE_ACCOUNT_ID repository secret/);
  assert.match(workflow, /https:\/\/personal-growth-tracker-preview\.m-nejatmand\.workers\.dev\//);
  assert.match(workflow, /grep -F 'Growth Compass'/);
});
