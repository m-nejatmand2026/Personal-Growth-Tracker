import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

async function exists(url) {
  try { await access(url); return true; } catch { return false; }
}

const bootstrap = await readFile(new URL('../worker/compatibility/legacy-beta/bootstrap.js', import.meta.url), 'utf8');
const history = await readFile(new URL('../worker/routes/history.js', import.meta.url), 'utf8');
const week = await readFile(new URL('../worker/routes/week.js', import.meta.url), 'utf8');
const todayPublic = await readFile(new URL('../worker/modules/today/public.js', import.meta.url), 'utf8');
const sessionsRoute = await readFile(new URL('../worker/routes/sessions.js', import.meta.url), 'utf8');
const logger = await readFile(new URL('../public/js/modules/logger/ui.js', import.meta.url), 'utf8');
const activitiesFrontend = await readFile(new URL('../public/js/modules/activities/module.js', import.meta.url), 'utf8');
const progressUi = await readFile(new URL('../public/js/modules/progress/ui.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../public/js/app.js', import.meta.url), 'utf8');

test('Shared Progress and bootstrap business implementations are gone', async () => {
  assert.equal(await exists(new URL('../worker/data/progress.js', import.meta.url)), false);
  assert.equal(await exists(new URL('../worker/data/bootstrap.js', import.meta.url)), false);
});

test('Bootstrap compatibility composer delegates runtime summary to Today', () => {
  assert.match(bootstrap, /todayContractV1/);
  assert.match(bootstrap, /modules\/today\/public\.js/);
  assert.match(todayPublic, /progressContractV1/);
  assert.doesNotMatch(bootstrap, /\bFROM\s+sessions\b/i);
  assert.doesNotMatch(bootstrap, /\bJOIN\s+activities\b/i);
});

test('Legacy history composes Progress facts without private table joins', () => {
  assert.match(history, /progressContractV1/);
  assert.match(history, /modules\/progress\/public\.js/);
  assert.doesNotMatch(history, /\bFROM\s+sessions\b/i);
  assert.doesNotMatch(history, /\bJOIN\s+activities\b/i);
});

test('Legacy week delegates to the Today public contract', async () => {
  assert.match(week, /modules\/today\/public\.js/);
  assert.match(week, /todayContractV1/);
  assert.match(week, /isDateKey/);
  assert.doesNotMatch(week, /data\/progress\.js/);
  assert.match(todayPublic, /progressContractV1/);
  assert.doesNotMatch(todayPublic, /\bFROM\s+sessions\b/i);
  assert.equal(
    await exists(new URL('../worker/compatibility/legacy-beta/progress.js', import.meta.url)),
    false
  );
});

test('Legacy session POST can only forward to Progress V1', () => {
  assert.match(sessionsRoute, /progressContractV1/);
  assert.match(sessionsRoute, /compatibility: 'progress-v1'/);
  assert.doesNotMatch(sessionsRoute, /\bINSERT\s+INTO\s+sessions\b/i);
  assert.doesNotMatch(sessionsRoute, /\bUPDATE\s+sessions\b/i);
  assert.doesNotMatch(sessionsRoute, /\bDELETE\s+FROM\s+sessions\b/i);
});

test('Universal Logger consumes canonical Activities capability plus Progress and Daily Plan APIs', () => {
  assert.match(app, /activities\s*=\s*moduleRegistry\.get\('activities'\)/);
  assert.match(app, /create\(\{\s*onSaved:\s*load,\s*activities\s*\}\)/);
  assert.match(logger, /activityCapability\?\.list/);
  assert.match(logger, /activityCapability\.create/);
  assert.doesNotMatch(logger, /\/api\/v1\/activities|\/api\/v1\/goals/);
  assert.match(activitiesFrontend, /\/api\/v1\/activities/);
  assert.match(logger, /\/api\/v1\/progress/);
  assert.match(logger, /\/api\/v1\/daily-plan/);
  assert.doesNotMatch(logger, /api\(['"]\/api\/session/);
  assert.doesNotMatch(logger, /onIntent/);
});

test('Progress UI owns canonical history and deletion', () => {
  assert.match(progressUi, /\/api\/v1\/progress/);
  assert.match(progressUi, /data-delete-progress/);
  assert.match(progressUi, /Earlier Beta/);
  assert.doesNotMatch(progressUi, /data-delete-session/);
  assert.doesNotMatch(progressUi, /state\.data|\/api\/history/);
});

test('App composes Progress from frontend registry and subscribes Journal once', () => {
  assert.match(app, /moduleRegistry\.get\('progress'\)/);
  assert.doesNotMatch(app, /features\/progress\.js/);
  assert.doesNotMatch(app, /\/api\/bootstrap|state\.data/);
  assert.equal((app.match(/eventBus\.subscribe\(\s*['"]journal\.preview-selected['"]/g) || []).length, 1);
});
