export async function getProfile(DB, profileId) {
  return DB.prepare(`
    SELECT id,display_name,timezone,locale,created_at,updated_at
    FROM profiles
    WHERE id=?
  `).bind(profileId).first();
}
