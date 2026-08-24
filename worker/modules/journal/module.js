import {
  archiveJournalRoute,
  createJournalRoute,
  deleteJournalRoute,
  listJournalRoute,
  restoreJournalRoute,
  updateJournalRoute
} from './routes.js';

export const journalModule = Object.freeze({
  id: 'journal',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  ownsTables: Object.freeze(['journal_entries']),
  compatibilityTables: Object.freeze([]),
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/journal', handler: listJournalRoute },
    { method: 'POST', pattern: '/api/v1/journal', handler: createJournalRoute },
    { method: 'POST', pattern: /^\/api\/v1\/journal\/\d+\/restore$/, handler: restoreJournalRoute },
    { method: 'PUT', pattern: /^\/api\/v1\/journal\/\d+$/, handler: updateJournalRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/journal\/\d+$/, handler: archiveJournalRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/journal\/\d+\/permanent$/, handler: deleteJournalRoute }
  ]),
  publishes: Object.freeze(['journal.entry-created','journal.entry-updated','journal.entry-archived','journal.entry-restored','journal.entry-deleted']),
  subscribes: Object.freeze([])
});
