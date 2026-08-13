import {
  calculateCapacity,
  calculatePlanLoad,
  enumerateCivilDates,
  periodBounds
} from './domain.js';

import {
  plansContractV1
} from '../plans/public.js';

function parseDailyMinutes(raw) {
  if (!raw) return null;

  try {
    const value =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : raw;

    return (
      Array.isArray(value)
      && value.length === 7
    )
      ? value.map(
          (item) =>
            Number(item) || 0
        )
      : null;
  } catch {
    return null;
  }
}

function hydrateCommitment(row) {
  if (!row) return row;

  return {
    ...row,

    daily_minutes:
      parseDailyMinutes(
        row.daily_minutes_json
      )
  };
}

export async function getCapacityCommitment(
  DB,
  profileId,
  id
) {
  return hydrateCommitment(
    await DB.prepare(`
      SELECT *
      FROM capacity_commitments
      WHERE id=? AND profile_id=?
    `)
      .bind(
        id,
        profileId
      )
      .first()
  );
}

export async function listCapacityCommitments(
  DB,
  profileId,
  includeInactive = false,
  activeOn = null
) {
  const filters =
    ['profile_id=?'];

  const bindings =
    [profileId];

  if (!includeInactive) {
    filters.push(
      'active=1'
    );
  }

  if (activeOn) {
    filters.push(
      '(effective_from IS NULL OR effective_from<=?)'
    );

    filters.push(
      '(effective_to IS NULL OR effective_to>=?)'
    );

    bindings.push(
      activeOn,
      activeOn
    );
  }

  const query = `
    SELECT *
    FROM capacity_commitments
    WHERE ${filters.join(' AND ')}
    ORDER BY
      active DESC,
      sort_order,
      name,
      id
  `;

  const { results } =
    await DB.prepare(query)
      .bind(...bindings)
      .all();

  return results.map(
    hydrateCommitment
  );
}

function daysInYear(year) {
  const start =
    Date.UTC(
      year,
      0,
      1
    );

  const next =
    Date.UTC(
      year + 1,
      0,
      1
    );

  return Math.round(
    (next - start)
    / 86400000
  );
}

function dailyShare(
  minutes,
  period,
  dateText
) {
  const value =
    Math.max(
      0,
      Number(minutes) || 0
    );

  if (
    !value
    || period === 'none'
    || period === 'custom'
  ) {
    return 0;
  }

  if (period === 'daily') {
    return value;
  }

  if (period === 'weekly') {
    return value / 7;
  }

  const date =
    new Date(
      `${dateText}T12:00:00Z`
    );

  if (period === 'monthly') {
    const year =
      date.getUTCFullYear();

    const month =
      date.getUTCMonth();

    const days =
      new Date(
        Date.UTC(
          year,
          month + 1,
          0,
          12
        )
      ).getUTCDate();

    return value / days;
  }

  if (period === 'yearly') {
    return (
      value
      / daysInYear(
          date.getUTCFullYear()
        )
    );
  }

  return 0;
}

export async function getPlannedGoalMinutes(
  DB,
  profileId,
  dateText,
  period
) {
  const bounds =
    periodBounds(
      dateText,
      period
    );

  const dates =
    enumerateCivilDates(
      bounds.start,
      bounds.end
    );

  const allocationModel =
    await plansContractV1
      .getActiveAllocationsForRange(
        DB,
        profileId,
        bounds.start,
        bounds.end
      );

  const versions =
    allocationModel.versions;

  const goalTotals =
    new Map();

  const usedPlanVersions =
    new Set();

  for (const date of dates) {
    let activeVersion = null;

    for (
      const version
      of versions
    ) {
      if (
        version.effective_from
          <= date

        && (
          !version.effective_to
          || version.effective_to
            >= date
        )
      ) {
        activeVersion =
          version;
      }
    }

    if (!activeVersion) {
      continue;
    }

    usedPlanVersions.add(
      activeVersion.id
    );

    for (
      const value
      of activeVersion.values
    ) {
      const current =
        goalTotals.get(
          value.goal_id
        )
        || {
          goal_id:
            value.goal_id,

          name:
            value.goal_name,

          period_target_minutes:
            0,

          period_minimum_minutes:
            0
        };

      current
        .period_target_minutes
        += dailyShare(
          value
            .time_target_minutes,
          value.period,
          date
        );

      current
        .period_minimum_minutes
        += dailyShare(
          value
            .time_minimum_minutes,
          value.period,
          date
        );

      goalTotals.set(
        value.goal_id,
        current
      );
    }
  }

  const goals =
    [...goalTotals.values()]
      .map(
        (goal) => ({
          ...goal,

          period_target_minutes:
            Math.round(
              goal
                .period_target_minutes
            ),

          period_minimum_minutes:
            Math.round(
              goal
                .period_minimum_minutes
            )
        })
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );

  return {
    plan_version_ids:
      [...usedPlanVersions],

    planned_minutes:
      goals.reduce(
        (sum, goal) =>
          sum
          + goal
            .period_target_minutes,
        0
      ),

    minimum_minutes:
      goals.reduce(
        (sum, goal) =>
          sum
          + goal
            .period_minimum_minutes,
        0
      ),

    goals
  };
}

