import { runIdempotentD1Read, runIdempotentD1Write } from '../../core/d1-retry.js';

function safeTags(row) {
  if (!row) return row;
  let tags = [];
  try {
    const value = JSON.parse(row.tags_json || '[]');
    if (Array.isArray(value)) tags = value;
  } catch {
    tags = [];
  }
  return { ...row, tags };
}

export async function listJournalEntries(DB, profileId, filters = {}) {
  const where = ['profile_id=?'];
  const bindings = [profileId];
  if (filters.archivedOnly) where.push('archived_at IS NOT NULL');
  else if (!filters.includeArchived) where.push('archived_at IS NULL');
  if (filters.from) { where.push('occurred_on>=?'); bindings.push(filters.from); }
  if (filters.to) { where.push('occurred_on<=?'); bindings.push(filters.to); }
  if (filters.q) {
    const like = `%${filters.q}%`;
    where.push("(COALESCE(title,'') LIKE ? OR body LIKE ? OR COALESCE(tags_json,'') LIKE ?)");
    bindings.push(like, like, like);
  }
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const { results } = await runIdempotentD1Read(() => DB.prepare(`
    SELECT * FROM journal_entries WHERE ${where.join(' AND ')}
    ORDER BY CASE WHEN archived_at IS NULL THEN 0 ELSE 1 END, occurred_on DESC, id DESC LIMIT ${limit}
  `).bind(...bindings).all());
  return results.map(safeTags);
}

export async function getJournalEntry(DB, profileId, id) {
  return safeTags(await runIdempotentD1Read(() => DB.prepare('SELECT * FROM journal_entries WHERE profile_id=? AND id=?').bind(profileId, id).first()));
}

export async function createJournalEntry(DB, profileId, input) {
  const result = await DB.prepare(`INSERT INTO journal_entries(profile_id,occurred_on,title,body,entry_type,tags_json) VALUES(?,?,?,?,?,?)`)
    .bind(profileId,input.occurred_on,input.title || null,input.body,input.entry_type,JSON.stringify(input.tags || [])).run();
  return getJournalEntry(DB, profileId, result.meta.last_row_id);
}

export async function updateJournalEntry(DB, profileId, id, input) {
  await runIdempotentD1Write(() => DB.prepare(`UPDATE journal_entries SET occurred_on=?,title=?,body=?,entry_type=?,tags_json=?,updated_at=CURRENT_TIMESTAMP WHERE profile_id=? AND id=?`)
    .bind(input.occurred_on,input.title || null,input.body,input.entry_type,JSON.stringify(input.tags || []),profileId,id).run());
  return getJournalEntry(DB, profileId, id);
}

export async function archiveJournalEntry(DB, profileId, id) {
  await runIdempotentD1Write(() => DB.prepare(`UPDATE journal_entries SET archived_at=COALESCE(archived_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE profile_id=? AND id=?`)
    .bind(profileId,id).run());
  return getJournalEntry(DB, profileId, id);
}

export async function restoreJournalEntry(DB, profileId, id) {
  await runIdempotentD1Write(() => DB.prepare(`UPDATE journal_entries SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE profile_id=? AND id=?`)
    .bind(profileId,id).run());
  return getJournalEntry(DB, profileId, id);
}

export async function deleteJournalEntry(DB, profileId, id) {
  return runIdempotentD1Write(() => DB.prepare('DELETE FROM journal_entries WHERE profile_id=? AND id=?').bind(profileId, id).run());
}

export async function exportJournalData(
  DB,
  profileId
) {
  const { results } =
    await runIdempotentD1Read(() => DB.prepare(`
      SELECT *
      FROM journal_entries
      WHERE profile_id=?
      ORDER BY occurred_on,id
    `)
      .bind(profileId)
      .all());

  return results;
}
