import {
  bad,
  json,
  readJsonBody
} from '../../core/http.js';

import { resolveProfileId } from '../../core/profile.js';

import {
  optionalText,
  requiredText
} from '../../core/validation.js';

import { goalsContractV1 } from '../goals/public.js';

import {
  archiveActivity,
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  restoreActivity,
  updateActivity
} from './data.js';

function createActivityKey() {
  return `act_${globalThis.crypto.randomUUID().replaceAll('-', '')}`;
}

function activityId(url, terminalAction = false) {
  const parts = url.pathname.split('/').filter(Boolean);
  const raw = terminalAction ? parts.at(-2) : parts.at(-1);
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function normalizeActivityInput(DB, profileId, body, existing = null) {
  const goalIdRaw = body.goal_id ?? existing?.goal_id;
  const goalId = Number(goalIdRaw);

  if (!Number.isInteger(goalId) || goalId <= 0) return { error: 'Goal is required.' };

  const goal = await goalsContractV1.getReference(DB, profileId, goalId);
  if (!goal) return { error: 'Goal not found.' };
  if (goal.status === 'archived') return { error: 'An Activity cannot belong to an archived Goal.' };

  const name = requiredText(body.name ?? existing?.name, 120);
  if (!name) return { error: 'Activity name is required and must be 120 characters or fewer.' };

  const descriptionRaw = body.description ?? existing?.description ?? null;
  const description = descriptionRaw == null ? null : optionalText(descriptionRaw, 1000);
  if (descriptionRaw != null && description == null) return { error: 'Description must be 1000 characters or fewer.' };

  const sortOrderRaw = body.sort_order ?? existing?.sort_order ?? 100;
  const sortOrder = Number(sortOrderRaw);
  if (!Number.isFinite(sortOrder)) return { error: 'Sort order must be numeric.' };

  return {
    value: {
      goal_id: goalId,
      key: existing?.key || createActivityKey(),
      name,
      description,
      sort_order: Math.round(sortOrder)
    }
  };
}

export async function listActivitiesRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const includeArchived = url.searchParams.get('include_archived') === '1';
  const goalIdRaw = url.searchParams.get('goal_id');
  let goalId = null;

  if (goalIdRaw != null && goalIdRaw !== '') {
    goalId = Number(goalIdRaw);
    if (!Number.isInteger(goalId) || goalId <= 0) return bad('Invalid goal id.');
    const goal = await goalsContractV1.getReference(env.DB, profileId, goalId);
    if (!goal) return bad('Goal not found.', 404);
    if (!includeArchived && goal.status === 'archived') return json({ items: [] });
  }

  const items = await listActivities(env.DB, profileId, { includeArchived, goalId });
  if (includeArchived) return json({ items });

  const goals = await goalsContractV1.listReferences(env.DB, profileId);
  const usableGoalIds = new Set(goals.map((goal) => Number(goal.id)));
  return json({ items: items.filter((item) => usableGoalIds.has(Number(item.goal_id))) });
}

export async function createActivityRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = await normalizeActivityInput(env.DB, profileId, body);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await createActivity(env.DB, profileId, normalized.value) }, 201);
}

export async function updateActivityRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = activityId(url);
  if (!id) return bad('Invalid activity id.');

  const existing = await getActivity(env.DB, profileId, id);
  if (!existing) return bad('Activity not found.', 404);
  if (!existing.active) return bad('Archived Activities cannot be edited.');

  const body = await readJsonBody(request);
  const normalized = await normalizeActivityInput(env.DB, profileId, body, existing);
  if (normalized.error) return bad(normalized.error);

  return json({ item: await updateActivity(env.DB, profileId, id, normalized.value) });
}

export async function archiveActivityRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = activityId(url);
  if (!id) return bad('Invalid activity id.');
  const existing = await getActivity(env.DB, profileId, id);
  if (!existing) return bad('Activity not found.', 404);
  return json({ item: await archiveActivity(env.DB, profileId, id) });
}

export async function restoreActivityRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = activityId(url, true);
  if (!id) return bad('Invalid activity id.');
  const existing = await getActivity(env.DB, profileId, id);
  if (!existing) return bad('Activity not found.', 404);
  const goal = await goalsContractV1.getReference(env.DB, profileId, existing.goal_id);
  if (!goal || goal.status === 'archived') return bad('Restore the parent Direction before restoring this Activity.');
  return json({ item: await restoreActivity(env.DB, profileId, id) });
}

export async function removeActivityRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = activityId(url, true);
  if (!id) return bad('Invalid activity id.');
  const existing = await getActivity(env.DB, profileId, id);
  if (!existing) return bad('Activity not found.', 404);
  await deleteActivity(env.DB, profileId, id);
  return json({ removed: true, id });
}
