function boundedLimit(
  value,
  fallback = 100,
  maximum = 500
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(number)
    || number <= 0
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    number
  );
}

export async function getProgressRecord(
  DB,
  profileId,
  id
) {
  return DB.prepare(`
    SELECT *
    FROM progress_records
    WHERE profile_id=?
      AND id=?
  `)
    .bind(
      profileId,
      id
    )
    .first();
}

export async function createProgressRecord(
  DB,
  profileId,
  input
) {
  const result =
    await DB.prepare(`
      INSERT INTO progress_records(
        profile_id,
        goal_id,
        activity_id,
        occurred_on,
        started_at,
        minutes,
        quantity,
        boolean_value,
        subtype,
        note,
        source
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?)
    `)
      .bind(
        profileId,
        input.goal_id,
        input.activity_id,
        input.occurred_on,
        input.started_at || null,
        input.minutes,
        input.quantity,
        input.boolean_value,
        input.subtype || null,
        input.note || null,
        input.source || 'manual'
      )
      .run();

  return getProgressRecord(
    DB,
    profileId,
    result.meta.last_row_id
  );
}

export async function deleteProgressRecord(
  DB,
  profileId,
  id
) {
  return DB.prepare(`
    DELETE FROM progress_records
    WHERE profile_id=?
      AND id=?
  `)
    .bind(
      profileId,
      id
    )
    .run();
}

export async function listProgressRecords(
  DB,
  profileId,
  {
    from = null,
    to = null,
    limit = 100
  } = {}
) {
  const where =
    ['profile_id=?'];

  const bindings =
    [profileId];

  if (from) {
    where.push(
      'occurred_on>=?'
    );

    bindings.push(from);
  }

  if (to) {
    where.push(
      'occurred_on<=?'
    );

    bindings.push(to);
  }

  const rowLimit =
    boundedLimit(
      limit
    );

  const { results } =
    await DB.prepare(`
      SELECT *
      FROM progress_records
      WHERE ${where.join(' AND ')}
      ORDER BY
        occurred_on DESC,
        id DESC
      LIMIT ${rowLimit}
    `)
      .bind(
        ...bindings
      )
      .all();

  return results;
}

export async function summarizeProgressMinutesByGoal(
  DB,
  profileId,
  {
    from,
    to
  }
) {
  const { results } = await DB.prepare(`
    SELECT
      goal_id,
      SUM(COALESCE(minutes, 0)) AS actual_minutes
    FROM progress_records
    WHERE profile_id=?
      AND occurred_on>=?
      AND occurred_on<=?
      AND goal_id IS NOT NULL
    GROUP BY goal_id
  `)
    .bind(profileId, from, to)
    .all();

  return results;
}

/**
 * Legacy Beta compatibility.
 *
 * The old sessions table has no profile_id. It belongs only
 * to the original default profile and must never leak into a
 * future generic user.
 *
 * No new Progress writes target this table.
 */
export async function listLegacySessions(
  DB,
  profileId,
  {
    from = null,
    to = null,
    limit = 100
  } = {}
) {
  if (
    profileId !== 'default'
  ) {
    return [];
  }

  const where = [];
  const bindings = [];

  if (from) {
    where.push(
      'occurred_on>=?'
    );

    bindings.push(from);
  }

  if (to) {
    where.push(
      'occurred_on<=?'
    );

    bindings.push(to);
  }

  const clause =
    where.length
      ? `WHERE ${where.join(' AND ')}`
      : '';

  const rowLimit =
    boundedLimit(
      limit
    );

  const { results } =
    await DB.prepare(`
      SELECT
        id,
        occurred_on,
        activity_key,
        minutes,
        subtype,
        note,
        created_at
      FROM sessions
      ${clause}
      ORDER BY
        occurred_on DESC,
        id DESC
      LIMIT ${rowLimit}
    `)
      .bind(
        ...bindings
      )
      .all();

  return results;
}

export async function summarizeLegacyMinutesByActivityKey(
  DB,
  profileId,
  {
    from,
    to
  }
) {
  if (profileId !== 'default') return [];

  const { results } = await DB.prepare(`
    SELECT
      activity_key,
      SUM(COALESCE(minutes, 0)) AS actual_minutes
    FROM sessions
    WHERE occurred_on>=?
      AND occurred_on<=?
    GROUP BY activity_key
  `)
    .bind(from, to)
    .all();

  return results;
}

export async function exportProgressData(
  DB,
  profileId
) {
  const { results } =
    await DB.prepare(`
      SELECT *
      FROM progress_records
      WHERE profile_id=?
      ORDER BY occurred_on,id
    `)
      .bind(profileId)
      .all();

  return results;
}
