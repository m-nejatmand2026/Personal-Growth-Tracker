export async function listTodayIntentions(DB, profileId, date, includeCompleted = false) {
  const statusFilter = includeCompleted ? '' : "AND ti.status IN ('planned','in_progress')";
  const { results } = await DB.prepare(`
    SELECT ti.*, COALESCE(a.name, ti.activity_key) AS activity_name
    FROM today_intentions ti
    LEFT JOIN activities a ON a.key=ti.activity_key
    WHERE ti.profile_id=? AND ti.occurred_on=? ${statusFilter}
    ORDER BY CASE ti.status WHEN 'in_progress' THEN 0 ELSE 1 END, ti.created_at, ti.id
  `).bind(profileId, date).all();
  return results;
}

export async function getTodayIntention(DB, profileId, id) {
  return DB.prepare(`
    SELECT ti.*, COALESCE(a.name, ti.activity_key) AS activity_name
    FROM today_intentions ti
    LEFT JOIN activities a ON a.key=ti.activity_key
    WHERE ti.profile_id=? AND ti.id=?
  `).bind(profileId, id).first();
}

export async function createTodayIntention(DB, profileId, input) {
  const result = await DB.prepare(`
    INSERT INTO today_intentions(
      profile_id,occurred_on,activity_key,subtype,planned_minutes,note,status
    ) VALUES(?,?,?,?,?,?,?)
  `).bind(
    profileId,
    input.occurred_on,
    input.activity_key,
    input.subtype || null,
    input.planned_minutes,
    input.note || null,
    input.status
  ).run();
  return getTodayIntention(DB, profileId, result.meta.last_row_id);
}

export async function updateTodayIntentionStatus(DB, profileId, id, status) {
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  await DB.prepare(`
    UPDATE today_intentions
    SET status=?, completed_at=?, updated_at=CURRENT_TIMESTAMP
    WHERE profile_id=? AND id=?
  `).bind(status, completedAt, profileId, id).run();
  return getTodayIntention(DB, profileId, id);
}

export async function deleteTodayIntention(DB, profileId, id) {
  return DB.prepare('DELETE FROM today_intentions WHERE profile_id=? AND id=?')
    .bind(profileId, id).run();
}
