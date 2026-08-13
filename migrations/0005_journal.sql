PRAGMA foreign_keys = ON;

-- Journal is a private-reflection module. Entries are deliberately separate
-- from Progress, Insights and AI data paths. Additive only.

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  occurred_on TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'free'
    CHECK(entry_type IN ('free','morning','evening','reflection')),
  tags_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_profile_date
ON journal_entries(profile_id, occurred_on DESC, id DESC);
