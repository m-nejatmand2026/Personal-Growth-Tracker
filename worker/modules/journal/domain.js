const ENTRY_TYPES = new Set(['free','morning','evening','reflection']);

function cleanText(value, max, allowEmpty = false) {
  if (value == null) return allowEmpty ? '' : null;
  const text = String(value).trim();
  if (!text && allowEmpty) return '';
  if (!text) return null;
  return text.length <= max ? text : null;
}

export function isJournalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeJournalTags(value) {
  if (value == null || value === '') return { value: [] };
  const raw = Array.isArray(value) ? value : String(value).split(',');
  const seen = new Set();
  const tags = [];
  for (const item of raw) {
    const tag = String(item || '').trim().replace(/^#+/, '');
    if (!tag) continue;
    if (tag.length > 30) return { error: 'Each journal tag must be 30 characters or fewer.' };
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length > 8) return { error: 'Use at most 8 journal tags.' };
  }
  return { value: tags };
}

export function normalizeJournalInput(body = {}) {
  const occurredOn = body.occurred_on;
  const title = body.title == null || body.title === '' ? null : cleanText(body.title, 120);
  const rawBody = body.body == null ? '' : String(body.body).trim();
  const bodyText = rawBody.length <= 20000 ? rawBody : null;
  const entryType = body.entry_type || 'free';
  const tags = normalizeJournalTags(body.tags);

  if (!isJournalDate(occurredOn)) return { error: 'Choose a valid journal date.' };
  if (body.title && !title) return { error: 'Journal title must be 120 characters or fewer.' };
  if (!rawBody) return { error: 'Write something before saving your journal entry.' };
  if (!bodyText) return { error: 'Journal entry must be 20,000 characters or fewer.' };
  if (!ENTRY_TYPES.has(entryType)) return { error: 'Invalid journal entry type.' };
  if (tags.error) return tags;

  return {
    value: {
      occurred_on: occurredOn,
      title,
      body: bodyText,
      entry_type: entryType,
      tags: tags.value
    }
  };
}

export function normalizeJournalPatch(body = {}, existing = {}) {
  return normalizeJournalInput({
    occurred_on: body.occurred_on ?? existing.occurred_on,
    title: body.title !== undefined ? body.title : existing.title,
    body: body.body !== undefined ? body.body : existing.body,
    entry_type: body.entry_type ?? existing.entry_type,
    tags: body.tags !== undefined
      ? body.tags
      : (() => {
          try { return JSON.parse(existing.tags_json || '[]'); } catch { return []; }
        })()
  });
}
