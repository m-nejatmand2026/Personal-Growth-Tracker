import { bad, json, readJsonBody } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { isDateKey, optionalText, requiredText } from '../core/validation.js';
import { getArea } from '../data/areas.js';
import { createGoal, getGoal, listGoals, updateGoal } from '../data/goals.js';

const MEASUREMENT_TYPES = new Set(['time','count','milestone','boolean','number']);
const PERIODS = new Set(['daily','weekly','monthly','yearly','custom','none']);
const PRIORITIES = new Set(['high','medium','low']);
const STATUSES = new Set(['active','paused','completed','archived']);

function nullableNumber(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function normalizeGoalInput(DB, profileId, body, existing = null) {
  const name = requiredText(body.name ?? existing?.name, 120);
  if (!name) return { error: 'Goal name is required and must be 120 characters or fewer.' };

  const areaIdRaw = body.area_id ?? existing?.area_id ?? null;
  const areaId = areaIdRaw == null || areaIdRaw === '' ? null : Number(areaIdRaw);
  if (areaId != null) {
    if (!Number.isInteger(areaId) || areaId <= 0) return { error: 'Invalid area id.' };
    if (!await getArea(DB, profileId, areaId)) return { error: 'Area not found.' };
  }

  const measurementType = body.measurement_type ?? existing?.measurement_type ?? 'time';
  const targetPeriod = body.target_period ?? existing?.target_period ?? 'weekly';
  const priority = body.priority ?? existing?.priority ?? 'medium';
  const status = body.status ?? existing?.status ?? 'active';
  if (!MEASUREMENT_TYPES.has(measurementType)) return { error: 'Invalid goal measurement type.' };
  if (!PERIODS.has(targetPeriod)) return { error: 'Invalid target period.' };
  if (!PRIORITIES.has(priority)) return { error: 'Invalid priority.' };
  if (!STATUSES.has(status)) return { error: 'Invalid goal status.' };

  const descriptionRaw = body.description ?? existing?.description ?? null;
  const whyRaw = body.why_text ?? existing?.why_text ?? null;
  const unitRaw = body.unit ?? existing?.unit ?? null;
  const description = descriptionRaw == null ? null : optionalText(descriptionRaw, 1000);
  const whyText = whyRaw == null ? null : optionalText(whyRaw, 1000);
  const unit = unitRaw == null ? null : optionalText(unitRaw, 40);
  if (descriptionRaw != null && description == null) return { error: 'Description must be 1000 characters or fewer.' };
  if (whyRaw != null && whyText == null) return { error: 'Why text must be 1000 characters or fewer.' };
  if (unitRaw != null && unit == null) return { error: 'Unit must be 40 characters or fewer.' };

  const targetValueRaw = body.target_value ?? existing?.target_value ?? null;
  const minimumValueRaw = body.minimum_value ?? existing?.minimum_value ?? null;
  const targetValue = nullableNumber(targetValueRaw);
  const minimumValue = nullableNumber(minimumValueRaw);
  if (targetValueRaw != null && targetValueRaw !== '' && targetValue == null) return { error: 'Target value must be numeric.' };
  if (minimumValueRaw != null && minimumValueRaw !== '' && minimumValue == null) return { error: 'Minimum value must be numeric.' };

  const startDate = body.start_date ?? existing?.start_date ?? null;
  const targetDate = body.target_date ?? existing?.target_date ?? null;
  if (startDate && !isDateKey(startDate)) return { error: 'Invalid start date.' };
  if (targetDate && !isDateKey(targetDate)) return { error: 'Invalid target date.' };
  if (startDate && targetDate && targetDate < startDate) return { error: 'Target date cannot be before start date.' };

  return {
    value: {
      area_id: areaId,
      name,
      description,
      why_text: whyText,
      measurement_type: measurementType,
      target_value: targetValue,
      minimum_value: minimumValue,
      unit,
      target_period: targetPeriod,
      start_date: startDate,
      target_date: targetDate,
      priority,
      status,
      sort_order: Number.isFinite(Number(body.sort_order ?? existing?.sort_order))
        ? Math.round(Number(body.sort_order ?? existing?.sort_order))
        : 100
    }
  };
}

export async function listGoalsRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const includeArchived = url.searchParams.get('include_archived') === '1';
  return json({ items: await listGoals(env.DB, profileId, includeArchived) });
}

export async function createGoalRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = await normalizeGoalInput(env.DB, profileId, body);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await createGoal(env.DB, profileId, normalized.value) }, 201);
}

export async function updateGoalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = Number(url.pathname.split('/').pop());
  if (!Number.isInteger(id) || id <= 0) return bad('Invalid goal id.');
  const existing = await getGoal(env.DB, profileId, id);
  if (!existing) return bad('Goal not found.', 404);
  const body = await readJsonBody(request);
  const normalized = await normalizeGoalInput(env.DB, profileId, body, existing);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await updateGoal(env.DB, profileId, id, normalized.value) });
}

export async function archiveGoalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = Number(url.pathname.split('/').pop());
  if (!Number.isInteger(id) || id <= 0) return bad('Invalid goal id.');
  const existing = await getGoal(env.DB, profileId, id);
  if (!existing) return bad('Goal not found.', 404);
  return json({ item: await updateGoal(env.DB, profileId, id, { ...existing, status: 'archived' }) });
}
