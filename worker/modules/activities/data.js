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
 * Temporary compatibility bridge.
 *
 * The Beta factual Logger still writes sessions.activity_key, whose foreign
 * key references the legacy activities table.
 *
 * This legacy table is not the Version 1 Activity ontology.
 *
 * Remove this adapter when Logger and Progress persist through
 * progress_records/activity_id.
 */
function legacyMirrorStatement(DB, { key, name, active }) {
  return DB.prepare(`
    INSERT INTO activities(key,name,category,active)
    VALUES(?,?,?,?)
    ON CONFLICT(key) DO UPDATE SET
      name=excluded.name,
      active=excluded.active
  `).bind(
    key,
    name,
    'v1-compat',
    active ? 1 : 0
  );
}

export async function createActivity(DB, profileId, input) {
  await DB.batch([
    DB.prepare(`
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
    ),

    legacyMirrorStatement(DB, {
      key: input.key,
      name: input.name,
      active: true
    })
  ]);

  return getActivityByKey(DB, profileId, input.key);
}

export async function updateActivity(DB, profileId, id, input) {
  await DB.batch([
    DB.prepare(`
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
    ),

    legacyMirrorStatement(DB, {
      key: input.key,
      name: input.name,
      active: true
    })
  ]);

  return getActivity(DB, profileId, id);
}

export async function archiveActivity(DB, profileId, id, activity) {
  await DB.batch([
    DB.prepare(`
      UPDATE goal_activities
      SET active=0,
          archived_at=COALESCE(archived_at,CURRENT_TIMESTAMP),
          updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND profile_id=?
    `).bind(id, profileId),

    legacyMirrorStatement(DB, {
      key: activity.key,
      name: activity.name,
      active: false
    })
  ]);

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
