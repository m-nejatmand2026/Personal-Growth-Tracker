import { addDays } from '../core/dates.js';
import { bad, json } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { getLegacyWeek } from '../compatibility/legacy-beta/progress.js';

export async function weekRoute({ request, url, env }) {
  const start = url.searchParams.get('start');
  if (!start) return bad('start is required');

  const profileId = resolveProfileId(request);

  return json({
    start,
    end: addDays(start, 6),
    items: await getLegacyWeek(env.DB, profileId, start)
  });
}
