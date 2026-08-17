import { bad, json, readJsonBody } from '../../core/http.js';
import { resolveProfileId } from '../../core/profile.js';
import { isJournalDate, normalizeJournalInput, normalizeJournalPatch } from './domain.js';
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntry,
  listJournalEntries,
  updateJournalEntry
} from './data.js';

function entryId(url) {
  const id = Number(url.pathname.split('/').pop());
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function listJournalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
  const limit = Number(url.searchParams.get('limit') || 50);
  if (from && !isJournalDate(from)) return bad('Invalid journal from date.');
  if (to && !isJournalDate(to)) return bad('Invalid journal to date.');
  if (from && to && from > to) return bad('Journal from date cannot be after to date.');
  return json({ items: await listJournalEntries(env.DB, profileId, { from: from || null, to: to || null, q: q || null, limit }) });
}

export async function createJournalRoute({ request, env }) {
  const profileId = resolveProfileId(request);
  const body = await readJsonBody(request);
  const normalized = normalizeJournalInput(body);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await createJournalEntry(env.DB, profileId, normalized.value) }, 201);
}

export async function updateJournalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = entryId(url);
  if (!id) return bad('Invalid journal entry id.');
  const existing = await getJournalEntry(env.DB, profileId, id);
  if (!existing) return bad('Journal entry not found.', 404);
  const body = await readJsonBody(request);
  const normalized = normalizeJournalPatch(body, existing);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await updateJournalEntry(env.DB, profileId, id, normalized.value) });
}

export async function deleteJournalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = entryId(url);
  if (!id) return bad('Invalid journal entry id.');
  const existing = await getJournalEntry(env.DB, profileId, id);
  if (!existing) return bad('Journal entry not found.', 404);
  await deleteJournalEntry(env.DB, profileId, id);
  return json({ ok: true });
}
