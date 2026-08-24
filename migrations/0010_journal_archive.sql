-- Module-Owner: journal
--
-- Reversible Journal lifecycle for Preview 2.
-- Existing entries stay active. Archive is a private Journal state only and
-- must not create, mutate, or infer Progress, Insights, Wellbeing, or AI data.

PRAGMA foreign_keys = ON;

ALTER TABLE journal_entries ADD COLUMN archived_at TEXT;

CREATE INDEX IF NOT EXISTS idx_journal_profile_archive_date
ON journal_entries(profile_id, archived_at, occurred_on DESC, id DESC);
