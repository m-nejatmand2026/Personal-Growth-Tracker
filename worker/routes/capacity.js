import { addCivilDays } from '../domain/capacity.js';
import { todayInTimeZone } from '../core/dates.js';
import { bad, json, readJsonBody } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { integerInRange, isDateKey, requiredText } from '../core/validation.js';
import {
  createCapacityCommitment,
  getCapacitySummary,
  listCapacityCommitments,
  updateCapacityCommitment,
  versionCapacityCommitment
} from '../data/capacity.js';
import { getProfile } from '../data/profiles.js';

const PERIODS = new Set(['day','week','month']);
const KINDS = new Set(['sleep','work','commute','life','family','recovery','exercise','other']);

function dailyMinutesFromExisting(existing) {
  if (!existing?.daily_minutes_json) return null;
  try {
    const value = JSON.parse(existing.daily_minutes_json);
    return Array.isArray(value) && value.length === 7 ? value : null;
  } catch {
    return null;
  }
}

function normalizeDailyMinutes(value) {
  if (value == null) return { value: null };
  if (!Array.isArray(value) || value.length !== 7) {
    return { error: 'daily_minutes must contain exactly seven Monday-to-Sunday values.' };
  }
  const normalized = value.map((item) => integerInRange(item, 0, 1440));
  if (normalized.some((item) => item == null)) {
    return { error: 'Each daily duration must be an integer between 0 and 1440 minutes.' };
  }
  return { value: normalized };
}

function normalizeCommitmentInput(body, existing = null) {
  const kind = body.kind ?? existing?.kind ?? 'other';
  const name = requiredText(body.name ?? existing?.name, 100);
  const minutes = integerInRange(body.minutes ?? existing?.minutes, 0, 1440);
  const weekdayMask = integerInRange(body.weekday_mask ?? existing?.weekday_mask ?? 127, 0, 127);
  const dailyResult = normalizeDailyMinutes(
    body.daily_minutes !== undefined ? body.daily_minutes : dailyMinutesFromExisting(existing)
  );
  if (!KINDS.has(kind)) return { error: 'Invalid commitment kind.' };
  if (!name) return { error: 'Commitment name is required and must be 100 characters or fewer.' };
  if (minutes == null) return { error: 'Minutes must be an integer between 0 and 1440.' };
  if (weekdayMask == null) return { error: 'weekday_mask must be an integer between 0 and 127.' };
  if (dailyResult.error) return dailyResult;
  const effectiveFrom = body.effective_from ?? existing?.effective_from ?? null;
  const effectiveTo = body.effective_to ?? existing?.effective_to ?? null;
  if (effectiveFrom && !isDateKey(effectiveFrom)) return { error: 'Invalid effective_from date.' };
  if (effectiveTo && !isDateKey(effectiveTo)) return { error: 'Invalid effective_to date.' };
  if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) return { error: 'effective_to cannot be before effective_from.' };
  return {
    value: {
      kind,
      name,
      minutes,
      weekday_mask: weekdayMask,
      daily_minutes: dailyResult.value,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      protected: body.protected ?? (existing ? Boolean(existing.protected) : true),
      active: body.active ?? (existing ? Boolean(existing.active) : true),
      sort_order: Number.isFinite(Number(body.sort_order ?? existing?.sort_order))
        ? Math.round(Number(body.sort_order ?? existing?.sort_order))
        : 100
    }
  };
}

export async function capacitySummaryRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const profile = await getProfile(env.DB, profileId);
  if (!profile) return bad('Profile not found.', 404);
  const period = url.searchParams.get('period') || 'week';
  if (!PERIODS.has(period)) return bad('period must be day, week, or month.');
  const date = url.searchParams.get('date') || todayInTimeZone(profile.timezone);
  if (!isDateKey(date)) return bad('Invalid date.');
  return json(await getCapacitySummary(env.DB, profileId, date, period));
}

export async function listCapacityCommitmentsRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const includeInactive = url.searchParams.get('include_inactive') === '1';
  const date = url.searchParams.get('date');
  if (date && !isDateKey(date)) return bad('Invalid date.');
  return json({ items: await listCapacityCommitments(env.DB, profileId, includeInactive, date || null) });
}

export async function createCapacityCommitmentRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = normalizeCommitmentInput(body);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await createCapacityCommitment(env.DB, profileId, normalized.value) }, 201);
}

export async function updateCapacityCommitmentRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = Number(url.pathname.split('/').pop());
  if (!Number.isInteger(id) || id <= 0) return bad('Invalid commitment id.');
  const existing = await env.DB.prepare('SELECT * FROM capacity_commitments WHERE id=? AND profile_id=?')
    .bind(id, profileId).first();
  if (!existing) return bad('Commitment not found.', 404);
  const body = await readJsonBody(request);
  const normalized = normalizeCommitmentInput(body, existing);
  if (normalized.error) return bad(normalized.error);

  const versionFrom = body.version_from ?? null;
  if (!versionFrom) {
    return json({ item: await updateCapacityCommitment(env.DB, profileId, id, normalized.value) });
  }
  if (!isDateKey(versionFrom)) return bad('Invalid version_from date.');
  if (existing.effective_to && versionFrom > existing.effective_to) {
    return bad('version_from falls after this schedule version ends.');
  }
  if (existing.effective_from && versionFrom < existing.effective_from) {
    return bad('Backdating before the current schedule version is not supported in this editor.');
  }
  if (existing.effective_from === versionFrom) {
    normalized.value.effective_from = versionFrom;
    return json({ item: await updateCapacityCommitment(env.DB, profileId, id, normalized.value) });
  }

  const previousDate = addCivilDays(versionFrom, -1);
  return json({
    item: await versionCapacityCommitment(env.DB, profileId, existing, normalized.value, versionFrom, previousDate),
    versioned: true
  });
}
