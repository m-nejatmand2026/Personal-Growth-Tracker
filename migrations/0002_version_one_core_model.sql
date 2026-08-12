PRAGMA foreign_keys = ON;

-- Version 1 beta platform foundation.
-- Additive only: legacy beta tables remain untouched until the cutover migration.

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Berlin',
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO profiles(id, display_name, timezone, locale)
VALUES ('default', 'Meghdad', 'Europe/Berlin', 'en');

CREATE TABLE IF NOT EXISTS area_templates (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  default_color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO area_templates(key,name,icon,default_color,sort_order) VALUES
 ('health_fitness','Health & Fitness','heart-pulse','#0F766E',10),
 ('learning','Learning','book-open','#D97706',20),
 ('languages','Languages','languages','#2563EB',30),
 ('career','Career','briefcase','#475569',40),
 ('finance','Finance','wallet','#15803D',50),
 ('relationships','Relationships','heart','#DB2777',60),
 ('social','Social','users','#0891B2',70),
 ('creativity','Creativity','palette','#9333EA',80),
 ('music','Music','music','#7C3AED',90),
 ('reading','Reading','library','#B45309',100),
 ('mindfulness','Mindfulness','sparkles','#0D9488',110),
 ('personal_projects','Personal Projects','blocks','#4F46E5',120),
 ('travel','Travel','plane','#0284C7',130),
 ('other','Other','circle-dot','#64748B',999);

CREATE TABLE IF NOT EXISTS areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_key TEXT REFERENCES area_templates(key),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_areas_profile_active ON areas(profile_id, active, sort_order);

INSERT INTO areas(profile_id,template_key,name,icon,color,sort_order)
SELECT 'default','health_fitness','Health & Fitness','heart-pulse','#0F766E',10
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE profile_id='default' AND name='Health & Fitness');
INSERT INTO areas(profile_id,template_key,name,icon,color,sort_order)
SELECT 'default','languages','Languages','languages','#2563EB',20
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE profile_id='default' AND name='Languages');
INSERT INTO areas(profile_id,template_key,name,icon,color,sort_order)
SELECT 'default','music','Music','music','#7C3AED',30
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE profile_id='default' AND name='Music');
INSERT INTO areas(profile_id,template_key,name,icon,color,sort_order)
SELECT 'default','reading','Reading','library','#B45309',40
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE profile_id='default' AND name='Reading');

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  area_id INTEGER REFERENCES areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  why_text TEXT,
  measurement_type TEXT NOT NULL DEFAULT 'time'
    CHECK(measurement_type IN ('time','count','milestone','boolean','number')),
  target_value REAL,
  minimum_value REAL,
  unit TEXT,
  target_period TEXT NOT NULL DEFAULT 'weekly'
    CHECK(target_period IN ('daily','weekly','monthly','yearly','custom','none')),
  start_date TEXT,
  target_date TEXT,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK(priority IN ('high','medium','low')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active','paused','completed','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_goals_profile_status ON goals(profile_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_goals_area ON goals(area_id, status, sort_order);

INSERT INTO goals(profile_id,area_id,name,description,measurement_type,target_period,start_date,priority,sort_order)
SELECT 'default',a.id,'Advanced calisthenics','Permanent physical mastery track.','milestone','none','2026-08-10','high',10
FROM areas a
WHERE a.profile_id='default' AND a.name='Health & Fitness'
  AND NOT EXISTS (SELECT 1 FROM goals WHERE profile_id='default' AND name='Advanced calisthenics');

INSERT INTO goals(profile_id,area_id,name,description,measurement_type,target_value,unit,target_period,start_date,target_date,priority,sort_order)
SELECT 'default',a.id,'Finish German B1','Complete all 24 Momente B1 lessons.','milestone',24,'lessons','none','2026-08-10','2026-12-31','high',20
FROM areas a
WHERE a.profile_id='default' AND a.name='Languages'
  AND NOT EXISTS (SELECT 1 FROM goals WHERE profile_id='default' AND name='Finish German B1');

INSERT INTO goals(profile_id,area_id,name,description,measurement_type,target_period,start_date,priority,sort_order)
SELECT 'default',a.id,'Improve guitar','Build consistent playable guitar skill.','time','weekly','2026-08-10','medium',30
FROM areas a
WHERE a.profile_id='default' AND a.name='Music'
  AND NOT EXISTS (SELECT 1 FROM goals WHERE profile_id='default' AND name='Improve guitar');

INSERT INTO goals(profile_id,area_id,name,description,measurement_type,target_period,start_date,priority,sort_order)
SELECT 'default',a.id,'Reading habit','Maintain steady reading without streak pressure.','time','weekly','2026-08-10','medium',40
FROM areas a
WHERE a.profile_id='default' AND a.name='Reading'
  AND NOT EXISTS (SELECT 1 FROM goals WHERE profile_id='default' AND name='Reading habit');

CREATE TABLE IF NOT EXISTS goal_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  key TEXT,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, key)
);
CREATE INDEX IF NOT EXISTS idx_goal_activities_goal ON goal_activities(goal_id, active, sort_order);

