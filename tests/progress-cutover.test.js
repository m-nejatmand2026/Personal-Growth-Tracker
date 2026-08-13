import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

async function exists(url) {
  try { await access(url); return true; } catch { return false; }
}

const bootstrap = await readFile(new URL('../worker/data/bootstrap.js', import.meta.url), 'utf8');
const history = await readFile(new URL('../worker/routes/history.js', import.meta.url), 'utf8');
const week = await readFile(new URL('../worker/routes/week.js', import.meta.url), 'utf8');
const compatibilityWeek = await readFile(new URL('../worker/compatibility/legacy-beta/progress.js', import.meta.url), 'utf8');
const sessionsRoute = await readFile(new URL('../worker/routes/sessions.js', import.meta.url), 'utf8');
const logger = await readFile(new URL('../public/js/features/logger.js', import.meta.url), 'utf8');
const progressUi = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');

test('Shared Progress data implementation is gone', async () => {
  assert.equal(await exists(new URL('../worker/data/progress.js', import.meta.url)), false);
});

test('Bootstrap composes factual history through Progress public contract', () => {
  assert.match(bootstrap, /progressContractV1/);
  assert.match(bootstrap, /modules\/progress\/public\.js/);
  assert.doesNotMatch(bootstrap, /\bFROM\s+sessions\b/i);
  assert.doesNotMatch(bootstrap, /\bJOIN\s+activities\b/i);
});

test('Legacy history composes Progress facts without private table joins', () => {
  assert.match(history, /progressContractV1/);
  assert.match(history, /modules\/progress\/public\.js/);
  assert.doesNotMatch(history, /\bFROM\s+sessions\b/i);
  assert.doesNotMatch(history, /\bJOIN\s+activities\b/i);
});

test('Legacy week delegates to explicit compatibility adapter', () => {
  assert.match(week, /compatibility\/legacy-beta\/progress\.js/);
  assert.doesNotMatch(week, /data\/progress\.js/);
  assert.match(compatibilityWeek, /progressContractV1/);
  assert.doesNotMatch(compatibilityWeek, /\bFROM\s+sessions\b/i);
});

test('Legacy session POST can only forward to Progress V1', () => {
  assert.match(sessionsRoute, /progressContractV1/);
  assert.match(sessionsRoute, /compatibility: 'progress-v1'/);
  assert.doesNotMatch(sessionsRoute, /\bINSERT\s+INTO\s+sessions\b/i);
  assert.doesNotMatch(sessionsRoute, /\bUPDATE\s+sessions\b/i);
  assert.doesNotMatch(sessionsRoute, /\bDELETE\s+FROM\s+sessions\b/i);
});

test('Universal Logger uses canonical Activities and Progress APIs', () => {
  assert.match(logger, /\/api\/v1\/activities/);
  assert.match(logger, /\/api\/v1\/progress/);
  assert.doesNotMatch(logger, /api\(['"]\/api\/session/);
});

test('Progress UI owns canonical history and deletion', () => {
  assert.match(progressUi, /\/api\/v1\/progress/);
  assert.match(progressUi, /data-delete-progress/);
  assert.match(progressUi, /Beta history/);
  assert.doesNotMatch(progressUi, /data-delete-session/);
});

test('App composes Progress from frontend registry and subscribes Journal once', () => {
  assert.match(app, /moduleRegistry\.get\('progress'\)/);
  assert.doesNotMatch(app, /features\/progress\.js/);
  assert.equal((app.match(/eventBus\.subscribe\(\s*['"]journal\.view-requested['"]/g) || []).length, 1);
});
