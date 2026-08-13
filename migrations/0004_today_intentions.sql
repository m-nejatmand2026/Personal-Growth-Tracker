PRAGMA foreign_keys = ON;

-- Today intentions are plans for the selected day, not progress facts.
-- They let a user plan something, mark it in progress, then confirm actual
-- progress separately when finished. Additive only.

CREATE TABLE IF NOT EXISTS today_intentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  occurred_on TEXT NOT NULL,
  activity_key TEXT NOT NULL,
  subtype TEXT,
  planned_minutes INTEGER NOT NULL CHECK(planned_minutes BETWEEN 1 AND 1440),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK(status IN ('planned','in_progress','completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_today_intentions_profile_date_status
ON today_intentions(profile_id, occurred_on, status, created_at);
