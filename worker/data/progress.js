import { addDays } from '../core/dates.js';
import { getTargets } from './targets.js';

export async function getWeek(DB, start) {
  const end = addDays(start, 6);
  const targets = await getTargets(DB);
  const { results } = await DB.prepare(`
    SELECT activity_key, COALESCE(SUM(minutes),0) AS actual_minutes
    FROM sessions
    WHERE occurred_on BETWEEN ? AND ?
    GROUP BY activity_key
  `).bind(start, end).all();

  const actual = Object.fromEntries(results.map((row) => [row.activity_key, Number(row.actual_minutes)]));
  return targets.map((target) => ({
    ...target,
    actual_minutes: actual[target.key] || 0,
    progress: target.target_minutes
      ? Math.min(1, (actual[target.key] || 0) / target.target_minutes)
      : 0
  }));
}
