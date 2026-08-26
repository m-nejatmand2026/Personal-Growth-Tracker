import { api } from '../core/api.js';

export const journalCapability = Object.freeze({
  list({ q = '', from = '', to = '', limit = 80, includeArchived = false, archivedOnly = false } = {}, options = {}) {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    query.set('limit', String(limit));
    if (includeArchived) query.set('include_archived', '1');
    if (archivedOnly) query.set('archived_only', '1');
    return api.get(`/v1/journal?${query}`, options);
  },
  create(input) { return api.post('/v1/journal', input); },
  update(id, input) { return api.put(`/v1/journal/${id}`, input); },
  archive(id) { return api.delete(`/v1/journal/${id}`); },
  restore(id) { return api.post(`/v1/journal/${id}/restore`, {}); },
  remove(id, options = {}) { return api.delete(`/v1/journal/${id}/permanent`, options); }
});
