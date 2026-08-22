-- Module-Owner: capacity
--
-- Time-aware capacity for Preview 2.
-- Existing duration-only commitments remain valid and unchanged.
-- start_time/end_time are local civil clock times (HH:MM). An end time that
-- is earlier than the start time represents an overnight block.
-- flexibility controls whether the planner should treat a block as fixed,
-- preferred, or freely movable when proposing alternative times.

PRAGMA foreign_keys = ON;

ALTER TABLE capacity_commitments ADD COLUMN start_time TEXT;
ALTER TABLE capacity_commitments ADD COLUMN end_time TEXT;
ALTER TABLE capacity_commitments ADD COLUMN flexibility TEXT NOT NULL DEFAULT 'fixed';

UPDATE capacity_commitments
SET flexibility = CASE WHEN protected = 1 THEN 'fixed' ELSE 'flexible' END
WHERE flexibility IS NULL OR flexibility = '';

CREATE INDEX IF NOT EXISTS idx_capacity_profile_clock
ON capacity_commitments(profile_id, active, weekday_mask, start_time, end_time);
