import { bad, json, readJsonBody } from '../../core/http.js';
import { resolveProfileId } from '../../core/profile.js';
import { integerInRange, isDateKey, requiredText } from '../../core/validation.js';
import { wellbeingContractV1 } from './public.js';

function normalizeEnergyInput(body = {}) {
  const occurredOn = body.occurred_on;
  const label = requiredText(body.label, 80);
  const row = integerInRange(body.row_idx, 0, 5);
  const column = integerInRange(body.col_idx, 0, 5);
  const energy = integerInRange(body.energy_score, -3, 3);
  const valence = integerInRange(body.valence_score, -3, 3);
  const note = body.note == null ? null : String(body.note).trim();

  if (!isDateKey(occurredOn)) return { error: 'Choose a valid wellbeing date.' };
  if (!label) return { error: 'Energy label is required.' };
  if (row == null || column == null || energy == null || valence == null) {
    return { error: 'Invalid energy-map coordinates or scores.' };
  }
  if (note && note.length > 500) return { error: 'Note must be 500 characters or fewer.' };

  return {
    value: {
      occurred_on: occurredOn,
      label,
      row_idx: row,
      col_idx: column,
      energy_score: energy,
      valence_score: valence,
      note: note || null
    }
  };
}

export async function wellbeingDayRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const date = url.searchParams.get('date');
  if (!isDateKey(date)) return bad('date is required and must be valid.');
  return json(await wellbeingContractV1.getDay(env.DB, profileId, date));
}

export async function listEnergyRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = Number(url.searchParams.get('limit') || 100);

  if ((from && !isDateKey(from)) || (to && !isDateKey(to))) {
    return bad('Invalid wellbeing date range.');
  }
  if (from && to && from > to) return bad('from cannot be after to.');

  return json({
    items: await wellbeingContractV1.listEnergy(env.DB, profileId, {
      from: from || null,
      to: to || null,
      limit
    })
  });
}

export async function recordEnergyRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const normalized = normalizeEnergyInput(await readJsonBody(request));
  if (normalized.error) return bad(normalized.error);

  return json({
    item: await wellbeingContractV1.recordEnergy(env.DB, profileId, normalized.value)
  });
}
