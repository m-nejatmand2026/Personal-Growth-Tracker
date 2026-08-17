-- Module-Owner: wellbeing
-- Compatibility-Tables: energy_logs
--
-- Version 1 Wellbeing observations are profile-scoped. The original Beta
-- energy_logs table is retained untouched as historical compatibility data.

CREATE TABLE IF NOT EXISTS energy_logs_v1 (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  occurred_on TEXT NOT NULL,
  label TEXT NOT NULL,
  row_idx INTEGER NOT NULL CHECK(row_idx BETWEEN 0 AND 5),
  col_idx INTEGER NOT NULL CHECK(col_idx BETWEEN 0 AND 5),
  energy_score INTEGER NOT NULL CHECK(energy_score BETWEEN -3 AND 3),
  valence_score INTEGER NOT NULL CHECK(valence_score BETWEEN -3 AND 3),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(profile_id, occurred_on)
);

INSERT OR IGNORE INTO energy_logs_v1(
  profile_id,
  occurred_on,
  label,
  row_idx,
  col_idx,
  energy_score,
  valence_score,
  note,
  created_at,
  updated_at
)
SELECT
  'default',
  occurred_on,
  label,
  row_idx,
  col_idx,
  energy_score,
  valence_score,
  note,
  created_at,
  updated_at
FROM energy_logs;