INSERT INTO goal_activities(profile_id,goal_id,key,name,sort_order)
SELECT 'default',g.id,'calisthenics','Calisthenics',10 FROM goals g
WHERE g.profile_id='default' AND g.name='Advanced calisthenics'
  AND NOT EXISTS (SELECT 1 FROM goal_activities WHERE profile_id='default' AND key='calisthenics');
INSERT INTO goal_activities(profile_id,goal_id,key,name,sort_order)
SELECT 'default',g.id,'german','German',10 FROM goals g
WHERE g.profile_id='default' AND g.name='Finish German B1'
  AND NOT EXISTS (SELECT 1 FROM goal_activities WHERE profile_id='default' AND key='german');
INSERT INTO goal_activities(profile_id,goal_id,key,name,sort_order)
SELECT 'default',g.id,'guitar','Guitar',10 FROM goals g
WHERE g.profile_id='default' AND g.name='Improve guitar'
  AND NOT EXISTS (SELECT 1 FROM goal_activities WHERE profile_id='default' AND key='guitar');
INSERT INTO goal_activities(profile_id,goal_id,key,name,sort_order)
SELECT 'default',g.id,'reading','Reading',10 FROM goals g
WHERE g.profile_id='default' AND g.name='Reading habit'
  AND NOT EXISTS (SELECT 1 FROM goal_activities WHERE profile_id='default' AND key='reading');

CREATE TABLE IF NOT EXISTS plan_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, effective_from)
);
CREATE INDEX IF NOT EXISTS idx_plan_versions_profile_dates ON plan_versions(profile_id, effective_from, effective_to);

INSERT INTO plan_versions(profile_id,label,effective_from,note)
SELECT 'default','Initial beta plan','2026-08-10','Imported from the original personal-growth beta targets.'
WHERE NOT EXISTS (SELECT 1 FROM plan_versions WHERE profile_id='default' AND effective_from='2026-08-10');

CREATE TABLE IF NOT EXISTS goal_plan_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_version_id INTEGER NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  time_target_minutes INTEGER,
  time_minimum_minutes INTEGER,
  quantity_target REAL,
  quantity_minimum REAL,
  period TEXT NOT NULL DEFAULT 'weekly'
    CHECK(period IN ('daily','weekly','monthly','yearly','custom','none')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_version_id, goal_id)
);

INSERT OR IGNORE INTO goal_plan_values(plan_version_id,goal_id,time_target_minutes,time_minimum_minutes,period)
SELECT p.id,g.id,324,180,'weekly' FROM plan_versions p JOIN goals g ON g.profile_id=p.profile_id
WHERE p.profile_id='default' AND p.effective_from='2026-08-10' AND g.name='Advanced calisthenics';
INSERT OR IGNORE INTO goal_plan_values(plan_version_id,goal_id,time_target_minutes,time_minimum_minutes,period)
SELECT p.id,g.id,216,120,'weekly' FROM plan_versions p JOIN goals g ON g.profile_id=p.profile_id
WHERE p.profile_id='default' AND p.effective_from='2026-08-10' AND g.name='Finish German B1';
INSERT OR IGNORE INTO goal_plan_values(plan_version_id,goal_id,time_target_minutes,time_minimum_minutes,period)
SELECT p.id,g.id,135,60,'weekly' FROM plan_versions p JOIN goals g ON g.profile_id=p.profile_id
WHERE p.profile_id='default' AND p.effective_from='2026-08-10' AND g.name='Improve guitar';
INSERT OR IGNORE INTO goal_plan_values(plan_version_id,goal_id,time_target_minutes,time_minimum_minutes,period)
SELECT p.id,g.id,216,120,'weekly' FROM plan_versions p JOIN goals g ON g.profile_id=p.profile_id
WHERE p.profile_id='default' AND p.effective_from='2026-08-10' AND g.name='Reading habit';

