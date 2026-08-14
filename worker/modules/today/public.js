import { addDays, weekStart } from '../../core/dates.js';
import { activitiesContractV1 } from '../activities/public.js';
import { plansContractV1 } from '../plans/public.js';
import { progressContractV1 } from '../progress/public.js';

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

function datesBetween(start, end) {
  const dates = [];
  for (let date = start; date <= end; date = addDays(date, 1)) dates.push(date);
  return dates;
}

async function getWeeklyDirection(DB, profileId, start) {
  const end = addDays(start, 6);
  const [history, allocationModel, activities] = await Promise.all([
    progressContractV1.listHistory(DB, profileId, {
      from: start,
      to: end,
      limit: 500,
      includeLegacy: true
    }),
    plansContractV1.getActiveAllocationsForRange(DB, profileId, start, end),
    activitiesContractV1.listReferences(DB, profileId, {
      includeArchived: true
    })
  ]);

  const actualByGoal = new Map();
  for (const item of history) {
    if (item.goal_id == null) continue;
    const goalId = Number(item.goal_id);
    actualByGoal.set(
      goalId,
      (actualByGoal.get(goalId) || 0) + Math.max(0, Number(item.minutes) || 0)
    );
  }

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
      totals.set(goalId, {
        goal_id: goalId,
        name: `Goal ${goalId}`,
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

export const todayContractV1 = Object.freeze({
  getWeeklyDirection,

  async getDay(DB, profileId, date) {
    const start = weekStart(date);
    const [weeklyDirection, progress] = await Promise.all([
      getWeeklyDirection(DB, profileId, start),
      progressContractV1.listHistory(DB, profileId, {
        from: date,
        to: date,
        limit: 100,
        includeLegacy: true
      })
    ]);

    return Object.freeze({
      date,
      week_start: start,
      weekly_direction: weeklyDirection,
      progress
    });
  }
});
