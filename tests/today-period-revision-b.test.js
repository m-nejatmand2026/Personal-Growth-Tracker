import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { directionRange } from '../worker/modules/today/public.js';

const todayPublic = await readFile(new URL('../worker/modules/today/public.js', import.meta.url), 'utf8');
const todayRoutes = await readFile(new URL('../worker/modules/today/routes.js', import.meta.url), 'utf8');
const progressPublic = await readFile(new URL('../worker/modules/progress/public.js', import.meta.url), 'utf8');
const progressData = await readFile(new URL('../worker/modules/progress/data.js', import.meta.url), 'utf8');

test('Today direction periods resolve exact civil ranges including leap-year February', () => {
  assert.deepEqual(directionRange('2028-02-29', 'day'), { start: '2028-02-29', end: '2028-02-29' });
  assert.deepEqual(directionRange('2028-02-29', 'week'), { start: '2028-02-28', end: '2028-03-05' });
  assert.deepEqual(directionRange('2028-02-29', 'month'), { start: '2028-02-01', end: '2028-02-29' });
  assert.deepEqual(directionRange('2028-02-29', 'year'), { start: '2028-01-01', end: '2028-12-31' });
});

test('Today period direction uses Progress aggregate and exact plan daily shares rather than frontend scaling', () => {
  assert.match(todayPublic, /progressContractV1\.sumMinutesByGoal/);
  assert.match(todayPublic, /plansContractV1\.getActiveAllocationsForRange/);
  assert.match(todayPublic, /value \/ 7/);
  assert.match(todayPublic, /getUTCMonth\(\) \+ 1, 0, 12/);
  assert.match(todayPublic, /daysInYear/);
  assert.doesNotMatch(todayPublic, /actual\s*\/\s*7|actual\s*\*\s*(?:7|12|365)/i);
});

test('Progress range aggregate is not capped by history-list limits and keeps legacy data profile-isolated', () => {
  assert.match(progressData, /summarizeProgressMinutesByGoal/);
  assert.match(progressData, /SUM\(COALESCE\(minutes, 0\)\)/);
  assert.match(progressData, /GROUP BY goal_id/);
  assert.match(progressData, /summarizeLegacyMinutesByActivityKey/);
  assert.match(progressData, /profileId !== 'default'/);
  assert.match(progressData, /GROUP BY activity_key/);
  const aggregateSection = progressData.slice(progressData.indexOf('export async function summarizeProgressMinutesByGoal'), progressData.indexOf('/**\n * Legacy Beta compatibility.'));
  assert.doesNotMatch(aggregateSection, /LIMIT/);
  assert.match(progressPublic, /async sumMinutesByGoal/);
});

test('Today API accepts only Day Week Month Year period values and defaults to Week', () => {
  assert.match(todayRoutes, /url\.searchParams\.get\('period'\) \|\| 'week'/);
  assert.match(todayRoutes, /TODAY_DIRECTION_PERIODS\.includes\(period\)/);
  assert.match(todayRoutes, /period must be day, week, month, or year/);
  assert.match(todayPublic, /TODAY_DIRECTION_PERIODS = Object\.freeze\(\['day', 'week', 'month', 'year'\]\)/);
});
