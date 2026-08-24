import { bad, json, readJsonBody } from '../../core/http.js';
import { resolveProfileId } from '../../core/profile.js';
import { isJournalDate, normalizeJournalInput, normalizeJournalPatch } from './domain.js';
import {
  archiveJournalEntry,
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntry,
  listJournalEntries,
  restoreJournalEntry,
  updateJournalEntry
} from './data.js';

function entryId(url) {
  const match = url.pathname.match(/\/api\/v1\/journal\/(\d+)(?:\/(?:restore|permanent))?$/);
  const id = Number(match?.[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function listJournalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
  const limit = Number(url.searchParams.get('limit') || 50);
  const includeArchived = url.searchParams.get('include_archived') === '1';
  const archivedOnly = url.searchParams.get('archived_only') === '1';
  if (includeArchived && archivedOnly) return bad('Choose either include_archived or archived_only, not both.');
  if (from && !isJournalDate(from)) return bad('Invalid journal from date.');
  if (to && !isJournalDate(to)) return bad('Invalid journal to date.');
  if (from && to && from > to) return bad('Journal from date cannot be after to date.');
  return json({ items: await listJournalEntries(env.DB, profileId, { from: from || null, to: to || null, q: q || null, limit, includeArchived, archivedOnly }) });
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
  if (existing.archived_at) return bad('Restore this journal entry before editing it.', 409);
  const body = await readJsonBody(request);
  const normalized = normalizeJournalPatch(body, existing);
  if (normalized.error) return bad(normalized.error);
  return json({ item: await updateJournalEntry(env.DB, profileId, id, normalized.value) });
}

export async function archiveJournalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = entryId(url);
  if (!id) return bad('Invalid journal entry id.');
  const existing = await getJournalEntry(env.DB, profileId, id);
  if (!existing) return bad('Journal entry not found.', 404);
  return json({ item: await archiveJournalEntry(env.DB, profileId, id) });
}

export async function restoreJournalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = entryId(url);
  if (!id) return bad('Invalid journal entry id.');
  const existing = await getJournalEntry(env.DB, profileId, id);
  if (!existing) return bad('Journal entry not found.', 404);
  return json({ item: await restoreJournalEntry(env.DB, profileId, id) });
}

export async function deleteJournalRoute({ request, url, env }) {
  const profileId = resolveProfileId(request);
  const id = entryId(url);
  if (!id) return bad('Invalid journal entry id.');
  const existing = await getJournalEntry(env.DB, profileId, id);
  if (!existing) return bad('Journal entry not found.', 404);
  if (!existing.archived_at) return bad('Archive this journal entry before permanently removing it.', 409);
  const result = await deleteJournalEntry(env.DB, profileId, id);
  return json({ removed: Number(result.meta?.changes || 0) > 0 });
}