export async function getCapacitySummary(
  DB,
  profileId,
  dateText,
  period
) {
  const commitments =
    await listCapacityCommitments(
      DB,
      profileId,
      false
    );

  const capacity =
    calculateCapacity(
      commitments,
      dateText,
      period
    );

  const plan =
    await getPlannedGoalMinutes(
      DB,
      profileId,
      dateText,
      period
    );

  const planLoad =
    calculatePlanLoad(
      plan.planned_minutes,
      capacity.flexible_minutes
    );

  return {
    ...capacity,

    planned_goal_minutes:
      plan.planned_minutes,

    minimum_goal_minutes:
      plan.minimum_minutes,

    plan_load:
      Number.isFinite(planLoad)
        ? planLoad
        : null,

    impossible_by_minutes:
      planLoad === Infinity
      || plan.planned_minutes
        > capacity.flexible_minutes,

    plan_version_ids:
      plan.plan_version_ids,

    goals:
      plan.goals,

    commitments
  };
}

export async function createCapacityCommitment(
  DB,
  profileId,
  input
) {
  const seriesId =
    input.series_id
    || crypto.randomUUID();

  const result =
    await DB.prepare(`
      INSERT INTO capacity_commitments(
        profile_id,
        kind,
        name,
        minutes,
        weekday_mask,
        effective_from,
        effective_to,
        protected,
        active,
        sort_order,
        series_id,
        daily_minutes_json
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    `)
      .bind(
        profileId,
        input.kind,
        input.name,
        input.minutes,
        input.weekday_mask,
        input.effective_from || null,
        input.effective_to || null,
        input.protected === false
          ? 0
          : 1,
        input.active === false
          ? 0
          : 1,
        Number(
          input.sort_order
        ) || 100,
        seriesId,
        input.daily_minutes
          ? JSON.stringify(
              input.daily_minutes
            )
          : null
      )
      .run();

  return getCapacityCommitment(
    DB,
    profileId,
    result.meta.last_row_id
  );
}

export async function updateCapacityCommitment(
  DB,
  profileId,
  id,
  input
) {
  await DB.prepare(`
    UPDATE capacity_commitments
    SET kind=?,
        name=?,
        minutes=?,
        weekday_mask=?,
        effective_from=?,
        effective_to=?,
        protected=?,
        active=?,
        sort_order=?,
        daily_minutes_json=?,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND profile_id=?
  `)
    .bind(
      input.kind,
      input.name,
      input.minutes,
      input.weekday_mask,
      input.effective_from || null,
      input.effective_to || null,
      input.protected === false
        ? 0
        : 1,
      input.active === false
        ? 0
        : 1,
      Number(
        input.sort_order
      ) || 0,
      input.daily_minutes
        ? JSON.stringify(
            input.daily_minutes
          )
        : null,
      id,
      profileId
    )
    .run();

  return getCapacityCommitment(
    DB,
    profileId,
    id
  );
}

export async function versionCapacityCommitment(
  DB,
  profileId,
  existing,
  input,
  versionFrom,
  previousDate
) {
  const seriesId =
    existing.series_id
    || `capacity-${existing.id}`;

  const insert =
    DB.prepare(`
      INSERT INTO capacity_commitments(
        profile_id,
        kind,
        name,
        minutes,
        weekday_mask,
        effective_from,
        effective_to,
        protected,
        active,
        sort_order,
        series_id,
        daily_minutes_json
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    `)
      .bind(
        profileId,
        input.kind,
        input.name,
        input.minutes,
        input.weekday_mask,
        versionFrom,
        input.effective_to || null,
        input.protected === false
          ? 0
          : 1,
        input.active === false
          ? 0
          : 1,
        Number(
          input.sort_order
        ) || 0,
        seriesId,
        input.daily_minutes
          ? JSON.stringify(
              input.daily_minutes
            )
          : null
      );

  const closePrevious =
    DB.prepare(`
      UPDATE capacity_commitments
      SET series_id=?,
          effective_to=?,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND profile_id=?
    `)
      .bind(
        seriesId,
        previousDate,
        existing.id,
        profileId
      );

  const results =
    await DB.batch([
      closePrevious,
      insert
    ]);

  const insertedId =
    results[1]
      ?.meta
      ?.last_row_id;

  if (insertedId) {
    return getCapacityCommitment(
      DB,
      profileId,
      insertedId
    );
  }

  return hydrateCommitment(
    await DB.prepare(`
      SELECT *
      FROM capacity_commitments
      WHERE profile_id=?
        AND series_id=?
        AND effective_from=?
      ORDER BY id DESC
      LIMIT 1
    `)
      .bind(
        profileId,
        seriesId,
        versionFrom
      )
      .first()
  );
}

export async function exportCapacityData(
  DB,
  profileId
) {
  const { results } =
    await DB.prepare(`
      SELECT *
      FROM capacity_commitments
      WHERE profile_id=?
      ORDER BY sort_order,id
    `)
      .bind(profileId)
      .all();

  return results;
}
