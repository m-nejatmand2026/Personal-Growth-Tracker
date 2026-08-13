export async function listAreaTemplates(DB) {
  const { results } = await DB.prepare(`
    SELECT key,name,icon,default_color,sort_order
    FROM area_templates
    WHERE active=1
    ORDER BY sort_order,name
  `).all();
  return results;
}

export async function getAreaTemplate(DB, key) {
  if (!key) return null;
  return DB.prepare(`
    SELECT key,name,icon,default_color,sort_order
    FROM area_templates
    WHERE key=? AND active=1
  `).bind(key).first();
}

export async function listAreas(DB, profileId, includeArchived = false) {
  const query = includeArchived
    ? `SELECT a.*,
         (SELECT COUNT(*) FROM goals g WHERE g.area_id=a.id AND g.status!='archived') AS goal_count
       FROM areas a WHERE a.profile_id=? ORDER BY a.active DESC,a.sort_order,a.name`
    : `SELECT a.*,
         (SELECT COUNT(*) FROM goals g WHERE g.area_id=a.id AND g.status!='archived') AS goal_count
       FROM areas a WHERE a.profile_id=? AND a.active=1 ORDER BY a.sort_order,a.name`;
  const { results } = await DB.prepare(query).bind(profileId).all();
  return results;
}

export async function createArea(DB, profileId, input) {
  const result = await DB.prepare(`
    INSERT INTO areas(profile_id,template_key,name,icon,color,sort_order)
    VALUES(?,?,?,?,?,?)
  `).bind(
    profileId,
    input.template_key || null,
    input.name,
    input.icon || null,
    input.color || null,
    Number(input.sort_order) || 100
  ).run();
  return getArea(DB, profileId, result.meta.last_row_id);
}

export async function getArea(DB, profileId, id) {
  return DB.prepare(`
    SELECT a.*,
      (SELECT COUNT(*) FROM goals g WHERE g.area_id=a.id AND g.status!='archived') AS goal_count
    FROM areas a
    WHERE a.id=? AND a.profile_id=?
  `).bind(id, profileId).first();
}

export async function updateArea(DB, profileId, id, input) {
  await DB.prepare(`
    UPDATE areas
    SET name=?, template_key=?, icon=?, color=?, sort_order=?, active=?,
        archived_at=CASE WHEN ?=1 THEN NULL ELSE COALESCE(archived_at,CURRENT_TIMESTAMP) END,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND profile_id=?
  `).bind(
    input.name,
    input.template_key || null,
    input.icon || null,
    input.color || null,
    Number(input.sort_order) || 0,
    input.active === false ? 0 : 1,
    input.active === false ? 0 : 1,
    id,
    profileId
  ).run();
  return getArea(DB, profileId, id);
}
