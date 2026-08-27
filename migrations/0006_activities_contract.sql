-- Growth Compass Version 1 Activities contract.
-- Module-Owner: activities
-- Compatibility-Tables: activities,daily_plan_items
--
-- goal_activities is the canonical Version 1 Activity model.
--
-- The legacy activities table remains temporarily because the current
-- /api/session factual Progress path has a foreign key to activities(key).
-- New/updated Version 1 Activities are mirrored by the Activities data
-- adapter until Logger/Progress cut over to progress_records.
--
-- Remove this compatibility dependency as part of the canonical Progress
-- persistence migration. Do not treat legacy activities as product ontology.

CREATE INDEX IF NOT EXISTS idx_goal_activities_profile_active
ON goal_activities(profile_id, active, sort_order, name);

-- One-time Beta identity normalization.
--
-- The original Beta Logger, sessions and weekly targets use the key `sport`
-- for Sport / Calisthenics, while the first Version 1 seed used
-- `calisthenics`. Keeping both identities would split historical and future
-- progress for the same Activity.
--
-- Preserve the established factual-history key. This is migration-only
-- compatibility logic, not product ontology.
UPDATE goal_activities
SET key='sport',
    updated_at=CURRENT_TIMESTAMP
WHERE profile_id='default'
  AND key='calisthenics'
  AND name='Calisthenics'
  AND NOT EXISTS (
    SELECT 1
    FROM goal_activities
    WHERE profile_id='default'
      AND key='sport'
  );

-- Daily Plan stores the compatibility Activity key as text rather than as a
-- foreign key, so normalize any Beta item that may already reference it.
UPDATE daily_plan_items
SET activity_key='sport'
WHERE profile_id='default'
  AND activity_key='calisthenics';

INSERT OR IGNORE INTO activities(key,name,category,active)
SELECT
  key,
  name,
  'v1-compat',
  active
FROM goal_activities
WHERE key IS NOT NULL;
