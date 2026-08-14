import { bad, json } from '../../core/http.js';
import { resolveProfileId } from '../../core/profile.js';
import { isDateKey } from '../../core/validation.js';
import { todayContractV1 } from './public.js';

export async function todayRoute({ request, url, env }) {
  const date = url.searchParams.get('date');
  if (!isDateKey(date)) {
    return bad('date is required and must be valid.');
  }
  return json(
    await todayContractV1.getDay(env.DB, resolveProfileId(request), date)
  );
}
