PRAGMA foreign_keys = ON;

-- Growth Compass Preview 2 account foundation.
-- Better Auth owns user/session/account/verification. Growth Compass owns the
-- explicit mapping from an authenticated user to exactly one private profile.

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY NOT NULL,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_auth_session_user ON "session"(userId);
CREATE INDEX IF NOT EXISTS idx_auth_session_expiry ON "session"(expiresAt);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  UNIQUE(providerId, accountId)
);
CREATE INDEX IF NOT EXISTS idx_auth_account_user ON "account"(userId);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
);
CREATE INDEX IF NOT EXISTS idx_auth_verification_identifier ON "verification"(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_verification_expiry ON "verification"(expiresAt);

CREATE TABLE IF NOT EXISTS auth_profile_memberships (
  auth_user_id TEXT PRIMARY KEY NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'tester' CHECK(role IN ('owner','tester')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auth_membership_profile ON auth_profile_memberships(profile_id);

CREATE TABLE IF NOT EXISTS auth_invites (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  invited_by_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','revoked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at TEXT,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_auth_invites_status ON auth_invites(status, created_at);

CREATE TABLE IF NOT EXISTS auth_security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_auth_security_user_time ON auth_security_events(auth_user_id, created_at DESC);
