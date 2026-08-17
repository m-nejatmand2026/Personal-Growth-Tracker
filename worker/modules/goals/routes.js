import {
  bad,
  json,
  readJsonBody
} from '../../core/http.js';

import {
  resolveProfileId
} from '../../core/profile.js';

import {
  isDateKey,
  optionalText,
  requiredText
} from '../../core/validation.js';

import {
  areasContractV1
} from '../areas/public.js';

import {
  createGoal,
  getGoal,
  listGoals,
  updateGoal
} from './data.js';

const MEASUREMENT_TYPES =
  new Set([
    'time',
    'count',
    'milestone',
    'boolean',
    'number'
  ]);

const PERIODS =
  new Set([
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'custom',
    'none'
  ]);

const PRIORITIES =
  new Set([
    'high',
    'medium',
    'low'
  ]);

const STATUSES =
  new Set([
    'active',
    'paused',
    'completed',
    'archived'
  ]);

function nullableNumber(value) {
  if (
    value == null
    || value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function withAreaReference(
  goal,
  area
) {
  if (!goal) return null;

  return {
    ...goal,

    area_name:
      area?.name || null,

    area_color:
      area?.color || null,

    area_icon:
      area?.icon || null
  };
}

async function enrichGoal(
  DB,
  profileId,
  goal
) {
  if (!goal) return null;

  if (goal.area_id == null) {
    return withAreaReference(
      goal,
      null
    );
  }

  const area =
    await areasContractV1.getReference(
      DB,
      profileId,
      goal.area_id
    );

  return withAreaReference(
    goal,
    area
  );
}

async function enrichGoals(
  DB,
  profileId,
  goals
) {
  const areas =
    await areasContractV1.listReferences(
      DB,
      profileId,
      {
        includeArchived: true
      }
    );

  const areaById =
    new Map(
      areas.map(
        (area) => [
          Number(area.id),
          area
        ]
      )
    );

  return goals.map(
    (goal) =>
      withAreaReference(
        goal,
        goal.area_id == null
          ? null
          : areaById.get(
              Number(goal.area_id)
            )
      )
  );
}

async function normalizeGoalInput(
  DB,
  profileId,
  body,
  existing = null
) {
  const name =
    requiredText(
      body.name
        ?? existing?.name,
      120
    );

  if (!name) {
    return {
      error:
        'Goal name is required and must be 120 characters or fewer.'
    };
  }

  const areaIdRaw =
    body.area_id
    ?? existing?.area_id
    ?? null;

  const areaId =
    areaIdRaw == null
    || areaIdRaw === ''
      ? null
      : Number(areaIdRaw);

  if (areaId != null) {
    if (
      !Number.isInteger(areaId)
      || areaId <= 0
    ) {
      return {
        error: 'Invalid area id.'
      };
    }

    const area =
      await areasContractV1
        .getReference(
          DB,
          profileId,
          areaId
        );

    if (!area) {
      return {
        error: 'Area not found.'
      };
    }
  }

  const measurementType =
    body.measurement_type
    ?? existing?.measurement_type
    ?? 'time';

  const targetPeriod =
    body.target_period
    ?? existing?.target_period
    ?? 'weekly';

  const priority =
    body.priority
    ?? existing?.priority
    ?? 'medium';

  const status =
    body.status
    ?? existing?.status
    ?? 'active';

  if (
    !MEASUREMENT_TYPES
      .has(measurementType)
  ) {
    return {
      error:
        'Invalid goal measurement type.'
    };
  }

  if (!PERIODS.has(targetPeriod)) {
    return {
      error:
        'Invalid target period.'
    };
  }

  if (!PRIORITIES.has(priority)) {
    return {
      error: 'Invalid priority.'
    };
  }

  if (!STATUSES.has(status)) {
    return {
      error:
        'Invalid goal status.'
    };
  }

  const descriptionRaw =
    body.description
    ?? existing?.description
    ?? null;

  const whyRaw =
    body.why_text
    ?? existing?.why_text
    ?? null;

  const unitRaw =
    body.unit
    ?? existing?.unit
    ?? null;

  const description =
    descriptionRaw == null
      ? null
      : optionalText(
          descriptionRaw,
          1000
        );

  const whyText =
    whyRaw == null
      ? null
      : optionalText(
          whyRaw,
          1000
        );

  const unit =
    unitRaw == null
      ? null
      : optionalText(
          unitRaw,
          40
        );

  if (
    descriptionRaw != null
    && description == null
  ) {
    return {
      error:
        'Description must be 1000 characters or fewer.'
    };
  }

  if (
    whyRaw != null
    && whyText == null
  ) {
    return {
      error:
        'Why text must be 1000 characters or fewer.'
    };
  }

  if (
    unitRaw != null
    && unit == null
  ) {
    return {
      error:
        'Unit must be 40 characters or fewer.'
    };
  }

  const targetValueRaw =
    body.target_value
    ?? existing?.target_value
    ?? null;

  const minimumValueRaw =
    body.minimum_value
    ?? existing?.minimum_value
    ?? null;

  const targetValue =
    nullableNumber(
      targetValueRaw
    );

  const minimumValue =
    nullableNumber(
      minimumValueRaw
    );

  if (
    targetValueRaw != null
    && targetValueRaw !== ''
    && targetValue == null
  ) {
    return {
      error:
        'Target value must be numeric.'
    };
  }

  if (
    minimumValueRaw != null
    && minimumValueRaw !== ''
    && minimumValue == null
  ) {
    return {
      error:
        'Minimum value must be numeric.'
    };
  }

  const startDate =
    body.start_date
    ?? existing?.start_date
    ?? null;

  const targetDate =
    body.target_date
    ?? existing?.target_date
    ?? null;

  if (
    startDate
    && !isDateKey(startDate)
  ) {
    return {
      error:
        'Invalid start date.'
    };
  }

  if (
    targetDate
    && !isDateKey(targetDate)
  ) {
    return {
      error:
        'Invalid target date.'
    };
  }

  if (
    startDate
    && targetDate
    && targetDate < startDate
  ) {
    return {
      error:
        'Target date cannot be before start date.'
    };
  }

  const sortOrderRaw =
    body.sort_order
    ?? existing?.sort_order;

  return {
    value: {
      area_id: areaId,
      name,
      description,
      why_text: whyText,
      measurement_type:
        measurementType,
      target_value:
        targetValue,
      minimum_value:
        minimumValue,
      unit,
      target_period:
        targetPeriod,
      start_date:
        startDate,
      target_date:
        targetDate,
      priority,
      status,

      sort_order:
        Number.isFinite(
          Number(sortOrderRaw)
        )
          ? Math.round(
              Number(sortOrderRaw)
            )
          : 100
    }
  };
}

export async function listGoalsRoute({
  request,
  url,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const includeArchived =
    url.searchParams
      .get('include_archived') === '1';

  const goals =
    await listGoals(
      env.DB,
      profileId,
      includeArchived
    );

  return json({
    items: await enrichGoals(
      env.DB,
      profileId,
      goals
    )
  });
}

export async function createGoalRoute({
  request,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const body =
    await readJsonBody(request);

  const normalized =
    await normalizeGoalInput(
      env.DB,
      profileId,
      body
    );

  if (normalized.error) {
    return bad(normalized.error);
  }

  const goal =
    await createGoal(
      env.DB,
      profileId,
      normalized.value
    );

  return json({
    item: await enrichGoal(
      env.DB,
      profileId,
      goal
    )
  }, 201);
}

export async function updateGoalRoute({
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
    return bad(
      'Invalid goal id.'
    );
  }

  const existing =
    await getGoal(
      env.DB,
      profileId,
      id
    );

  if (!existing) {
    return bad(
      'Goal not found.',
      404
    );
  }

  const body =
    await readJsonBody(request);

  const normalized =
    await normalizeGoalInput(
      env.DB,
      profileId,
      body,
      existing
    );

  if (normalized.error) {
    return bad(normalized.error);
  }

  const goal =
    await updateGoal(
      env.DB,
      profileId,
      id,
      normalized.value
    );

  return json({
    item: await enrichGoal(
      env.DB,
      profileId,
      goal
    )
  });
}

export async function archiveGoalRoute({
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
    return bad(
      'Invalid goal id.'
    );
  }

  const existing =
    await getGoal(
      env.DB,
      profileId,
      id
    );

  if (!existing) {
    return bad(
      'Goal not found.',
      404
    );
  }

  const goal =
    await updateGoal(
      env.DB,
      profileId,
      id,
      {
        ...existing,
        status: 'archived'
      }
    );

  return json({
    item: await enrichGoal(
      env.DB,
      profileId,
      goal
    )
  });
}
