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

function dailyShare(minutes, period, dateText) {
  const value = Math.max(0, Number(minutes) || 0);
  if (!value || period === 'none' || period === 'custom') return 0;
  if (period === 'daily') return value;
  if (period === 'weekly') return value / 7;

  const date = new Date(`${dateText}T12:00:00Z`);
  if (period === 'monthly') {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const days = new Date(Date.UTC(y, m + 1, 0, 12)).getUTCDate();
    return value / days;
  }
  if (period === 'yearly') return value / daysInYear(date.getUTCFullYear());
  return 0;
}

export async function getPlannedGoalMinutes(DB, profileId, dateText, period) {
  const bounds = periodBounds(dateText, period);
  const dates = enumerateCivilDates(bounds.start, bounds.end);

  const { results } = await DB.prepare(`
    SELECT pv.id AS plan_version_id,pv.effective_from,pv.effective_to,
           gpv.goal_id,g.name,g.sort_order,
           gpv.time_target_minutes,gpv.time_minimum_minutes,gpv.period
    FROM plan_versions pv
    JOIN goal_plan_values gpv ON gpv.plan_version_id=pv.id
    JOIN goals g ON g.id=gpv.goal_id
    WHERE pv.profile_id=?
      AND pv.effective_from<=?
      AND (pv.effective_to IS NULL OR pv.effective_to>=?)
      AND g.profile_id=? AND g.status='active'
    ORDER BY pv.effective_from,g.sort_order,g.name
  `).bind(profileId, bounds.end, bounds.start, profileId).all();

  const versions = new Map();
  for (const row of results) {
    if (!versions.has(row.plan_version_id)) {
      versions.set(row.plan_version_id, {
        id: row.plan_version_id,
        effective_from: row.effective_from,
        effective_to: row.effective_to,
        rows: []
      });
    }
    versions.get(row.plan_version_id).rows.push(row);
  }

  const orderedVersions = [...versions.values()].sort((a, b) => a.effective_from.localeCompare(b.effective_from));
  const goalTotals = new Map();
  const usedPlanVersions = new Set();

  for (const date of dates) {
    let activeVersion = null;
    for (const version of orderedVersions) {
      if (version.effective_from <= date && (!version.effective_to || version.effective_to >= date)) {
        activeVersion = version;
      }
    }
    if (!activeVersion) continue;
    usedPlanVersions.add(activeVersion.id);

    for (const row of activeVersion.rows) {
      const current = goalTotals.get(row.goal_id) || {
        goal_id: row.goal_id,
        name: row.name,
        period_target_minutes: 0,
        period_minimum_minutes: 0
      };
      current.period_target_minutes += dailyShare(row.time_target_minutes, row.period, date);
      current.period_minimum_minutes += dailyShare(row.time_minimum_minutes, row.period, date);
      goalTotals.set(row.goal_id, current);
    }
  }

  const goals = [...goalTotals.values()]
    .map(goal => ({
      ...goal,
      period_target_minutes: Math.round(goal.period_target_minutes),
      period_minimum_minutes: Math.round(goal.period_minimum_minutes)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    plan_version_ids: [...usedPlanVersions],
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
    plan_version_ids: plan.plan_version_ids,
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
