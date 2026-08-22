const MINUTES_PER_DAY = 24 * 60;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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
  for (let current = start; current <= end; current = addCivilDays(current, 1)) dates.push(current);
  return dates;
}

export function timeToMinutes(value) {
  if (!TIME_RE.test(String(value || ''))) return null;
  const [hours, minutes] = String(value).split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value) {
  const minutes = Math.min(MINUTES_PER_DAY, Math.max(0, Math.round(Number(value) || 0)));
  if (minutes === MINUTES_PER_DAY) return '24:00';
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function normalizedDailyMinutes(commitment) {
  const raw = commitment.daily_minutes ?? commitment.daily_minutes_json;
  if (raw == null || raw === '') return null;
  let values = raw;
  if (typeof raw === 'string') {
    try { values = JSON.parse(raw); } catch { return null; }
  }
  if (!Array.isArray(values) || values.length !== 7) return null;
  return values.map((value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(MINUTES_PER_DAY, Math.max(0, Math.round(number)));
  });
}

function hasClockBlock(commitment) {
  return timeToMinutes(commitment?.start_time) != null && timeToMinutes(commitment?.end_time) != null;
}

function logicalClockMinutes(commitment) {
  const start = timeToMinutes(commitment?.start_time);
  const end = timeToMinutes(commitment?.end_time);
  if (start == null || end == null || start === end) return null;
  return end > start ? end - start : MINUTES_PER_DAY - start + end;
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
  const clockMinutes = logicalClockMinutes(commitment);
  if (clockMinutes != null) return clockMinutes;
  const perDay = normalizedDailyMinutes(commitment);
  if (perDay) return perDay[mondayIndex(dateText)];
  return Math.min(MINUTES_PER_DAY, Math.max(0, Math.round(Number(commitment.minutes) || 0)));
}

export function commitmentClockSegmentsForDate(commitment, dateText) {
  if (!hasClockBlock(commitment)) return [];
  const start = timeToMinutes(commitment.start_time);
  const end = timeToMinutes(commitment.end_time);
  if (start === end) return [];
  const flexibility = ['fixed', 'preferred', 'flexible'].includes(commitment.flexibility)
    ? commitment.flexibility
    : (Number(commitment.protected ?? 1) === 1 ? 'fixed' : 'flexible');
  const base = {
    id: commitment.id ?? null,
    series_id: commitment.series_id ?? null,
    name: commitment.name || 'Commitment',
    kind: commitment.kind || 'other',
    flexibility,
    protected: Number(commitment.protected ?? 1) === 1
  };
  const segments = [];
  if (commitmentApplies(commitment, dateText)) {
    if (end > start) segments.push({ ...base, start_minute: start, end_minute: end });
    else segments.push({ ...base, start_minute: start, end_minute: MINUTES_PER_DAY });
  }
  if (end < start) {
    const previous = addCivilDays(dateText, -1);
    if (commitmentApplies(commitment, previous)) segments.push({ ...base, start_minute: 0, end_minute: end });
  }
  return segments.map((segment) => ({
    ...segment,
    start_time: minutesToTime(segment.start_minute),
    end_time: minutesToTime(segment.end_minute)
  }));
}

function mergeIntervals(intervals) {
  const sorted = intervals
    .map(({ start_minute, end_minute }) => ({ start_minute, end_minute }))
    .filter((item) => item.end_minute > item.start_minute)
    .sort((a, b) => a.start_minute - b.start_minute || a.end_minute - b.end_minute);
  const merged = [];
  for (const item of sorted) {
    const last = merged.at(-1);
    if (!last || item.start_minute > last.end_minute) merged.push({ ...item });
    else last.end_minute = Math.max(last.end_minute, item.end_minute);
  }
  return merged;
}

function intervalMinutes(intervals) {
  return intervals.reduce((sum, item) => sum + Math.max(0, item.end_minute - item.start_minute), 0);
}

function freeWindows(occupied) {
  const windows = [];
  let cursor = 0;
  for (const block of occupied) {
    if (block.start_minute > cursor) windows.push({ start_minute: cursor, end_minute: block.start_minute });
    cursor = Math.max(cursor, block.end_minute);
  }
  if (cursor < MINUTES_PER_DAY) windows.push({ start_minute: cursor, end_minute: MINUTES_PER_DAY });
  return windows.map((window) => ({
    ...window,
    start_time: minutesToTime(window.start_minute),
    end_time: minutesToTime(window.end_minute),
    minutes: window.end_minute - window.start_minute
  }));
}

export function timeMapForDate(commitments, dateText) {
  const blocks = [];
  let unplacedMinutes = 0;
  for (const commitment of commitments) {
    const segments = commitmentClockSegmentsForDate(commitment, dateText);
    if (segments.length) blocks.push(...segments);
    else unplacedMinutes += commitmentMinutesForDate(commitment, dateText);
  }
  const occupied = mergeIntervals(blocks);
  return {
    date: dateText,
    position_known: unplacedMinutes === 0,
    unplaced_minutes: unplacedMinutes,
    occupied_minutes: intervalMinutes(occupied),
    blocks: blocks.sort((a, b) => a.start_minute - b.start_minute || a.end_minute - b.end_minute),
    free_windows: freeWindows(occupied)
  };
}

function dayCapacity(commitments, dateText) {
  const map = timeMapForDate(commitments, dateText);
  const byKind = {};
  for (const commitment of commitments) {
    const minutes = commitmentMinutesForDate(commitment, dateText);
    if (!minutes) continue;
    const kind = commitment.kind || 'other';
    byKind[kind] = (byKind[kind] || 0) + minutes;
  }
  const committed = map.occupied_minutes + map.unplaced_minutes;
  return { committed, byKind, map };
}

export function calculateCapacity(commitments, dateText, period = 'week') {
  const bounds = periodBounds(dateText, period);
  const dates = enumerateCivilDates(bounds.start, bounds.end);
  const byKind = {};
  let committedMinutes = 0;
  let dayMap = null;
  for (const date of dates) {
    const current = dayCapacity(commitments, date);
    committedMinutes += current.committed;
    for (const [kind, minutes] of Object.entries(current.byKind)) byKind[kind] = (byKind[kind] || 0) + minutes;
    if (period === 'day') dayMap = current.map;
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
    by_kind: byKind,
    ...(dayMap ? { time_map: dayMap } : {})
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
