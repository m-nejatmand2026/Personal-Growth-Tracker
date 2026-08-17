import { exportPlansData } from './data.js';
import {
  getPlanForDate,
  listPlanAllocationsForRange
} from './data.js';

import {
  goalsContractV1
} from '../goals/public.js';

function freezeValue(value) {
  return Object.freeze({
    goal_id:
      Number(value.goal_id),

    time_target_minutes:
      value.time_target_minutes == null
        ? null
        : Number(
            value.time_target_minutes
          ),

    time_minimum_minutes:
      value.time_minimum_minutes == null
        ? null
        : Number(
            value.time_minimum_minutes
          ),

    quantity_target:
      value.quantity_target == null
        ? null
        : Number(
            value.quantity_target
          ),

    quantity_minimum:
      value.quantity_minimum == null
        ? null
        : Number(
            value.quantity_minimum
          ),

    period:
      value.period
  });
}

export const plansContractV1 =
  Object.freeze({
    async getForDate(
      DB,
      profileId,
      date
    ) {
      const plan =
        await getPlanForDate(
          DB,
          profileId,
          date
        );

      return Object.freeze({
        version:
          plan.version
            ? Object.freeze({
                id:
                  Number(
                    plan.version.id
                  ),

                label:
                  plan.version.label,

                effective_from:
                  plan.version
                    .effective_from,

                effective_to:
                  plan.version
                    .effective_to
                    || null
              })
            : null,

        values:
          Object.freeze(
            plan.values.map(
              freezeValue
            )
          )
      });
    },

    /**
     * Stable allocation read model for dependent modules.
     *
     * Plans owns allocation persistence. Goals owns Goal
     * identity/status. Consumers do not query either table.
     */
    async getActiveAllocationsForRange(
      DB,
      profileId,
      start,
      end
    ) {
      const [
        rows,
        goals
      ] = await Promise.all([
        listPlanAllocationsForRange(
          DB,
          profileId,
          start,
          end
        ),

        goalsContractV1.listReferences(
          DB,
          profileId
        )
      ]);

      const activeGoals =
        new Map(
          goals
            .filter(
              (goal) =>
                goal.status === 'active'
            )
            .map(
              (goal) => [
                Number(goal.id),
                goal
              ]
            )
        );

      const versions =
        new Map();

      for (const row of rows) {
        const goal =
          activeGoals.get(
            Number(row.goal_id)
          );

        if (!goal) {
          continue;
        }

        const id =
          Number(
            row.plan_version_id
          );

        if (!versions.has(id)) {
          versions.set(
            id,
            {
              id,

              effective_from:
                row.effective_from,

              effective_to:
                row.effective_to
                || null,

              values: []
            }
          );
        }

        versions
          .get(id)
          .values
          .push(
            Object.freeze({
              goal_id:
                Number(
                  row.goal_id
                ),

              goal_name:
                goal.name,

              time_target_minutes:
                row.time_target_minutes == null
                  ? null
                  : Number(
                      row.time_target_minutes
                    ),

              time_minimum_minutes:
                row.time_minimum_minutes == null
                  ? null
                  : Number(
                      row.time_minimum_minutes
                    ),

              quantity_target:
                row.quantity_target == null
                  ? null
                  : Number(
                      row.quantity_target
                    ),

              quantity_minimum:
                row.quantity_minimum == null
                  ? null
                  : Number(
                      row.quantity_minimum
                    ),

              period:
                row.period
            })
          );
      }

      return Object.freeze({
        versions:
          Object.freeze(
            [...versions.values()]
              .sort(
                (a, b) =>
                  a.effective_from
                    .localeCompare(
                      b.effective_from
                    )
              )
              .map(
                (version) =>
                  Object.freeze({
                    ...version,

                    values:
                      Object.freeze(
                        version.values
                      )
                  })
              )
          )
      });
    }
  });

export async function exportPlansV1(
  DB,
  profileId
) {
  return exportPlansData(
    DB,
    profileId
  );
}
