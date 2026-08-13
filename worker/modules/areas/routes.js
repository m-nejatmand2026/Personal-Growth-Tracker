import {
  bad,
  json,
  readJsonBody
} from '../../core/http.js';

import {
  resolveProfileId
} from '../../core/profile.js';

import {
  requiredText
} from '../../core/validation.js';

import {
  createArea,
  getArea,
  getAreaTemplate,
  listAreas,
  listAreaTemplates,
  updateArea
} from './data.js';

function safeColor(value) {
  if (value == null || value === '') {
    return null;
  }

  return (
    typeof value === 'string'
    && /^#[0-9a-fA-F]{6}$/.test(value)
  )
    ? value.toUpperCase()
    : null;
}

async function normalizeAreaInput(
  DB,
  body,
  existing = null
) {
  const templateKeyRaw =
    body.template_key
    ?? existing?.template_key
    ?? null;

  const templateKey =
    typeof templateKeyRaw === 'string'
    && templateKeyRaw
      ? templateKeyRaw
      : null;

  const template = templateKey
    ? await getAreaTemplate(
        DB,
        templateKey
      )
    : null;

  if (templateKey && !template) {
    return {
      error: 'Area template not found.'
    };
  }

  const name = requiredText(
    body.name
      ?? existing?.name
      ?? template?.name,
    80
  );

  if (!name) {
    return {
      error:
        'Area name is required and must be 80 characters or fewer.'
    };
  }

  const iconRaw =
    body.icon
    ?? existing?.icon
    ?? template?.icon
    ?? null;

  const colorRaw =
    body.color
    ?? existing?.color
    ?? template?.default_color
    ?? null;

  const color = safeColor(colorRaw);

  if (colorRaw && !color) {
    return {
      error:
        'Area color must be a six-digit hex color such as #0F766E.'
    };
  }

  const sortOrder =
    body.sort_order
    ?? existing?.sort_order
    ?? template?.sort_order
    ?? 100;

  const active =
    body.active
    ?? (
      existing
        ? Boolean(existing.active)
        : true
    );

  return {
    value: {
      name,

      icon:
        typeof iconRaw === 'string'
        && /^[a-z0-9-]{1,50}$/i
          .test(iconRaw)
          ? iconRaw
          : null,

      color,
      template_key: templateKey,

      sort_order:
        Number.isFinite(
          Number(sortOrder)
        )
          ? Math.round(
              Number(sortOrder)
            )
          : 100,

      active: Boolean(active)
    }
  };
}

export async function areaTemplatesRoute({
  env
}) {
  return json({
    items:
      await listAreaTemplates(env.DB)
  });
}

export async function listAreasRoute({
  request,
  url,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const includeArchived =
    url.searchParams
      .get('include_archived') === '1';

  return json({
    items: await listAreas(
      env.DB,
      profileId,
      includeArchived
    )
  });
}

export async function createAreaRoute({
  request,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const body =
    await readJsonBody(request);

  const normalized =
    await normalizeAreaInput(
      env.DB,
      body
    );

  if (normalized.error) {
    return bad(normalized.error);
  }

  return json({
    item: await createArea(
      env.DB,
      profileId,
      normalized.value
    )
  }, 201);
}

export async function updateAreaRoute({
  request,
  url,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const id =
    Number(
      url.pathname.split('/').pop()
    );

  if (
    !Number.isInteger(id)
    || id <= 0
  ) {
    return bad('Invalid area id.');
  }

  const existing =
    await getArea(
      env.DB,
      profileId,
      id
    );

  if (!existing) {
    return bad(
      'Area not found.',
      404
    );
  }

  const body =
    await readJsonBody(request);

  const normalized =
    await normalizeAreaInput(
      env.DB,
      body,
      existing
    );

  if (normalized.error) {
    return bad(normalized.error);
  }

  return json({
    item: await updateArea(
      env.DB,
      profileId,
      id,
      normalized.value
    )
  });
}

export async function archiveAreaRoute({
  request,
  url,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const id =
    Number(
      url.pathname.split('/').pop()
    );

  if (
    !Number.isInteger(id)
    || id <= 0
  ) {
    return bad('Invalid area id.');
  }

  const existing =
    await getArea(
      env.DB,
      profileId,
      id
    );

  if (!existing) {
    return bad(
      'Area not found.',
      404
    );
  }

  return json({
    item: await updateArea(
      env.DB,
      profileId,
      id,
      {
        ...existing,
        active: false
      }
    )
  });
}
