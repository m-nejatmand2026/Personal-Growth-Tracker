-- Module-Owner: journal
--
-- Add reversible archive state for private Journal entries.
-- Existing entries remain active because archived_at defaults to NULL.
-- Permanent deletion remains a separate explicit lifecycle action.

PRAGMA foreign_keys = ON;

ALTER TABLE journal_entries ADD COLUMN archived_at TEXT;

CREATE INDEX IF NOT EXISTS idx_journal_profile_archive_date
ON journal_entries(profile_id, archived_at, occurred_on DESC, id DESC);
