import { todayInTimeZone } from '../core/dates.js';
import { bad, json, readJsonBody } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { integerInRange, isDateKey, optionalText, requiredText } from '../core/validation.js';
import { getPlanForDate, listPlanVersions, savePlanVersion } from '../data/plans.js';
import { getProfile } from '../data/profiles.js';

const PERIODS = new Set(['daily','weekly','monthly','yearly','custom','none']);

function nullableFiniteNumber(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function normalizePlanInput(DB, profileId, body) {
  const profile = await getProfile(DB, profileId);
  if (!profile) return { error: 'Profile not found.' };
  const today = todayInTimeZone(profile.timezone);
  const effectiveFrom = body.effective_from || today;
  if (!isDateKey(effectiveFrom)) return { error: 'Invalid effective date.' };
  if (effectiveFrom < today) return { error: 'Backdating plan changes is disabled in beta. Choose today or a future date.' };

  const label = requiredText(body.label || `Plan effective ${effectiveFrom}`, 120);
  if (!label) return { error: 'Plan label must be 120 characters or fewer.' };
  const noteRaw = body.note ?? null;
  const note = noteRaw == null ? null : optionalText(noteRaw, 1000);
  if (noteRaw != null && note == null) return { error: 'Plan note must be 1000 characters or fewer.' };
  if (!Array.isArray(body.goal_values)) return { error: 'goal_values must be an array.' };

  const activeGoalsResult = await DB.prepare(`SELECT id FROM goals WHERE profile_id=? AND status!='archived'`).bind(profileId).all();
  const allowedGoalIds = new Set(activeGoalsResult.results.map((goal) => Number(goal.id)));
  const seen = new Set();
  const goalValues = [];

  for (const raw of body.goal_values) {
    const goalId = Number(raw.goal_id);
    if (!Number.isInteger(goalId) || !allowedGoalIds.has(goalId)) return { error: `Invalid goal id: ${raw.goal_id}` };
    if (seen.has(goalId)) return { error: `Duplicate goal id: ${goalId}` };
    seen.add(goalId);
    const period = raw.period || 'weekly';
    if (!PERIODS.has(period)) return { error: `Invalid plan period for goal ${goalId}.` };

    const targetMinutes = raw.time_target_minutes == null ? null : integerInRange(raw.time_target_minutes, 0, 525600);
    const minimumMinutes = raw.time_minimum_minutes == null ? null : integerInRange(raw.time_minimum_minutes, 0, 525600);
    if (raw.time_target_minutes != null && targetMinutes == null) return { error: `Invalid target minutes for goal ${goalId}.` };
    if (raw.time_minimum_minutes != null && minimumMinutes == null) return { error: `Invalid minimum minutes for goal ${goalId}.` };
    if (targetMinutes != null && minimumMinutes != null && minimumMinutes > targetMinutes) {
      return { error: `Minimum time cannot exceed target time for goal ${goalId}.` };
    }

    const quantityTarget = nullableFiniteNumber(raw.quantity_target);
    const quantityMinimum = nullableFiniteNumber(raw.quantity_minimum);
    if (raw.quantity_target != null && raw.quantity_target !== '' && quantityTarget == null) return { error: `Invalid quantity target for goal ${goalId}.` };
    if (raw.quantity_minimum != null && raw.quantity_minimum !== '' && quantityMinimum == null) return { error: `Invalid quantity minimum for goal ${goalId}.` };

    goalValues.push({
      goal_id: goalId,
      time_target_minutes: targetMinutes,
      time_minimum_minutes: minimumMinutes,
      quantity_target: quantityTarget,
      quantity_minimum: quantityMinimum,
      period
    });
  }

  return { value: { effective_from: effectiveFrom, label, note, goal_values: goalValues } };
}

export async function getPlanRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const profile = await getProfile(env.DB, profileId);
  if (!profile) return bad('Profile not found.', 404);
  const date = url.searchParams.get('date') || todayInTimeZone(profile.timezone);
  if (!isDateKey(date)) return bad('Invalid date.');
  return json(await getPlanForDate(env.DB, profileId, date));
}

export async function planHistoryRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  return json({ items: await listPlanVersions(env.DB, profileId) });
}

export async function savePlanRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = await normalizePlanInput(env.DB, profileId, body);
  if (normalized.error) return bad(normalized.error);
  return json(await savePlanVersion(env.DB, profileId, normalized.value), 201);
}
