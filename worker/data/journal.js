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
  if (filters.from) { where.push('occurred_on>=?'); bindings.push(filters.from); }
  if (filters.to) { where.push('occurred_on<=?'); bindings.push(filters.to); }
  if (filters.q) {
    const like = `%${filters.q}%`;
    where.push("(COALESCE(title,'') LIKE ? OR body LIKE ? OR COALESCE(tags_json,'') LIKE ?)");
    bindings.push(like, like, like);
  }
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  const { results } = await DB.prepare(`
    SELECT * FROM journal_entries WHERE ${where.join(' AND ')}
    ORDER BY occurred_on DESC, id DESC LIMIT ${limit}
  `).bind(...bindings).all();
  return results.map(safeTags);
}

export async function getJournalEntry(DB, profileId, id) {
  return safeTags(await DB.prepare('SELECT * FROM journal_entries WHERE profile_id=? AND id=?').bind(profileId, id).first());
}

export async function createJournalEntry(DB, profileId, input) {
  const result = await DB.prepare(`INSERT INTO journal_entries(profile_id,occurred_on,title,body,entry_type,tags_json) VALUES(?,?,?,?,?,?)`)
    .bind(profileId,input.occurred_on,input.title || null,input.body,input.entry_type,JSON.stringify(input.tags || [])).run();
  return getJournalEntry(DB, profileId, result.meta.last_row_id);
}

export async function updateJournalEntry(DB, profileId, id, input) {
  await DB.prepare(`UPDATE journal_entries SET occurred_on=?,title=?,body=?,entry_type=?,tags_json=?,updated_at=CURRENT_TIMESTAMP WHERE profile_id=? AND id=?`)
    .bind(input.occurred_on,input.title || null,input.body,input.entry_type,JSON.stringify(input.tags || []),profileId,id).run();
  return getJournalEntry(DB, profileId, id);
}

export async function deleteJournalEntry(DB, profileId, id) {
  return DB.prepare('DELETE FROM journal_entries WHERE profile_id=? AND id=?').bind(profileId, id).run();
}
