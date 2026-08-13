import { bad, json, readJsonBody } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { normalizeProgressInput } from '../modules/progress/domain.js';
import { progressContractV1 } from '../modules/progress/public.js';

/**
 * Transitional compatibility endpoint for old Beta clients.
 *
 * POST /api/session no longer writes the legacy sessions table. It forwards
 * the old payload shape into Progress V1 so every new factual record is
 * canonical even before all old clients have refreshed.
 */
export async function createSessionRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = normalizeProgressInput(body);

  if (normalized.error) {
    return bad(normalized.error);
  }

  const result = await progressContractV1.createFromActivityKey(
    env.DB,
    profileId,
    normalized.value
  );

  if (result.error) {
    return bad(result.error);
  }

  return json({
    ok: true,
    id: result.item.id,
    item: result.item,
    compatibility: 'progress-v1'
  }, 201);
}

export async function deleteSessionRoute() {
  return bad(
    'Legacy session deletion is retired. Delete canonical records through /api/v1/progress/:id.',
    410
  );
}
