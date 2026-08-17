import {
  exportJournalData,
  getJournalEntry,
  listJournalEntries
} from './data.js';

function toReference(entry) {
  if (!entry) return null;

  return Object.freeze({
    id:
      Number(entry.id),

    occurred_on:
      entry.occurred_on,

    title:
      entry.title || null,

    body:
      entry.body,

    entry_type:
      entry.entry_type,

    tags:
      Object.freeze(
        [...(entry.tags || [])]
      )
  });
}

/**
 * Journal public contract — Version 1.
 *
 * Journal remains private reflection data. Nothing in this
 * contract implies eligibility for Progress, Insights or AI.
 */
export const journalContractV1 =
  Object.freeze({
    async getReference(
      DB,
      profileId,
      id
    ) {
      const numericId =
        Number(id);

      if (
        !Number.isInteger(numericId)
        || numericId <= 0
      ) {
        return null;
      }

      return toReference(
        await getJournalEntry(
          DB,
          profileId,
          numericId
        )
      );
    },

    async list(
      DB,
      profileId,
      filters = {}
    ) {
      const entries =
        await listJournalEntries(
          DB,
          profileId,
          filters
        );

      return Object.freeze(
        entries.map(
          toReference
        )
      );
    }
  });

export async function exportJournalV1(
  DB,
  profileId
) {
  return exportJournalData(
    DB,
    profileId
  );
}
