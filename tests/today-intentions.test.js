import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile(new URL('../migrations/0004_today_intentions.sql', import.meta.url), 'utf8');
const workerModule = await readFile(new URL('../worker/modules/today-intentions/module.js', import.meta.url), 'utf8');
const frontendModule = await readFile(new URL('../public/js/modules/today-intentions/module.js', import.meta.url), 'utf8');
const logger = await readFile(new URL('../public/js/features/logger.js', import.meta.url), 'utf8');

test('Today intentions persist separately from completed progress', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS today_intentions/);
  assert.match(migration, /planned/);
  assert.match(migration, /in_progress/);
  assert.match(migration, /completed/);
  assert.doesNotMatch(migration, /CREATE TABLE.*progress_records/is);
});

test('Today intentions are registered as an isolated module contract', () => {
  assert.match(workerModule, /id: 'today-intentions'/);
  assert.match(workerModule, /\/api\/v1\/today-intentions/);
  assert.match(frontendModule, /id: 'today-intentions'/);
  assert.match(frontendModule, /name: 'today-after-capacity'/);
  assert.doesNotMatch(frontendModule, /from '\.\.\/\.\.\/features\/today\.js'/);
  assert.doesNotMatch(frontendModule, /from '\.\.\/\.\.\/features\/logger\.js'/);
});

test('planning and starting do not call completed-progress persistence', () => {
  const planningBranch = logger.match(/if \(mode === 'planned' \|\| mode === 'in_progress'\) \{([\s\S]*?)return;/)?.[1] || '';
  assert.match(planningBranch, /onIntent/);
  assert.doesNotMatch(planningBranch, /\/api\/session/);
});
