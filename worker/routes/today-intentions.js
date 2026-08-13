import { bad, json, readJsonBody } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { integerInRange, isDateKey, requiredText } from '../core/validation.js';
import {
  createTodayIntention,
  deleteTodayIntention,
  getTodayIntention,
  listTodayIntentions,
  updateTodayIntentionStatus
} from '../data/today-intentions.js';

const STATUSES = new Set(['planned','in_progress','completed']);

function normalizeInput(body) {
  const occurredOn = body.occurred_on;
  const activityKey = requiredText(body.activity_key, 100);
  const subtype = body.subtype == null || body.subtype === '' ? null : requiredText(body.subtype, 80);
  const note = body.note == null || body.note === '' ? null : requiredText(body.note, 500);
  const plannedMinutes = integerInRange(body.planned_minutes, 1, 1440);
  const status = body.status || 'planned';

  if (!isDateKey(occurredOn)) return { error: 'Choose a valid date.' };
  if (!activityKey) return { error: 'Choose an activity.' };
  if (body.subtype && !subtype) return { error: 'Subtype must be 80 characters or fewer.' };
  if (body.note && !note) return { error: 'Note must be 500 characters or fewer.' };
  if (plannedMinutes == null) return { error: 'Planned duration must be 1–1440 minutes.' };
  if (!STATUSES.has(status) || status === 'completed') return { error: 'New Today items must be planned or in progress.' };

  return {
    value: {
      occurred_on: occurredOn,
      activity_key: activityKey,
      subtype,
      planned_minutes: plannedMinutes,
      note,
      status
    }
  };
}

function intentionId(url) {
  const id = Number(url.pathname.split('/').pop());
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function listTodayIntentionsRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const date = url.searchParams.get('date');
  if (!date || !isDateKey(date)) return bad('A valid date is required.');
  const includeCompleted = url.searchParams.get('include_completed') === '1';
  return json({ items: await listTodayIntentions(env.DB, profileId, date, includeCompleted) });
}

export async function createTodayIntentionRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = normalizeInput(body);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await createTodayIntention(env.DB, profileId, normalized.value) }, 201);
}

export async function updateTodayIntentionRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = intentionId(url);
  if (!id) return bad('Invalid Today item id.');
  const existing = await getTodayIntention(env.DB, profileId, id);
  if (!existing) return bad('Today item not found.', 404);

  const body = await readJsonBody(request);
  const status = body.status;
  if (!STATUSES.has(status)) return bad('Status must be planned, in_progress, or completed.');
  return json({ item: await updateTodayIntentionStatus(env.DB, profileId, id, status) });
}

export async function deleteTodayIntentionRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = intentionId(url);
  if (!id) return bad('Invalid Today item id.');
  const existing = await getTodayIntention(env.DB, profileId, id);
  if (!existing) return bad('Today item not found.', 404);
  await deleteTodayIntention(env.DB, profileId, id);
  return json({ ok: true });
}
