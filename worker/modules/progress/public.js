import {
  activitiesContractV1
} from '../activities/public.js';

import {
  createProgressRecord,
  exportProgressData,
  getProgressRecord,
  listLegacySessions,
  listProgressRecords
} from './data.js';

function canonicalReference(
  row,
  activity
) {
  return Object.freeze({
    id:
      Number(row.id),

    record_kind:
      'progress',

    goal_id:
      row.goal_id == null
        ? null
        : Number(row.goal_id),

    activity_id:
      row.activity_id == null
        ? null
        : Number(row.activity_id),

    activity_key:
      activity?.key || null,

    activity_name:
      activity?.name
      || activity?.key
      || 'Activity',

    occurred_on:
      row.occurred_on,

    started_at:
      row.started_at || null,

    minutes:
      row.minutes == null
        ? null
        : Number(row.minutes),

    quantity:
      row.quantity == null
        ? null
        : Number(row.quantity),

    boolean_value:
      row.boolean_value == null
        ? null
        : Boolean(
            row.boolean_value
          ),

    subtype:
      row.subtype || null,

    note:
      row.note || null,

    source:
      row.source,

    created_at:
      row.created_at || null
  });
}

function legacyReference(
  row,
  activity
) {
  return Object.freeze({
    id:
      Number(row.id),

    record_kind:
      'legacy-session',

    goal_id:
      activity?.goal_id
      ?? null,

    activity_id:
      activity?.id
      ?? null,

    activity_key:
      row.activity_key,

    activity_name:
      activity?.name
      || row.activity_key,

    occurred_on:
      row.occurred_on,

    started_at:
      null,

    minutes:
      Number(row.minutes) || 0,

    quantity:
      null,

    boolean_value:
      null,

    subtype:
      row.subtype || null,

    note:
      row.note || null,

    source:
      'legacy-beta',

    created_at:
      row.created_at || null
  });
}

export const progressContractV1 =
  Object.freeze({
    async createFromActivityKey(
      DB,
      profileId,
      input
    ) {
      const activity =
        await activitiesContractV1
          .getReferenceByKey(
            DB,
            profileId,
            input.activity_key
          );

      if (!activity) {
        return {
          error:
            'Activity not found or archived.'
        };
      }

      const row =
        await createProgressRecord(
          DB,
          profileId,
          {
            goal_id:
              activity.goal_id,

            activity_id:
              activity.id,

            occurred_on:
              input.occurred_on,

            started_at:
              input.started_at,

            minutes:
              input.minutes,

            quantity:
              input.quantity,

            boolean_value:
              input.boolean_value,

            subtype:
              input.subtype,

            note:
              input.note,

            source:
              'manual'
          }
        );

      return {
        item:
          canonicalReference(
            row,
            activity
          )
      };
    },

    async getReference(
      DB,
      profileId,
      id
    ) {
      const row =
        await getProgressRecord(
          DB,
          profileId,
          id
        );

      if (!row) {
        return null;
      }

      const activities =
        await activitiesContractV1
          .listReferences(
            DB,
            profileId,
            {
              includeArchived: true
            }
          );

      const activity =
        activities.find(
          (item) =>
            Number(item.id)
            === Number(
              row.activity_id
            )
        );

      return canonicalReference(
        row,
        activity
      );
    },

    async listHistory(
      DB,
      profileId,
      {
        from = null,
        to = null,
        limit = 100,
        includeLegacy = true
      } = {}
    ) {
      const [
        canonical,
        legacy,
        activities
      ] = await Promise.all([
        listProgressRecords(
          DB,
          profileId,
          {
            from,
            to,
            limit
          }
        ),

        includeLegacy
          ? listLegacySessions(
              DB,
              profileId,
              {
                from,
                to,
                limit
              }
            )
          : Promise.resolve([]),

        activitiesContractV1
          .listReferences(
            DB,
            profileId,
            {
              includeArchived: true
            }
          )
      ]);

      const byId =
        new Map(
          activities.map(
            (activity) => [
              Number(activity.id),
              activity
            ]
          )
        );

      const byKey =
        new Map(
          activities.map(
            (activity) => [
              activity.key,
              activity
            ]
          )
        );

      return Object.freeze(
        [
          ...canonical.map(
            (row) =>
              canonicalReference(
                row,
                byId.get(
                  Number(
                    row.activity_id
                  )
                )
              )
          ),

          ...legacy.map(
            (row) =>
              legacyReference(
                row,
                byKey.get(
                  row.activity_key
                )
              )
          )
        ]
          .sort(
            (a, b) =>
              b.occurred_on
                .localeCompare(
                  a.occurred_on
                )
              || Number(b.id)
                - Number(a.id)
          )
          .slice(
            0,
            Math.min(
              500,
              Math.max(
                1,
                Number(limit) || 100
              )
            )
          )
      );
    }
  });

export async function exportProgressV1(
  DB,
  profileId
) {
  return exportProgressData(
    DB,
    profileId
  );
}
