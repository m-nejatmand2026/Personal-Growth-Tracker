PRAGMA foreign_keys = ON;

-- Daily Plan items are short-horizon intentions for a specific civil date.
-- They are not progress facts and do not roll forward automatically.
-- Additive only; no existing data is rewritten.

CREATE TABLE IF NOT EXISTS daily_plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  planned_for TEXT NOT NULL,
  title TEXT NOT NULL,
  activity_key TEXT,
  activity_label TEXT,
  subtype TEXT,
  planned_minutes INTEGER
    CHECK(planned_minutes IS NULL OR planned_minutes BETWEEN 1 AND 1440),
  planned_time TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK(status IN ('planned','in_progress','completed','dismissed')),
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK(source IN ('manual','logger')),
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  dismissed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_daily_plan_profile_date_status
ON daily_plan_items(profile_id, planned_for, status, sort_order, created_at, id);
