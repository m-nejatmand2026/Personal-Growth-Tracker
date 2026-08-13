import { bad, json, readJsonBody } from '../../core/http.js';
import { resolveProfileId } from '../../core/profile.js';
import {
  canTransitionDailyPlanStatus,
  isDateKey,
  normalizeDailyPlanInput,
  normalizeDailyPlanPatch
} from './domain.js';
import {
  createDailyPlanItem,
  deleteDailyPlanItem,
  getDailyPlanItem,
  listDailyPlanItems,
  updateDailyPlanItem,
  updateDailyPlanStatus
} from './data.js';

function itemId(url) {
  const id = Number(url.pathname.split('/').pop());
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function listDailyPlanRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const date = url.searchParams.get('date');
  if (!date || !isDateKey(date)) return bad('A valid date is required.');
  const includeClosed = url.searchParams.get('include_closed') === '1';
  return json({ items: await listDailyPlanItems(env.DB, profileId, date, includeClosed) });
}

export async function createDailyPlanRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = normalizeDailyPlanInput(body);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await createDailyPlanItem(env.DB, profileId, normalized.value) }, 201);
}

export async function updateDailyPlanRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = itemId(url);
  if (!id) return bad('Invalid daily-plan item id.');
  const existing = await getDailyPlanItem(env.DB, profileId, id);
  if (!existing) return bad('Daily-plan item not found.', 404);

  const body = await readJsonBody(request);
  let item = existing;

  const hasFieldChanges = [
    'planned_for','title','activity_key','activity_label','subtype',
    'planned_minutes','planned_time','note','sort_order'
  ].some((key) => Object.prototype.hasOwnProperty.call(body, key));

  if (hasFieldChanges) {
    const normalized = normalizeDailyPlanPatch(body, existing);
    if (normalized.error) return bad(normalized.error);
    item = await updateDailyPlanItem(env.DB, profileId, id, normalized.value);
  }

  if (body.status !== undefined) {
    if (!canTransitionDailyPlanStatus(item.status, body.status)) {
      return bad(`Cannot change daily-plan status from ${item.status} to ${body.status}.`);
    }
    item = await updateDailyPlanStatus(env.DB, profileId, id, body.status);
  }

  return json({ item });
}

export async function deleteDailyPlanRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = itemId(url);
  if (!id) return bad('Invalid daily-plan item id.');
  const existing = await getDailyPlanItem(env.DB, profileId, id);
  if (!existing) return bad('Daily-plan item not found.', 404);
  await deleteDailyPlanItem(env.DB, profileId, id);
  return json({ ok: true });
}
