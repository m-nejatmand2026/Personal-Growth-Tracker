import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const map = await readFile(new URL('../docs/DOCUMENTATION_MAP.md', import.meta.url), 'utf8');

test('README identifies the current Growth Compass Beta and authoritative engineering documents', () => {
  assert.match(readme, /^# Growth Compass — Version 1 Beta/m);
  for (const path of [
    'docs/MODULARITY_STANDARD.md',
    'docs/ARCHITECTURE.md',
    'docs/EXPERIENCE_ARCHITECTURE.md',
    'docs/API_CONTRACTS.md',
    'docs/DEVELOPMENT_WORKFLOW.md',
    'docs/D1_MIGRATION_RUNBOOK.md',
    'docs/OPERATIONS_RUNBOOK.md',
    'docs/DOCUMENTATION_MAP.md'
  ]) {
    assert.match(readme, new RegExp(path.replaceAll('.', '\\.')));
  }
});

test('README cannot regress to obsolete tracker bootstrap or destructive remote setup instructions', () => {
  assert.doesNotMatch(readme, /Momente B1|weekly targets|six-month plan/i);
  assert.doesNotMatch(readme, /REPLACE_WITH_D1_DATABASE_ID/);
  assert.doesNotMatch(readme, /wrangler d1 create personal-growth-tracker/);
  assert.doesNotMatch(readme, /Copy the returned database ID/i);
  assert.match(readme, /Automatic Preview deployment never applies D1 migrations/);
  assert.match(readme, /local clone, PowerShell, Wrangler login or manual deploy is \*\*not required\*\*/);
});

test('documentation map makes modularity and operational precedence explicit', () => {
  assert.match(map, /MODULARITY_STANDARD\.md.*highest architecture authority/s);
  assert.match(map, /Operational runbooks override old README\/manual command snippets/);
  assert.match(map, /Revision A material.*does not override accepted Revision B\/shared-framework decisions/s);
  assert.match(map, /mockups do not authorize invented metrics/i);
});
