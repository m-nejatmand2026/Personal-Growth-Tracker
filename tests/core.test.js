import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, todayInTimeZone, weekStart } from '../worker/core/dates.js';
import { energyScore, valenceScore } from '../public/js/config/energy.js';
import { formatMinutes } from '../public/js/core/format.js';

test('weekStart uses Monday as the start of week', () => {
  assert.equal(weekStart('2026-08-12'), '2026-08-10');
  assert.equal(weekStart('2026-08-16'), '2026-08-10');
});

test('addDays crosses month boundaries safely', () => {
  assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  assert.equal(addDays('2026-09-01', -1), '2026-08-31');
});

test('todayInTimeZone resolves the civil day instead of UTC day', () => {
  const instant = new Date('2026-08-12T22:30:00Z');
  assert.equal(todayInTimeZone('Europe/Berlin', instant), '2026-08-13');
  assert.equal(todayInTimeZone('America/New_York', instant), '2026-08-12');
});

test('energy scoring preserves canonical six-row scale', () => {
  assert.deepEqual([0,1,2,3,4,5].map(energyScore), [3,2,1,-1,-2,-3]);
});

test('valence scoring preserves canonical six-column scale', () => {
  assert.deepEqual([0,1,2,3,4,5].map(valenceScore), [-3,-2,-1,1,2,3]);
});

test('formatMinutes renders compact hours and minutes', () => {
  assert.equal(formatMinutes(30), '30m');
  assert.equal(formatMinutes(80), '1h 20m');
  assert.equal(formatMinutes(120), '2h');
});
