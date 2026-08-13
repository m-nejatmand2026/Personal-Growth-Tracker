const STATUSES = new Set(['planned','in_progress','completed','dismissed']);
const SOURCES = new Set(['manual','logger']);
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function cleanText(value, max) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length <= max ? text : null;
}

function cleanMinutes(value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 1440) return undefined;
  return number;
}

export function isDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeDailyPlanInput(body = {}) {
  const plannedFor = body.planned_for;
  const title = cleanText(body.title, 160);
  const activityKey = cleanText(body.activity_key, 100);
  const activityLabel = cleanText(body.activity_label, 120);
  const subtype = cleanText(body.subtype, 80);
  const note = cleanText(body.note, 500);
  const plannedMinutes = cleanMinutes(body.planned_minutes);
  const plannedTime = body.planned_time == null || body.planned_time === ''
    ? null
    : String(body.planned_time);
  const status = body.status || 'planned';
  const source = body.source || 'manual';

  if (!isDateKey(plannedFor)) return { error: 'Choose a valid plan date.' };
  if (!title) return { error: 'Add a short title, up to 160 characters.' };
  if (body.activity_key && !activityKey) return { error: 'Activity key is too long.' };
  if (body.activity_label && !activityLabel) return { error: 'Activity label is too long.' };
  if (body.subtype && !subtype) return { error: 'Focus must be 80 characters or fewer.' };
  if (body.note && !note) return { error: 'Note must be 500 characters or fewer.' };
  if (plannedMinutes === undefined) return { error: 'Planned duration must be 1–1440 minutes or left blank.' };
  if (plannedTime && !TIME_RE.test(plannedTime)) return { error: 'Planned time must use HH:MM.' };
  if (!STATUSES.has(status) || status === 'completed' || status === 'dismissed') {
    return { error: 'New plan items must be planned or in progress.' };
  }
  if (!SOURCES.has(source)) return { error: 'Invalid plan item source.' };

  return {
    value: {
      planned_for: plannedFor,
      title,
      activity_key: activityKey,
      activity_label: activityLabel,
      subtype,
      planned_minutes: plannedMinutes,
      planned_time: plannedTime,
      note,
      status,
      source,
      sort_order: Number.isFinite(Number(body.sort_order)) ? Math.round(Number(body.sort_order)) : 100
    }
  };
}

export function normalizeDailyPlanPatch(body = {}, existing = {}) {
  const merged = {
    planned_for: body.planned_for ?? existing.planned_for,
    title: body.title ?? existing.title,
    activity_key: body.activity_key !== undefined ? body.activity_key : existing.activity_key,
    activity_label: body.activity_label !== undefined ? body.activity_label : existing.activity_label,
    subtype: body.subtype !== undefined ? body.subtype : existing.subtype,
    planned_minutes: body.planned_minutes !== undefined ? body.planned_minutes : existing.planned_minutes,
    planned_time: body.planned_time !== undefined ? body.planned_time : existing.planned_time,
    note: body.note !== undefined ? body.note : existing.note,
    status: existing.status === 'completed' || existing.status === 'dismissed' ? 'planned' : existing.status,
    source: existing.source || 'manual',
    sort_order: body.sort_order ?? existing.sort_order
  };
  const normalized = normalizeDailyPlanInput(merged);
  if (normalized.error) return normalized;
  normalized.value.status = existing.status;
  return normalized;
}

export function canTransitionDailyPlanStatus(from, to) {
  if (!STATUSES.has(from) || !STATUSES.has(to)) return false;
  if (from === to) return true;
  if (from === 'planned') return ['in_progress','completed','dismissed'].includes(to);
  if (from === 'in_progress') return ['planned','completed','dismissed'].includes(to);
  return false;
}

export function isClosedDailyPlanStatus(status) {
  return status === 'completed' || status === 'dismissed';
}
