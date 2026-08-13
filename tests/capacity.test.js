import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCapacity,
  calculatePlanLoad,
  commitmentMinutesForDate,
  monthBounds,
  periodBounds,
  scaleWeeklyMinutes
} from '../worker/domain/capacity.js';

const personalCommitments = [
  { kind: 'sleep', minutes: 480, weekday_mask: 127, active: 1 },
  { kind: 'work', minutes: 540, weekday_mask: 31, active: 1 },
  { kind: 'commute', minutes: 60, weekday_mask: 31, active: 1 },
  { kind: 'life', minutes: 120, weekday_mask: 127, active: 1 },
  { kind: 'recovery', minutes: 60, weekday_mask: 127, active: 1 },
  { kind: 'recovery', minutes: 30, weekday_mask: 127, active: 1 }
];

test('specific calendar months use their real day counts', () => {
  assert.deepEqual(monthBounds('2026-08-12'), {
    start: '2026-08-01',
    end: '2026-08-31',
    days: 31
  });
  assert.deepEqual(monthBounds('2026-09-12'), {
    start: '2026-09-01',
    end: '2026-09-30',
    days: 30
  });
});

test('day/week/month total capacity uses civil 24-hour days', () => {
  assert.equal(periodBounds('2026-08-12', 'day').days * 24, 24);
  assert.equal(periodBounds('2026-08-12', 'week').days * 24, 168);
  assert.equal(calculateCapacity([], '2026-08-12', 'month').total_minutes / 60, 744);
  assert.equal(calculateCapacity([], '2026-09-12', 'month').total_minutes / 60, 720);
});

test('weekday commitments are counted only on selected weekdays', () => {
  const monday = calculateCapacity(personalCommitments, '2026-08-10', 'day');
  const saturday = calculateCapacity(personalCommitments, '2026-08-15', 'day');
  assert.equal(monday.committed_minutes, 1290);
  assert.equal(monday.flexible_minutes, 150);
  assert.equal(saturday.committed_minutes, 690);
  assert.equal(saturday.flexible_minutes, 750);
});

test('one commitment can use different durations for different weekdays', () => {
  const sleep = {
    kind: 'sleep',
    minutes: 480,
    weekday_mask: 127,
    daily_minutes: [480, 480, 480, 480, 480, 600, 480],
    active: 1
  };
  assert.equal(commitmentMinutesForDate(sleep, '2026-08-10'), 480);
  assert.equal(commitmentMinutesForDate(sleep, '2026-08-15'), 600);
  assert.equal(calculateCapacity([sleep], '2026-08-10', 'week').committed_minutes, 3480);
});

test('effective-dated commitment versions preserve earlier capacity history', () => {
  const versions = [
    {
      kind: 'sleep',
      minutes: 480,
      weekday_mask: 127,
      active: 1,
      effective_to: '2026-08-31'
    },
    {
      kind: 'sleep',
      minutes: 480,
      weekday_mask: 127,
      daily_minutes: [480, 480, 480, 480, 480, 600, 480],
      active: 1,
      effective_from: '2026-09-01'
    }
  ];
  assert.equal(calculateCapacity(versions, '2026-08-15', 'day').committed_minutes, 480);
  assert.equal(calculateCapacity(versions, '2026-09-05', 'day').committed_minutes, 600);
});

test('weekly target scaling respects exact period length rather than four-week months', () => {
  assert.equal(scaleWeeklyMinutes(216, 31), 957);
  assert.equal(scaleWeeklyMinutes(216, 30), 926);
});

test('plan load is planned goal time divided by flexible capacity', () => {
  assert.equal(calculatePlanLoad(600, 1200), 0.5);
  assert.equal(calculatePlanLoad(0, 0), 0);
  assert.equal(calculatePlanLoad(60, 0), Infinity);
});
