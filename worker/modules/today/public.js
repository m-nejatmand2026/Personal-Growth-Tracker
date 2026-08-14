import { addDays, weekStart } from '../../core/dates.js';
import { activitiesContractV1 } from '../activities/public.js';
import { plansContractV1 } from '../plans/public.js';
import { progressContractV1 } from '../progress/public.js';

export const TODAY_DIRECTION_PERIODS = Object.freeze(['day', 'week', 'month', 'year']);

function daysInYear(year) {
  return Math.round(
    (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000
  );
}

function dailyShare(minutes, period, dateText) {
  const value = Math.max(0, Number(minutes) || 0);
  if (!value || period === 'none' || period === 'custom') return 0;
  if (period === 'daily') return value;
  if (period === 'weekly') return value / 7;

  const date = new Date(`${dateText}T12:00:00Z`);
  if (period === 'monthly') {
    const days = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)
    ).getUTCDate();
    return value / days;
  }
  if (period === 'yearly') return value / daysInYear(date.getUTCFullYear());
  return 0;
}

function dateKey(year, month, day) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function directionRange(dateText, period = 'week') {
  const date = new Date(`${dateText}T12:00:00Z`);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  if (period === 'day') {
    return Object.freeze({ start: dateText, end: dateText });
  }

  if (period === 'month') {
    const lastDay = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
    return Object.freeze({
      start: dateKey(year, month, 1),
      end: dateKey(year, month, lastDay)
    });
  }

  if (period === 'year') {
    return Object.freeze({
      start: dateKey(year, 1, 1),
      end: dateKey(year, 12, 31)
    });
  }

  const start = weekStart(dateText);
  return Object.freeze({ start, end: addDays(start, 6) });
}

function datesBetween(start, end) {
  const dates = [];
  for (let date = start; date <= end; date = addDays(date, 1)) dates.push(date);
  return dates;
}

async function getDirection(DB, profileId, start, end) {
  const [actualRows, allocationModel, activities] = await Promise.all([
    progressContractV1.sumMinutesByGoal(DB, profileId, {
      from: start,
      to: end,
      includeLegacy: true
    }),
    plansContractV1.getActiveAllocationsForRange(DB, profileId, start, end),
    activitiesContractV1.listReferences(DB, profileId, {
      includeArchived: true
    })
  ]);

  const actualByGoal = new Map(
    actualRows.map((row) => [Number(row.goal_id), Math.max(0, Number(row.actual_minutes) || 0)])
  );

  const activityByGoal = new Map();
  for (const activity of activities) {
    const goalId = Number(activity.goal_id);
    if (!activityByGoal.has(goalId)) activityByGoal.set(goalId, activity);
  }

  const totals = new Map();
  for (const date of datesBetween(start, end)) {
    let version = null;
    for (const candidate of allocationModel.versions) {
      if (
        candidate.effective_from <= date
        && (!candidate.effective_to || candidate.effective_to >= date)
      ) {
        version = candidate;
      }
    }
    if (!version) continue;

    for (const value of version.values) {
      const goalId = Number(value.goal_id);
      const current = totals.get(goalId) || {
        goal_id: goalId,
        name: value.goal_name,
        target_minutes: 0,
        minimum_minutes: 0
      };
      current.target_minutes += dailyShare(
        value.time_target_minutes,
        value.period,
        date
      );
      current.minimum_minutes += dailyShare(
        value.time_minimum_minutes,
        value.period,
        date
      );
      totals.set(goalId, current);
    }
  }

  for (const [goalId] of actualByGoal) {
    if (!totals.has(goalId)) {
      const activity = activityByGoal.get(goalId);
      totals.set(goalId, {
        goal_id: goalId,
        name: activity?.goal_name || `Goal ${goalId}`,
        target_minutes: 0,
        minimum_minutes: 0
      });
    }
  }

  return Object.freeze(
    [...totals.values()]
      .map((row) => {
        const activity = activityByGoal.get(row.goal_id);
        const actual = actualByGoal.get(row.goal_id) || 0;
        const target = Math.round(row.target_minutes);
        const minimum = Math.round(row.minimum_minutes);
        return Object.freeze({
          goal_id: row.goal_id,
          key: activity?.key || '',
          name: row.name,
          target_minutes: target,
          minimum_minutes: minimum,
          actual_minutes: actual,
          progress: target ? Math.min(1, actual / target) : 0
        });
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

async function getWeeklyDirection(DB, profileId, start) {
  return getDirection(DB, profileId, start, addDays(start, 6));
}

export const todayContractV1 = Object.freeze({
  getWeeklyDirection,
  getDirection,

  async getDay(DB, profileId, date, { period = 'week' } = {}) {
    const selectedPeriod = TODAY_DIRECTION_PERIODS.includes(period) ? period : 'week';
    const range = directionRange(date, selectedPeriod);
    const [direction, progress] = await Promise.all([
      getDirection(DB, profileId, range.start, range.end),
      progressContractV1.listHistory(DB, profileId, {
        from: date,
        to: date,
        limit: 100,
        includeLegacy: true
      })
    ]);

    return Object.freeze({
      date,
      week_start: weekStart(date),
      direction_period: selectedPeriod,
      direction_start: range.start,
      direction_end: range.end,
      direction,
      weekly_direction: selectedPeriod === 'week' ? direction : Object.freeze([]),
      progress
    });
  }
});
