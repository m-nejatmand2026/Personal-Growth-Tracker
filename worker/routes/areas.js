import { bad, json, readJsonBody } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { requiredText } from '../core/validation.js';
import { createArea, getArea, listAreas, listAreaTemplates, updateArea } from '../data/areas.js';

function normalizeAreaInput(body, existing = null) {
  const name = requiredText(body.name ?? existing?.name, 80);
  if (!name) return { error: 'Area name is required and must be 80 characters or fewer.' };
  const icon = body.icon ?? existing?.icon ?? null;
  const color = body.color ?? existing?.color ?? null;
  const templateKey = body.template_key ?? existing?.template_key ?? null;
  const sortOrder = body.sort_order ?? existing?.sort_order ?? 100;
  const active = body.active ?? (existing ? Boolean(existing.active) : true);
  return {
    value: {
      name,
      icon: typeof icon === 'string' && icon.length <= 50 ? icon : null,
      color: typeof color === 'string' && color.length <= 32 ? color : null,
      template_key: typeof templateKey === 'string' && templateKey.length <= 80 ? templateKey : null,
      sort_order: Number.isFinite(Number(sortOrder)) ? Math.round(Number(sortOrder)) : 100,
      active: Boolean(active)
    }
  };
}

export async function areaTemplatesRoute({ env }) {
  return json({ items: await listAreaTemplates(env.DB) });
}

export async function listAreasRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const includeArchived = url.searchParams.get('include_archived') === '1';
  return json({ items: await listAreas(env.DB, profileId, includeArchived) });
}

export async function createAreaRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = normalizeAreaInput(body);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await createArea(env.DB, profileId, normalized.value) }, 201);
}

export async function updateAreaRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = Number(url.pathname.split('/').pop());
  if (!Number.isInteger(id) || id <= 0) return bad('Invalid area id.');
  const existing = await getArea(env.DB, profileId, id);
  if (!existing) return bad('Area not found.', 404);
  const body = await readJsonBody(request);
  const normalized = normalizeAreaInput(body, existing);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await updateArea(env.DB, profileId, id, normalized.value) });
}

export async function archiveAreaRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = Number(url.pathname.split('/').pop());
  if (!Number.isInteger(id) || id <= 0) return bad('Invalid area id.');
  const existing = await getArea(env.DB, profileId, id);
  if (!existing) return bad('Area not found.', 404);
  return json({ item: await updateArea(env.DB, profileId, id, { ...existing, active: false }) });
}
