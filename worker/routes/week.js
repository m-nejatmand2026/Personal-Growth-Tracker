import { addDays } from '../core/dates.js';
import { bad, json } from '../core/http.js';
import { getWeek } from '../data/progress.js';

export async function weekRoute({ url, env }) {
  const start = url.searchParams.get('start');
  if (!start) return bad('start is required');
  return json({ start, end: addDays(start, 6), items: await getWeek(env.DB, start) });
}
