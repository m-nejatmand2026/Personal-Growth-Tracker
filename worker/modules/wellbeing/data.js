function boundedLimit(value, fallback = 100, maximum = 500) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return fallback;
  return Math.min(maximum, number);
}

export async function getEnergyObservation(DB, profileId, date) {
  return DB.prepare(`
    SELECT *
    FROM energy_logs_v1
    WHERE profile_id=? AND occurred_on=?
  `).bind(profileId, date).first();
}

export async function listEnergyObservations(
  DB,
  profileId,
  { from = null, to = null, limit = 100 } = {}
) {
  const where = ['profile_id=?'];
  const bindings = [profileId];

  if (from) {
    where.push('occurred_on>=?');
    bindings.push(from);
  }

  if (to) {
    where.push('occurred_on<=?');
    bindings.push(to);
  }

  const rowLimit = boundedLimit(limit);
  const { results } = await DB.prepare(`
    SELECT *
    FROM energy_logs_v1
    WHERE ${where.join(' AND ')}
    ORDER BY occurred_on DESC
    LIMIT ${rowLimit}
  `).bind(...bindings).all();

  return results;
}

export async function upsertEnergyObservation(DB, profileId, input) {
  await DB.prepare(`
    INSERT INTO energy_logs_v1(
      profile_id,
      occurred_on,
      label,
      row_idx,
      col_idx,
      energy_score,
      valence_score,
      note
    )
    VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(profile_id,occurred_on) DO UPDATE SET
      label=excluded.label,
      row_idx=excluded.row_idx,
      col_idx=excluded.col_idx,
      energy_score=excluded.energy_score,
      valence_score=excluded.valence_score,
      note=excluded.note,
      updated_at=CURRENT_TIMESTAMP
  `).bind(
    profileId,
    input.occurred_on,
    input.label,
    input.row_idx,
    input.col_idx,
    input.energy_score,
    input.valence_score,
    input.note || null
  ).run();

  return getEnergyObservation(DB, profileId, input.occurred_on);
}

export async function getSleepObservation(DB, profileId, date) {
  return DB.prepare(`
    SELECT *
    FROM sleep_logs_v1
    WHERE profile_id=? AND occurred_on=?
  `).bind(profileId, date).first();
}

export async function getDayContextObservation(DB, profileId, date) {
  return DB.prepare(`
    SELECT *
    FROM day_context_logs_v1
    WHERE profile_id=? AND occurred_on=?
  `).bind(profileId, date).first();
}

export async function exportWellbeingData(DB, profileId) {
  const [energy, sleep, context] = await Promise.all([
    DB.prepare(`
      SELECT *
      FROM energy_logs_v1
      WHERE profile_id=?
      ORDER BY occurred_on
    `).bind(profileId).all(),

    DB.prepare(`
      SELECT *
      FROM sleep_logs_v1
      WHERE profile_id=?
      ORDER BY occurred_on
    `).bind(profileId).all(),

    DB.prepare(`
      SELECT *
      FROM day_context_logs_v1
      WHERE profile_id=?
      ORDER BY occurred_on
    `).bind(profileId).all()
  ]);

  return Object.freeze({
    energy_logs: energy.results,
    sleep_logs: sleep.results,
    day_context_logs: context.results
  });
}
