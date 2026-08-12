import { calculateCapacity, calculatePlanLoad, enumerateCivilDates, periodBounds } from '../domain/capacity.js';

export async function listCapacityCommitments(DB, profileId, includeInactive = false) {
  const query = includeInactive
    ? `SELECT * FROM capacity_commitments WHERE profile_id=? ORDER BY active DESC,sort_order,name`
    : `SELECT * FROM capacity_commitments WHERE profile_id=? AND active=1 ORDER BY sort_order,name`;
  const { results } = await DB.prepare(query).bind(profileId).all();
  return results;
}

function daysInYear(year) {
  const start = Date.UTC(year, 0, 1);
  const next = Date.UTC(year + 1, 0, 1);
  return Math.round((next - start) / 86400000);
}

function plannedMinutesForDates(minutes, period, dates) {
  const value = Math.max(0, Number(minutes) || 0);
  if (!value || period === 'none' || period === 'custom') return 0;
  let total = 0;
  for (const dateText of dates) {
    const date = new Date(`${dateText}T12:00:00Z`);
    if (period === 'daily') total += value;
    else if (period === 'weekly') total += value / 7;
    else if (period === 'monthly') {
      const y = date.getUTCFullYear();
      const m = date.getUTCMonth();
      const days = new Date(Date.UTC(y, m + 1, 0, 12)).getUTCDate();
      total += value / days;
    } else if (period === 'yearly') {
      total += value / daysInYear(date.getUTCFullYear());
    }
  }
  return Math.round(total);
}

export async function getPlannedGoalMinutes(DB, profileId, dateText, period) {
  const bounds = periodBounds(dateText, period);
  const dates = enumerateCivilDates(bounds.start, bounds.end);
  const plan = await DB.prepare(`
    SELECT id FROM plan_versions
    WHERE profile_id=? AND effective_from<=?
      AND (effective_to IS NULL OR effective_to>=?)
    ORDER BY effective_from DESC LIMIT 1
  `).bind(profileId, dateText, dateText).first();
  if (!plan) return { plan_version_id: null, planned_minutes: 0, goals: [] };

  const { results } = await DB.prepare(`
    SELECT gpv.goal_id,g.name,gpv.time_target_minutes,gpv.time_minimum_minutes,gpv.period
    FROM goal_plan_values gpv
    JOIN goals g ON g.id=gpv.goal_id
    WHERE gpv.plan_version_id=? AND g.profile_id=? AND g.status='active'
    ORDER BY g.sort_order,g.name
  `).bind(plan.id, profileId).all();

  const goals = results.map(row => ({
    ...row,
    period_target_minutes: plannedMinutesForDates(row.time_target_minutes, row.period, dates),
    period_minimum_minutes: plannedMinutesForDates(row.time_minimum_minutes, row.period, dates)
  }));
  return {
    plan_version_id: plan.id,
    planned_minutes: goals.reduce((sum, goal) => sum + goal.period_target_minutes, 0),
    minimum_minutes: goals.reduce((sum, goal) => sum + goal.period_minimum_minutes, 0),
    goals
  };
}

export async function getCapacitySummary(DB, profileId, dateText, period) {
  const commitments = await listCapacityCommitments(DB, profileId, false);
  const capacity = calculateCapacity(commitments, dateText, period);
  const plan = await getPlannedGoalMinutes(DB, profileId, dateText, period);
  const planLoad = calculatePlanLoad(plan.planned_minutes, capacity.flexible_minutes);
  return {
    ...capacity,
    planned_goal_minutes: plan.planned_minutes,
    minimum_goal_minutes: plan.minimum_minutes,
    plan_load: Number.isFinite(planLoad) ? planLoad : null,
    impossible_by_minutes: planLoad === Infinity || plan.planned_minutes > capacity.flexible_minutes,
    plan_version_id: plan.plan_version_id,
    goals: plan.goals,
    commitments
  };
}

export async function createCapacityCommitment(DB, profileId, input) {
  const result = await DB.prepare(`
    INSERT INTO capacity_commitments(
      profile_id,kind,name,minutes,weekday_mask,effective_from,effective_to,protected,active,sort_order
    ) VALUES(?,?,?,?,?,?,?,?,?,?)
  `).bind(
    profileId,
    input.kind,
    input.name,
    input.minutes,
    input.weekday_mask,
    input.effective_from || null,
    input.effective_to || null,
    input.protected === false ? 0 : 1,
    input.active === false ? 0 : 1,
    Number(input.sort_order) || 100
  ).run();
  return DB.prepare('SELECT * FROM capacity_commitments WHERE id=? AND profile_id=?')
    .bind(result.meta.last_row_id, profileId).first();
}

export async function updateCapacityCommitment(DB, profileId, id, input) {
  await DB.prepare(`
    UPDATE capacity_commitments
    SET kind=?,name=?,minutes=?,weekday_mask=?,effective_from=?,effective_to=?,
        protected=?,active=?,sort_order=?,updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND profile_id=?
  `).bind(
    input.kind,
    input.name,
    input.minutes,
    input.weekday_mask,
    input.effective_from || null,
    input.effective_to || null,
    input.protected === false ? 0 : 1,
    input.active === false ? 0 : 1,
    Number(input.sort_order) || 0,
    id,
    profileId
  ).run();
  return DB.prepare('SELECT * FROM capacity_commitments WHERE id=? AND profile_id=?').bind(id, profileId).first();
}
