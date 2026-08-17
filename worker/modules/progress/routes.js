import {
  bad,
  json,
  readJsonBody
} from '../../core/http.js';

import {
  resolveProfileId
} from '../../core/profile.js';

import {
  normalizeProgressInput
} from './domain.js';

import {
  deleteProgressRecord
} from './data.js';

import {
  progressContractV1
} from './public.js';

function recordId(url) {
  const id =
    Number(
      url.pathname
        .split('/')
        .pop()
    );

  return (
    Number.isInteger(id)
    && id > 0
  )
    ? id
    : null;
}

function validDate(value) {
  if (!value) {
    return true;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/
      .test(value)
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T12:00:00Z`
    );

  return (
    Number.isFinite(
      date.getTime()
    )
    && date
      .toISOString()
      .slice(0, 10)
      === value
  );
}

export async function listProgressRoute({
  request,
  url,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const from =
    url.searchParams
      .get('from');

  const to =
    url.searchParams
      .get('to');

  const limit =
    Number(
      url.searchParams
        .get('limit')
      || 100
    );

  if (
    !validDate(from)
    || !validDate(to)
  ) {
    return bad(
      'Invalid progress date range.'
    );
  }

  if (
    from
    && to
    && from > to
  ) {
    return bad(
      'Progress from date cannot be after to date.'
    );
  }

  return json({
    items:
      await progressContractV1
        .listHistory(
          env.DB,
          profileId,
          {
            from: from || null,
            to: to || null,
            limit,
            includeLegacy: true
          }
        )
  });
}

export async function createProgressRoute({
  request,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const body =
    await readJsonBody(request);

  const normalized =
    normalizeProgressInput(
      body
    );

  if (normalized.error) {
    return bad(
      normalized.error
    );
  }

  const result =
    await progressContractV1
      .createFromActivityKey(
        env.DB,
        profileId,
        normalized.value
      );

  if (result.error) {
    return bad(
      result.error
    );
  }

  return json(
    result,
    201
  );
}

export async function deleteProgressRoute({
  request,
  url,
  env
}) {
  const profileId =
    resolveProfileId(request);

  const id =
    recordId(url);

  if (!id) {
    return bad(
      'Invalid progress record id.'
    );
  }

  const existing =
    await progressContractV1
      .getReference(
        env.DB,
        profileId,
        id
      );

  if (!existing) {
    return bad(
      'Progress record not found.',
      404
    );
  }

  await deleteProgressRecord(
    env.DB,
    profileId,
    id
  );

  return json({
    ok: true
  });
}
