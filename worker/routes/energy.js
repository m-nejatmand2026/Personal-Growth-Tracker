import { bad, json, readJsonBody } from '../core/http.js';
import { resolveProfileId } from '../core/profile.js';
import { integerInRange, isDateKey, requiredText } from '../core/validation.js';
import { wellbeingContractV1 } from '../modules/wellbeing/public.js';

/**
 * Legacy /api/energy compatibility adapter.
 *
 * New writes are profile-scoped Wellbeing V1 records. The original global
 * energy_logs table remains read-only historical compatibility data.
 */
export async function energyRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);

  const occurredOn = body.occurred_on;
  const label = requiredText(body.label, 80);
  const row = integerInRange(body.row_idx, 0, 5);
  const column = integerInRange(body.col_idx, 0, 5);
  const energy = integerInRange(body.energy_score, -3, 3);
  const valence = integerInRange(body.valence_score, -3, 3);
  const note = body.note == null ? null : String(body.note).trim();

  if (!isDateKey(occurredOn)) return bad('Choose a valid wellbeing date.');
  if (!label) return bad('Energy label is required.');
  if (row == null || column == null || energy == null || valence == null) {
    return bad('Invalid energy-map coordinates or scores.');
  }
  if (note && note.length > 500) return bad('Note must be 500 characters or fewer.');

  const item = await wellbeingContractV1.recordEnergy(env.DB, profileId, {
    occurred_on: occurredOn,
    label,
    row_idx: row,
    col_idx: column,
    energy_score: energy,
    valence_score: valence,
    note: note || null
  });

  return json({ ok: true, item });
}
