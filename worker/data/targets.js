export async function getTargets(DB) {
  const { results } = await DB.prepare(`
    SELECT a.key, a.name, t.target_minutes, t.minimum_minutes
    FROM weekly_targets t
    JOIN activities a ON a.key=t.activity_key
    WHERE a.active=1
    ORDER BY CASE a.key WHEN 'sport' THEN 1 WHEN 'german' THEN 2 WHEN 'guitar' THEN 3 ELSE 4 END
  `).all();
  return results;
}
