PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS activities (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS weekly_targets (
  activity_key TEXT PRIMARY KEY REFERENCES activities(key),
  target_minutes INTEGER NOT NULL,
  minimum_minutes INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_on TEXT NOT NULL,
  activity_key TEXT NOT NULL REFERENCES activities(key),
  minutes INTEGER NOT NULL CHECK(minutes >= 0),
  subtype TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(occurred_on);
CREATE INDEX IF NOT EXISTS idx_sessions_activity_date ON sessions(activity_key, occurred_on);

CREATE TABLE IF NOT EXISTS energy_logs (
  occurred_on TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  row_idx INTEGER NOT NULL,
  col_idx INTEGER NOT NULL,
  energy_score INTEGER NOT NULL,
  valence_score INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS momente_lessons (
  lesson INTEGER PRIMARY KEY CHECK(lesson BETWEEN 1 AND 24),
  planned_start TEXT NOT NULL,
  planned_end TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS roadmap_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  horizon TEXT NOT NULL CHECK(horizon IN ('six_month','compass')),
  title TEXT NOT NULL,
  detail TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO activities(key,name,category) VALUES
 ('sport','Sport / Calisthenics','physical'),
 ('german','German','language'),
 ('guitar','Guitar','music'),
 ('reading','Reading','cognitive');

INSERT OR IGNORE INTO weekly_targets(activity_key,target_minutes,minimum_minutes) VALUES
 ('sport',324,180),
 ('german',216,120),
 ('guitar',135,60),
 ('reading',216,120);

INSERT OR IGNORE INTO settings(key,value) VALUES
 ('sleep_window','{"start":"22:00","end":"06:00","hours":8}'),
 ('plan_start','2026-08-10'),
 ('plan_end','2027-02-09'),
 ('friday_evening_free','true'),
 ('weekend_capacity_hours','10'),
 ('weekend_normal_target_hours','6-8'),
 ('weekend_social_target_hours','2-4');

INSERT OR IGNORE INTO roadmap_items(horizon,title,detail,sort_order) VALUES
 ('six_month','Calisthenics','Permanent mastery track; keep total sport near the weekly target.',10),
 ('six_month','German - Momente B1','Finish all 24 lessons by 31 Dec 2026; review and choose the next language block in Jan/Feb.',20),
 ('six_month','Guitar','Continue the current course consistently; focus on actual playable skill rather than hours alone.',30),
 ('six_month','Reading','Keep a steady reading habit without turning it into an obligation.',40),
 ('six_month','Life balance','Protect sleep, Friday evening, travel, friends, and low-energy days.',50),
 ('compass','Physical mastery','Calisthenics stays permanent. Other sports are chosen one at a time and can change.',10),
 ('compass','Languages','German now. Future languages are options, not commitments.',20),
 ('compass','Music','Guitar now. Piano and drums remain possible future directions.',30),
 ('compass','Exploration','Dance, climbing, racket sports, combat sports and other skills remain editable possibilities.',40);

-- 24 six-day Momente B1 windows, 10 Aug to 31 Dec 2026.
INSERT OR IGNORE INTO momente_lessons(lesson,planned_start,planned_end) VALUES
 (1,'2026-08-10','2026-08-15'),
 (2,'2026-08-16','2026-08-21'),
 (3,'2026-08-22','2026-08-27'),
 (4,'2026-08-28','2026-09-02'),
 (5,'2026-09-03','2026-09-08'),
 (6,'2026-09-09','2026-09-14'),
 (7,'2026-09-15','2026-09-20'),
 (8,'2026-09-21','2026-09-26'),
 (9,'2026-09-27','2026-10-02'),
 (10,'2026-10-03','2026-10-08'),
 (11,'2026-10-09','2026-10-14'),
 (12,'2026-10-15','2026-10-20'),
 (13,'2026-10-21','2026-10-26'),
 (14,'2026-10-27','2026-11-01'),
 (15,'2026-11-02','2026-11-07'),
 (16,'2026-11-08','2026-11-13'),
 (17,'2026-11-14','2026-11-19'),
 (18,'2026-11-20','2026-11-25'),
 (19,'2026-11-26','2026-12-01'),
 (20,'2026-12-02','2026-12-07'),
 (21,'2026-12-08','2026-12-13'),
 (22,'2026-12-14','2026-12-19'),
 (23,'2026-12-20','2026-12-25'),
 (24,'2026-12-26','2026-12-31');
