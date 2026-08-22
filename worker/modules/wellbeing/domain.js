import {
  integerInRange,
  isDateKey,
  requiredText
} from '../../core/validation.js';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const CONTEXT_KEYS = new Set([
  'normal',
  'social',
  'travel',
  'low_energy',
  'sick_recovery'
]);

function optionalText(value, maximum) {
  if (value == null || value === '') return { value: null };
  if (typeof value !== 'string') return { error: true };
  const text = value.trim();
  if (text.length > maximum) return { error: true };
  return { value: text || null };
}

function optionalTime(value) {
  if (value == null || value === '') return { value: null };
  if (typeof value !== 'string' || !TIME.test(value)) return { error: true };
  return { value };
}

export function normalizeEnergyInput(body = {}) {
  const occurredOn = body.occurred_on;
  const label = requiredText(body.label, 80);
  const row = integerInRange(body.row_idx, 0, 5);
  const column = integerInRange(body.col_idx, 0, 5);
  const energy = integerInRange(body.energy_score, -3, 3);
  const valence = integerInRange(body.valence_score, -3, 3);
  const note = optionalText(body.note, 500);

  if (!isDateKey(occurredOn)) return { error: 'Choose a valid wellbeing date.' };
  if (!label) return { error: 'Energy label is required.' };
  if (row == null || column == null || energy == null || valence == null) {
    return { error: 'Invalid energy-map coordinates or scores.' };
  }
  if (note.error) return { error: 'Note must be 500 characters or fewer.' };

  return {
    value: {
      occurred_on: occurredOn,
      label,
      row_idx: row,
      col_idx: column,
      energy_score: energy,
      valence_score: valence,
      note: note.value
    }
  };
}

export function normalizeSleepInput(body = {}) {
  const occurredOn = body.occurred_on;
  const bedtime = optionalTime(body.bedtime);
  const wakeTime = optionalTime(body.wake_time);
  const minutes = integerInRange(body.minutes, 0, 1440);
  const quality = body.quality == null || body.quality === ''
    ? null
    : integerInRange(body.quality, 1, 5);
  const note = optionalText(body.note, 500);

  if (!isDateKey(occurredOn)) return { error: 'Choose a valid sleep date.' };
  if (bedtime.error || wakeTime.error) {
    return { error: 'Bedtime and wake time must use HH:MM.' };
  }
  if (minutes == null) return { error: 'Sleep minutes must be between 0 and 1440.' };
  if (body.quality != null && body.quality !== '' && quality == null) {
    return { error: 'Sleep quality must be between 1 and 5.' };
  }
  if (note.error) return { error: 'Note must be 500 characters or fewer.' };

  return {
    value: {
      occurred_on: occurredOn,
      bedtime: bedtime.value,
      wake_time: wakeTime.value,
      minutes,
      quality,
      note: note.value
    }
  };
}

export function normalizeDayContextInput(body = {}) {
  const occurredOn = body.occurred_on;
  const contextKey = typeof body.context_key === 'string'
    ? body.context_key.trim()
    : '';
  const note = optionalText(body.note, 500);

  if (!isDateKey(occurredOn)) return { error: 'Choose a valid context date.' };
  if (!CONTEXT_KEYS.has(contextKey)) return { error: 'Choose a valid day context.' };
  if (note.error) return { error: 'Note must be 500 characters or fewer.' };

  return {
    value: {
      occurred_on: occurredOn,
      context_key: contextKey,
      note: note.value
    }
  };
}

export const wellbeingDomainVersion = 1;
