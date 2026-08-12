PRAGMA foreign_keys = ON;

-- Capacity schedule hardening.
-- Additive only: preserve all existing commitment rows and historical data.
-- series_id groups effective-dated versions of one logical commitment.
-- daily_minutes_json optionally stores Monday..Sunday minute overrides.

ALTER TABLE capacity_commitments ADD COLUMN series_id TEXT;
ALTER TABLE capacity_commitments ADD COLUMN daily_minutes_json TEXT;

UPDATE capacity_commitments
SET series_id = 'capacity-' || id
WHERE series_id IS NULL OR series_id = '';

CREATE INDEX IF NOT EXISTS idx_capacity_series_dates
ON capacity_commitments(profile_id, series_id, effective_from, effective_to);
