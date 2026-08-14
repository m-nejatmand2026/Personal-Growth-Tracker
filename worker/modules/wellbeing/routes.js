import { bad, json, readJsonBody } from '../../core/http.js';
import { resolveProfileId } from '../../core/profile.js';
import { isDateKey } from '../../core/validation.js';
import {
  normalizeDayContextInput,
  normalizeEnergyInput,
  normalizeSleepInput
} from './domain.js';
import { wellbeingContractV1 } from './public.js';

export async function wellbeingDayRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const date = url.searchParams.get('date');
  if (!isDateKey(date)) return bad('date is required and must be valid.');
  return json(await wellbeingContractV1.getDay(env.DB, profileId, date));
}

export async function listEnergyRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = Number(url.searchParams.get('limit') || 100);

  if ((from && !isDateKey(from)) || (to && !isDateKey(to))) {
    return bad('Invalid wellbeing date range.');
  }
  if (from && to && from > to) return bad('from cannot be after to.');

  return json({
    items: await wellbeingContractV1.listEnergy(env.DB, profileId, {
      from: from || null,
      to: to || null,
      limit
    })
  });
}

export async function recordEnergyRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const normalized = normalizeEnergyInput(await readJsonBody(request));
  if (normalized.error) return bad(normalized.error);

  return json({
    item: await wellbeingContractV1.recordEnergy(env.DB, profileId, normalized.value)
  }, 201);
}

export async function recordSleepRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const normalized = normalizeSleepInput(await readJsonBody(request));
  if (normalized.error) return bad(normalized.error);
  return json({
    item: await wellbeingContractV1.recordSleep(env.DB, profileId, normalized.value)
  }, 201);
}

export async function recordDayContextRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const normalized = normalizeDayContextInput(await readJsonBody(request));
  if (normalized.error) return bad(normalized.error);
  return json({
    item: await wellbeingContractV1.recordDayContext(
      env.DB,
      profileId,
      normalized.value
    )
  }, 201);
}
