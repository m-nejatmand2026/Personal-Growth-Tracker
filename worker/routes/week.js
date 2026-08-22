import { addDays } from '../core/dates.js';
import { bad, json } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { isDateKey } from '../core/validation.js';
import { todayContractV1 } from '../modules/today/public.js';

export async function weekRoute({ request, url, env }) {
  const start = url.searchParams.get('start');
  if (!isDateKey(start)) return bad('start is required and must be valid.');

  const profileId = resolveProfileId(request);

  return json({
    start,
    end: addDays(start, 6),
    items: await todayContractV1.getWeeklyDirection(env.DB, profileId, start)
  });
}
