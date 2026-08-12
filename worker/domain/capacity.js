const MINUTES_PER_DAY = 24 * 60;

function parseDate(dateText) {
  return new Date(`${dateText}T12:00:00Z`);
}

export function addCivilDays(dateText, days) {
  const date = parseDate(dateText);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function mondayIndex(dateText) {
  const day = parseDate(dateText).getUTCDay();
  return (day + 6) % 7;
}

export function startOfWeek(dateText) {
  return addCivilDays(dateText, -mondayIndex(dateText));
}

export function monthBounds(dateText) {
  const date = parseDate(dateText);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const last = new Date(Date.UTC(year, month + 1, 0, 12));
  return { start, end: last.toISOString().slice(0, 10), days: last.getUTCDate() };
}

export function periodBounds(dateText, period) {
  if (period === 'day') return { start: dateText, end: dateText, days: 1 };
  if (period === 'week') {
    const start = startOfWeek(dateText);
    return { start, end: addCivilDays(start, 6), days: 7 };
  }
  if (period === 'month') return monthBounds(dateText);
  throw new Error(`Unsupported capacity period: ${period}`);
}

export function enumerateCivilDates(start, end) {
  const dates = [];
  for (let current = start; current <= end; current = addCivilDays(current, 1)) {
    dates.push(current);
  }
  return dates;
}

function normalizedDailyMinutes(commitment) {
  const raw = commitment.daily_minutes ?? commitment.daily_minutes_json;
  if (raw == null || raw === '') return null;

  let values = raw;
  if (typeof raw === 'string') {
    try {
      values = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(values) || values.length !== 7) return null;
  const normalized = values.map((value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(MINUTES_PER_DAY, Math.max(0, Math.round(number)));
  });
  return normalized;
}

export function commitmentApplies(commitment, dateText) {
  if (Number(commitment.active ?? 1) !== 1) return false;
  if (commitment.effective_from && dateText < commitment.effective_from) return false;
  if (commitment.effective_to && dateText > commitment.effective_to) return false;
  const mask = Number(commitment.weekday_mask ?? 127);
  const bit = 1 << mondayIndex(dateText);
  return (mask & bit) !== 0;
}

export function commitmentMinutesForDate(commitment, dateText) {
  if (!commitmentApplies(commitment, dateText)) return 0;
  const perDay = normalizedDailyMinutes(commitment);
  if (perDay) return perDay[mondayIndex(dateText)];
  return Math.min(MINUTES_PER_DAY, Math.max(0, Math.round(Number(commitment.minutes) || 0)));
}

export function calculateCapacity(commitments, dateText, period = 'week') {
  const bounds = periodBounds(dateText, period);
  const dates = enumerateCivilDates(bounds.start, bounds.end);
  const byKind = {};
  let committedMinutes = 0;

  for (const date of dates) {
    for (const commitment of commitments) {
      const minutes = commitmentMinutesForDate(commitment, date);
      if (!minutes) continue;
      committedMinutes += minutes;
      const kind = commitment.kind || 'other';
      byKind[kind] = (byKind[kind] || 0) + minutes;
    }
  }

  const totalMinutes = bounds.days * MINUTES_PER_DAY;
  const flexibleMinutes = Math.max(0, totalMinutes - committedMinutes);
  const overcommittedMinutes = Math.max(0, committedMinutes - totalMinutes);

  return {
    period,
    ...bounds,
    total_minutes: totalMinutes,
    committed_minutes: committedMinutes,
    flexible_minutes: flexibleMinutes,
    overcommitted_minutes: overcommittedMinutes,
    by_kind: byKind
  };
}

export function scaleWeeklyMinutes(weeklyMinutes, days) {
  const minutes = Math.max(0, Number(weeklyMinutes) || 0);
  return Math.round((minutes * Number(days)) / 7);
}

export function calculatePlanLoad(plannedMinutes, flexibleMinutes) {
  const planned = Math.max(0, Number(plannedMinutes) || 0);
  const flexible = Math.max(0, Number(flexibleMinutes) || 0);
  if (flexible === 0) return planned === 0 ? 0 : Infinity;
  return planned / flexible;
}
