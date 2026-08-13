export async function listDailyPlanItems(DB, profileId, date, includeClosed = false) {
  const statusFilter = includeClosed ? '' : "AND status IN ('planned','in_progress')";
  const { results } = await DB.prepare(`
    SELECT * FROM daily_plan_items
    WHERE profile_id=? AND planned_for=? ${statusFilter}
    ORDER BY
      CASE status WHEN 'in_progress' THEN 0 WHEN 'planned' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
      sort_order, COALESCE(planned_time,'99:99'), created_at, id
  `).bind(profileId, date).all();
  return results;
}

export async function getDailyPlanItem(DB, profileId, id) {
  return DB.prepare('SELECT * FROM daily_plan_items WHERE profile_id=? AND id=?')
    .bind(profileId, id).first();
}

export async function createDailyPlanItem(DB, profileId, input) {
  const startedAt = input.status === 'in_progress' ? new Date().toISOString() : null;
  const result = await DB.prepare(`
    INSERT INTO daily_plan_items(
      profile_id,planned_for,title,activity_key,activity_label,subtype,
      planned_minutes,planned_time,note,status,source,sort_order,started_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    profileId,
    input.planned_for,
    input.title,
    input.activity_key || null,
    input.activity_label || null,
    input.subtype || null,
    input.planned_minutes ?? null,
    input.planned_time || null,
    input.note || null,
    input.status,
    input.source,
    input.sort_order,
    startedAt
  ).run();
  return getDailyPlanItem(DB, profileId, result.meta.last_row_id);
}

export async function updateDailyPlanItem(DB, profileId, id, input) {
  await DB.prepare(`
    UPDATE daily_plan_items
    SET planned_for=?,title=?,activity_key=?,activity_label=?,subtype=?,
        planned_minutes=?,planned_time=?,note=?,sort_order=?,updated_at=CURRENT_TIMESTAMP
    WHERE profile_id=? AND id=?
  `).bind(
    input.planned_for,
    input.title,
    input.activity_key || null,
    input.activity_label || null,
    input.subtype || null,
    input.planned_minutes ?? null,
    input.planned_time || null,
    input.note || null,
    input.sort_order,
    profileId,
    id
  ).run();
  return getDailyPlanItem(DB, profileId, id);
}

export async function updateDailyPlanStatus(DB, profileId, id, status) {
  const now = new Date().toISOString();
  await DB.prepare(`
    UPDATE daily_plan_items
    SET status=?,
        started_at=CASE WHEN ?='in_progress' AND started_at IS NULL THEN ? ELSE started_at END,
        completed_at=CASE WHEN ?='completed' THEN ? ELSE completed_at END,
        dismissed_at=CASE WHEN ?='dismissed' THEN ? ELSE dismissed_at END,
        updated_at=CURRENT_TIMESTAMP
    WHERE profile_id=? AND id=?
  `).bind(status, status, now, status, now, status, now, profileId, id).run();
  return getDailyPlanItem(DB, profileId, id);
}

export async function deleteDailyPlanItem(DB, profileId, id) {
  return DB.prepare('DELETE FROM daily_plan_items WHERE profile_id=? AND id=?')
    .bind(profileId, id).run();
}
