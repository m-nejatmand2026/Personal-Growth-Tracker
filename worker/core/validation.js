export function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function requiredText(value, maxLength = 120) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maxLength) return null;
  return text;
}

export function optionalText(value, maxLength = 500) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length <= maxLength ? text : null;
}

export function integerInRange(value, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}
