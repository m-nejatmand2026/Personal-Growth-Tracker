import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeJournalInput, normalizeJournalTags } from '../worker/domain/journal.js';
const migration=await readFile(new URL('../migrations/0005_journal.sql',import.meta.url),'utf8');
const route=await readFile(new URL('../worker/routes/journal.js',import.meta.url),'utf8');
const workerModule=await readFile(new URL('../worker/modules/journal/module.js',import.meta.url),'utf8');
const frontendModule=await readFile(new URL('../public/js/modules/journal/module.js',import.meta.url),'utf8');
const prompts=await readFile(new URL('../public/js/modules/journal/prompts.js',import.meta.url),'utf8');
const exportRoute=await readFile(new URL('../worker/routes/export.js',import.meta.url),'utf8');

test('Journal supports a one-sentence free entry and deeper reflection modes',()=>{const free=normalizeJournalInput({occurred_on:'2026-08-13',body:'I want to remember this.'});assert.equal(free.error,undefined);assert.equal(free.value.entry_type,'free');for(const entry_type of ['morning','evening','reflection'])assert.equal(normalizeJournalInput({occurred_on:'2026-08-13',body:'A thoughtful response.',entry_type}).error,undefined)});
test('Journal validates body and keeps tags lightweight',()=>{assert.match(normalizeJournalInput({occurred_on:'2026-08-13',body:' '}).error,/Write something/);assert.match(normalizeJournalInput({occurred_on:'2026-08-13',body:'x'.repeat(20001)}).error,/20,000/);assert.deepEqual(normalizeJournalTags(['Work','#work','travel']).value,['Work','travel']);assert.match(normalizeJournalTags(Array.from({length:9},(_,i)=>`tag${i}`)).error,/at most 8/)});
test('Journal persistence is private-reflection data not progress data',()=>{assert.match(migration,/CREATE TABLE IF NOT EXISTS journal_entries/);assert.doesNotMatch(migration,/progress_records|energy_logs|sleep_logs/i);assert.match(workerModule,/id: 'journal'/);assert.match(workerModule,/\/api\/v1\/journal/);assert.match(route,/listJournalRoute/)});
test('Journal easy path has free writing prompts search edit and delete',()=>{assert.match(frontendModule,/Write a journal entry/);assert.match(frontendModule,/Search your writing/);assert.match(frontendModule,/data-journal-edit/);assert.match(frontendModule,/data-journal-delete/);for(const p of ['What matters most today?','What went well today?','What happened?'])assert.match(prompts,new RegExp(p.replace(/[?]/g,'\\?')));assert.match(frontendModule,/No journaling streaks/);assert.doesNotMatch(frontendModule,/streak_count|current_streak|longest_streak/i)});
test('Journal is in user export but not silently connected to Insights or AI',()=>{assert.match(exportRoute,/journal_entries/);assert.doesNotMatch(frontendModule,/features\/insights|ai\/plan|ai-plan/i)});
