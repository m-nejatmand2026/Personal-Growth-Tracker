export async function listGoals(DB, profileId, includeArchived = false) {
  const statusClause = includeArchived ? '' : `AND g.status!='archived'`;
  const { results } = await DB.prepare(`
    SELECT g.*, a.name AS area_name, a.color AS area_color, a.icon AS area_icon,
      (SELECT COUNT(*) FROM goal_activities ga WHERE ga.goal_id=g.id AND ga.active=1) AS activity_count
    FROM goals g
    LEFT JOIN areas a ON a.id=g.area_id
    WHERE g.profile_id=? ${statusClause}
    ORDER BY CASE g.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
             g.sort_order,g.name
  `).bind(profileId).all();
  return results;
}

export async function getGoal(DB, profileId, id) {
  return DB.prepare(`
    SELECT g.*, a.name AS area_name, a.color AS area_color, a.icon AS area_icon,
      (SELECT COUNT(*) FROM goal_activities ga WHERE ga.goal_id=g.id AND ga.active=1) AS activity_count
    FROM goals g
    LEFT JOIN areas a ON a.id=g.area_id
    WHERE g.id=? AND g.profile_id=?
  `).bind(id, profileId).first();
}

export async function createGoal(DB, profileId, input) {
  const result = await DB.prepare(`
    INSERT INTO goals(
      profile_id,area_id,name,description,why_text,measurement_type,
      target_value,minimum_value,unit,target_period,start_date,target_date,
      priority,status,sort_order
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    profileId,
    input.area_id || null,
    input.name,
    input.description || null,
    input.why_text || null,
    input.measurement_type,
    input.target_value ?? null,
    input.minimum_value ?? null,
    input.unit || null,
    input.target_period,
    input.start_date || null,
    input.target_date || null,
    input.priority,
    input.status,
    Number(input.sort_order) || 100
  ).run();
  return getGoal(DB, profileId, result.meta.last_row_id);
}

export async function updateGoal(DB, profileId, id, input) {
  await DB.prepare(`
    UPDATE goals
    SET area_id=?,name=?,description=?,why_text=?,measurement_type=?,
        target_value=?,minimum_value=?,unit=?,target_period=?,start_date=?,target_date=?,
        priority=?,status=?,sort_order=?,
        archived_at=CASE WHEN ?='archived' THEN COALESCE(archived_at,CURRENT_TIMESTAMP) ELSE NULL END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND profile_id=?
  `).bind(
    input.area_id || null,
    input.name,
    input.description || null,
    input.why_text || null,
    input.measurement_type,
    input.target_value ?? null,
    input.minimum_value ?? null,
    input.unit || null,
    input.target_period,
    input.start_date || null,
    input.target_date || null,
    input.priority,
    input.status,
    Number(input.sort_order) || 0,
    input.status,
    id,
    profileId
  ).run();
  return getGoal(DB, profileId, id);
}
