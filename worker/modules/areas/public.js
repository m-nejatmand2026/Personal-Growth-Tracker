import { exportAreasData } from './data.js';
import {
  getArea,
  listAreas
} from './data.js';

/**
 * Areas public contract — Version 1.
 *
 * Consumers receive stable Area references without reading
 * the Areas module's private table or persistence adapter.
 */
function toReference(area) {
  if (!area) return null;

  return Object.freeze({
    id: Number(area.id),
    profile_id: area.profile_id,
    name: area.name,
    icon: area.icon || null,
    color: area.color || null,
    active: Boolean(area.active)
  });
}

export const areasContractV1 = Object.freeze({
  async getReference(
    DB,
    profileId,
    id
  ) {
    const numericId = Number(id);

    if (
      !Number.isInteger(numericId)
      || numericId <= 0
    ) {
      return null;
    }

    return toReference(
      await getArea(
        DB,
        profileId,
        numericId
      )
    );
  },

  async listReferences(
    DB,
    profileId,
    { includeArchived = false } = {}
  ) {
    const areas = await listAreas(
      DB,
      profileId,
      includeArchived
    );

    return areas.map(toReference);
  }
});

export async function exportAreasV1(
  DB,
  profileId
) {
  return exportAreasData(
    DB,
    profileId
  );
}
