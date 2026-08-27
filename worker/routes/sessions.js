import { bad, json, readJsonBody } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { progressContractV1 } from '../modules/progress/public.js';

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function createSessionRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const minutes = Number(body.minutes);
  const activityKey = typeof body.activity_key === 'string' ? body.activity_key.trim() : '';

  if (!validDate(body.occurred_on) || !activityKey || !Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
    return bad('Invalid legacy session payload.');
  }

  const result = await progressContractV1.createFromActivityKey(env.DB, profileId, {
    activity_key: activityKey,
    occurred_on: body.occurred_on,
    started_at: null,
    minutes,
    quantity: null,
    boolean_value: null,
    subtype: body.subtype || null,
    note: body.note || null
  });

  if (result.error) return bad(result.error);

  return json({ ok: true, id: result.item.id, item: result.item, compatibility: 'progress-v1' }, 201);
}

export async function deleteSessionRoute() {
  return bad('Legacy session deletion is retired. Delete canonical records through /api/v1/progress/:id.', 410);
}
