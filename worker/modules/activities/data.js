const ACTIVITY_SELECT = `
  SELECT
    id,
    profile_id,
    goal_id,
    key,
    name,
    description,
    sort_order,
    active,
    archived_at,
    created_at,
    updated_at
  FROM goal_activities
`;

export async function listActivities(
  DB,
  profileId,
  { includeArchived = false, goalId = null } = {}
) {
  const conditions = ['profile_id=?'];
  const bindings = [profileId];

  if (!includeArchived) {
    conditions.push('active=1');
  }

  if (goalId != null) {
    conditions.push('goal_id=?');
    bindings.push(goalId);
  }

  const { results } = await DB.prepare(`
    ${ACTIVITY_SELECT}
    WHERE ${conditions.join(' AND ')}
    ORDER BY sort_order, name, id
  `).bind(...bindings).all();

  return results;
}

export async function getActivity(DB, profileId, id) {
  return DB.prepare(`
    ${ACTIVITY_SELECT}
    WHERE id=? AND profile_id=?
  `).bind(id, profileId).first();
}

export async function getActivityByKey(DB, profileId, key) {
  return DB.prepare(`
    ${ACTIVITY_SELECT}
    WHERE key=? AND profile_id=?
  `).bind(key, profileId).first();
}

/**
 * Temporary compatibility bridge retired after the Logger/Progress cutover.
 * Migration 0006 still preserves the one-time Beta identity normalization,
 * but normal Activity CRUD now writes only goal_activities. Completed facts
 * persist through progress_records/activity_id instead of legacy sessions.
 */
export async function createActivity(DB, profileId, input) {
  await DB.prepare(`
    INSERT INTO goal_activities(
      profile_id,
      goal_id,
      key,
      name,
      description,
      sort_order,
      active
    )
    VALUES(?,?,?,?,?,?,1)
  `).bind(
    profileId,
    input.goal_id,
    input.key,
    input.name,
    input.description || null,
    input.sort_order
  ).run();

  return getActivityByKey(DB, profileId, input.key);
}

export async function updateActivity(DB, profileId, id, input) {
  await DB.prepare(`
    UPDATE goal_activities
    SET goal_id=?,
        name=?,
        description=?,
        sort_order=?,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND profile_id=?
  `).bind(
    input.goal_id,
    input.name,
    input.description || null,
    input.sort_order,
    id,
    profileId
  ).run();

  return getActivity(DB, profileId, id);
}

export async function archiveActivity(DB, profileId, id) {
  await DB.prepare(`
    UPDATE goal_activities
    SET active=0,
        archived_at=COALESCE(archived_at,CURRENT_TIMESTAMP),
        updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND profile_id=?
  `).bind(id, profileId).run();

  return getActivity(DB, profileId, id);
}

export async function exportActivitiesData(
  DB,
  profileId
) {
  const { results } =
    await DB.prepare(`
      SELECT *
      FROM goal_activities
      WHERE profile_id=?
      ORDER BY sort_order,id
    `)
      .bind(profileId)
      .all();

  return results;
}
