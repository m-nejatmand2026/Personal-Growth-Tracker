import { addCivilDays } from '../domain/capacity.js';

export async function getPlanForDate(DB, profileId, dateText) {
  const version = await DB.prepare(`
    SELECT id,profile_id,label,effective_from,effective_to,note,created_at
    FROM plan_versions
    WHERE profile_id=? AND effective_from<=?
      AND (effective_to IS NULL OR effective_to>=?)
    ORDER BY effective_from DESC LIMIT 1
  `).bind(profileId, dateText, dateText).first();

  if (!version) return { version: null, values: [] };
  const { results } = await DB.prepare(`
    SELECT gpv.goal_id,g.name AS goal_name,g.status AS goal_status,g.area_id,
           gpv.time_target_minutes,gpv.time_minimum_minutes,
           gpv.quantity_target,gpv.quantity_minimum,gpv.period
    FROM goal_plan_values gpv
    JOIN goals g ON g.id=gpv.goal_id
    WHERE gpv.plan_version_id=? AND g.profile_id=?
    ORDER BY g.sort_order,g.name
  `).bind(version.id, profileId).all();
  return { version, values: results };
}

export async function listPlanVersions(DB, profileId) {
  const { results } = await DB.prepare(`
    SELECT id,label,effective_from,effective_to,note,created_at
    FROM plan_versions
    WHERE profile_id=?
    ORDER BY effective_from DESC
  `).bind(profileId).all();
  return results;
}

async function getNeighborVersions(DB, profileId, effectiveFrom) {
  const [exact, previous, next] = await Promise.all([
    DB.prepare('SELECT * FROM plan_versions WHERE profile_id=? AND effective_from=? LIMIT 1')
      .bind(profileId, effectiveFrom).first(),
    DB.prepare('SELECT * FROM plan_versions WHERE profile_id=? AND effective_from<? ORDER BY effective_from DESC LIMIT 1')
      .bind(profileId, effectiveFrom).first(),
    DB.prepare('SELECT * FROM plan_versions WHERE profile_id=? AND effective_from>? ORDER BY effective_from ASC LIMIT 1')
      .bind(profileId, effectiveFrom).first()
  ]);
  return { exact, previous, next };
}

export async function savePlanVersion(DB, profileId, input) {
  const neighbors = await getNeighborVersions(DB, profileId, input.effective_from);
  const statements = [];
  let versionId = neighbors.exact?.id || null;

  if (neighbors.exact) {
    statements.push(DB.prepare(`
      UPDATE plan_versions SET label=?,note=? WHERE id=? AND profile_id=?
    `).bind(input.label, input.note || null, neighbors.exact.id, profileId));
    statements.push(DB.prepare('DELETE FROM goal_plan_values WHERE plan_version_id=?').bind(neighbors.exact.id));
  } else {
    const effectiveTo = neighbors.next ? addCivilDays(neighbors.next.effective_from, -1) : null;
    statements.push(DB.prepare(`
      INSERT INTO plan_versions(profile_id,label,effective_from,effective_to,note)
      VALUES(?,?,?,?,?)
    `).bind(profileId, input.label, input.effective_from, effectiveTo, input.note || null));

    if (neighbors.previous) {
      statements.push(DB.prepare(`
        UPDATE plan_versions SET effective_to=? WHERE id=? AND profile_id=?
      `).bind(addCivilDays(input.effective_from, -1), neighbors.previous.id, profileId));
    }
  }

  for (const value of input.goal_values) {
    if (versionId) {
      statements.push(DB.prepare(`
        INSERT INTO goal_plan_values(
          plan_version_id,goal_id,time_target_minutes,time_minimum_minutes,
          quantity_target,quantity_minimum,period
        ) VALUES(?,?,?,?,?,?,?)
      `).bind(
        versionId,
        value.goal_id,
        value.time_target_minutes,
        value.time_minimum_minutes,
        value.quantity_target,
        value.quantity_minimum,
        value.period
      ));
    } else {
      statements.push(DB.prepare(`
        INSERT INTO goal_plan_values(
          plan_version_id,goal_id,time_target_minutes,time_minimum_minutes,
          quantity_target,quantity_minimum,period
        )
        SELECT id,?,?,?,?,?,? FROM plan_versions
        WHERE profile_id=? AND effective_from=?
      `).bind(
        value.goal_id,
        value.time_target_minutes,
        value.time_minimum_minutes,
        value.quantity_target,
        value.quantity_minimum,
        value.period,
        profileId,
        input.effective_from
      ));
    }
  }

  await DB.batch(statements);
  return getPlanForDate(DB, profileId, input.effective_from);
}