-- Monday is bit 0, Sunday is bit 6. 127 = every day, 31 = Monday-Friday.
CREATE TABLE IF NOT EXISTS capacity_commitments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('sleep','work','commute','life','family','recovery','exercise','other')),
  name TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK(minutes >= 0 AND minutes <= 1440),
  weekday_mask INTEGER NOT NULL DEFAULT 127 CHECK(weekday_mask BETWEEN 0 AND 127),
  effective_from TEXT,
  effective_to TEXT,
  protected INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_capacity_profile_active ON capacity_commitments(profile_id, active, sort_order);

INSERT INTO capacity_commitments(profile_id,kind,name,minutes,weekday_mask,sort_order)
SELECT 'default','sleep','Sleep',480,127,10
WHERE NOT EXISTS (SELECT 1 FROM capacity_commitments WHERE profile_id='default' AND kind='sleep' AND name='Sleep');
INSERT INTO capacity_commitments(profile_id,kind,name,minutes,weekday_mask,sort_order)
SELECT 'default','work','Work',540,31,20
WHERE NOT EXISTS (SELECT 1 FROM capacity_commitments WHERE profile_id='default' AND kind='work' AND name='Work');
INSERT INTO capacity_commitments(profile_id,kind,name,minutes,weekday_mask,sort_order)
SELECT 'default','commute','Commute',60,31,30
WHERE NOT EXISTS (SELECT 1 FROM capacity_commitments WHERE profile_id='default' AND kind='commute' AND name='Commute');
INSERT INTO capacity_commitments(profile_id,kind,name,minutes,weekday_mask,sort_order)
SELECT 'default','life','Food / shower / life',120,127,40
WHERE NOT EXISTS (SELECT 1 FROM capacity_commitments WHERE profile_id='default' AND kind='life' AND name='Food / shower / life');
INSERT INTO capacity_commitments(profile_id,kind,name,minutes,weekday_mask,sort_order)
SELECT 'default','recovery','Quiet / alone time',60,127,50
WHERE NOT EXISTS (SELECT 1 FROM capacity_commitments WHERE profile_id='default' AND kind='recovery' AND name='Quiet / alone time');
INSERT INTO capacity_commitments(profile_id,kind,name,minutes,weekday_mask,sort_order)
SELECT 'default','recovery','Nap',30,127,60
WHERE NOT EXISTS (SELECT 1 FROM capacity_commitments WHERE profile_id='default' AND kind='recovery' AND name='Nap');

CREATE TABLE IF NOT EXISTS progress_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
  activity_id INTEGER REFERENCES goal_activities(id) ON DELETE SET NULL,
  occurred_on TEXT NOT NULL,
  started_at TEXT,
  minutes INTEGER CHECK(minutes IS NULL OR (minutes >= 0 AND minutes <= 1440)),
  quantity REAL,
  boolean_value INTEGER CHECK(boolean_value IS NULL OR boolean_value IN (0,1)),
  subtype TEXT,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_progress_profile_date ON progress_records(profile_id, occurred_on);
CREATE INDEX IF NOT EXISTS idx_progress_goal_date ON progress_records(goal_id, occurred_on);
CREATE INDEX IF NOT EXISTS idx_progress_activity_date ON progress_records(activity_id, occurred_on);

CREATE TABLE IF NOT EXISTS sleep_logs_v1 (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  occurred_on TEXT NOT NULL,
  bedtime TEXT,
  wake_time TEXT,
  minutes INTEGER NOT NULL CHECK(minutes >= 0 AND minutes <= 1440),
  quality INTEGER CHECK(quality IS NULL OR quality BETWEEN 1 AND 5),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(profile_id, occurred_on)
);

CREATE TABLE IF NOT EXISTS day_context_logs_v1 (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  occurred_on TEXT NOT NULL,
  context_key TEXT NOT NULL CHECK(context_key IN ('normal','social','travel','low_energy','sick_recovery')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(profile_id, occurred_on)
);
