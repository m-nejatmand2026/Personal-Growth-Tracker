import { bad, json } from '../../core/http.js';
import { resolveProfileId } from '../../core/profile.js';
import { isDateKey } from '../../core/validation.js';
import { TODAY_DIRECTION_PERIODS, todayContractV1 } from './public.js';

export async function todayRoute({ request, url, env }) {
  const date = url.searchParams.get('date');
  if (!isDateKey(date)) {
    return bad('date is required and must be valid.');
  }

  const period = url.searchParams.get('period') || 'week';
  if (!TODAY_DIRECTION_PERIODS.includes(period)) {
    return bad('period must be day, week, month, or year.');
  }

  return json(
    await todayContractV1.getDay(
      env.DB,
      resolveProfileId(request),
      date,
      { period }
    )
  );
}
