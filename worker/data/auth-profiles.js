import { HttpError } from '../core/http.js';

export function normalizeAuthEmail(value = '') {
  return String(value).trim().toLowerCase();
}

export async function getMembershipByUserId(DB, authUserId) {
  return DB.prepare(`
    SELECT auth_user_id,profile_id,role,created_at
    FROM auth_profile_memberships
    WHERE auth_user_id=?
  `).bind(authUserId).first();
}

export async function getInvite(DB, email) {
  return DB.prepare(`
    SELECT email,invited_by_user_id,status,created_at,accepted_at,revoked_at
    FROM auth_invites
    WHERE email=? COLLATE NOCASE
  `).bind(normalizeAuthEmail(email)).first();
}

export async function isSignupAllowed(DB, env, email) {
  const normalized = normalizeAuthEmail(email);
  const owner = normalizeAuthEmail(env.GC_OWNER_EMAIL || '');
  if (owner && normalized === owner) return true;
  const invite = await getInvite(DB, normalized);
  return Boolean(invite && invite.status === 'pending');
}

function displayNameFor(user) {
  const name = String(user?.name || '').trim();
  if (name) return name.slice(0, 120);
  const email = normalizeAuthEmail(user?.email || '');
  return (email.split('@')[0] || 'Growth Compass user').slice(0, 120);
}

export async function ensureUserProfile(DB, env, user) {
  if (!user?.id || !user?.email) throw new HttpError('Authenticated user is incomplete.', 401);

  const existing = await getMembershipByUserId(DB, user.id);
  if (existing) return existing;

  const email = normalizeAuthEmail(user.email);
  const ownerEmail = normalizeAuthEmail(env.GC_OWNER_EMAIL || '');
  const isOwner = Boolean(ownerEmail && email === ownerEmail);

  if (!isOwner) {
    const invite = await getInvite(DB, email);
    if (!invite || !['pending', 'accepted'].includes(invite.status)) {
      throw new HttpError('This Growth Compass preview is invite-only.', 403);
    }
    if (invite.status === 'revoked') throw new HttpError('This invitation has been revoked.', 403);
  }

  const profileId = isOwner ? 'default' : `profile_${String(user.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const role = isOwner ? 'owner' : 'tester';
  const timezone = String(env.GC_DEFAULT_TIMEZONE || 'UTC').slice(0, 80);

  if (isOwner) {
    await DB.prepare(`
      INSERT OR IGNORE INTO profiles(id,display_name,timezone,locale)
      VALUES('default',?,?, 'en')
    `).bind(displayNameFor(user), timezone).run();
  } else {
    await DB.prepare(`
      INSERT OR IGNORE INTO profiles(id,display_name,timezone,locale)
      VALUES(?,?,?, 'en')
    `).bind(profileId, displayNameFor(user), timezone).run();
  }

  await DB.prepare(`
    INSERT OR IGNORE INTO auth_profile_memberships(auth_user_id,profile_id,role)
    VALUES(?,?,?)
  `).bind(user.id, profileId, role).run();

  if (!isOwner) {
    await DB.prepare(`
      UPDATE auth_invites
      SET status='accepted',accepted_at=COALESCE(accepted_at,CURRENT_TIMESTAMP),revoked_at=NULL
      WHERE email=? COLLATE NOCASE AND status='pending'
    `).bind(email).run();
  }

  const membership = await getMembershipByUserId(DB, user.id);
  if (!membership) throw new HttpError('Could not create a private Growth Compass workspace.', 500);
  return membership;
}

export async function createInvite(DB, ownerUserId, email) {
  const normalized = normalizeAuthEmail(email);
  if (!normalized || !normalized.includes('@') || normalized.length > 254) {
    throw new HttpError('Enter a valid email address.', 400);
  }

  const existingUser = await DB.prepare('SELECT id FROM "user" WHERE email=? COLLATE NOCASE').bind(normalized).first();
  if (existingUser) throw new HttpError('That email already has a Growth Compass account.', 409);

  await DB.prepare(`
    INSERT INTO auth_invites(email,invited_by_user_id,status,created_at,accepted_at,revoked_at)
    VALUES(?,?,'pending',CURRENT_TIMESTAMP,NULL,NULL)
    ON CONFLICT(email) DO UPDATE SET
      invited_by_user_id=excluded.invited_by_user_id,
      status='pending',
      created_at=CURRENT_TIMESTAMP,
      accepted_at=NULL,
      revoked_at=NULL
  `).bind(normalized, ownerUserId).run();

  return getInvite(DB, normalized);
}

export async function listInvites(DB) {
  const { results } = await DB.prepare(`
    SELECT email,status,created_at,accepted_at,revoked_at
    FROM auth_invites
    ORDER BY created_at DESC,email
    LIMIT 200
  `).all();
  return results;
}

export async function revokeInvite(DB, email) {
  const normalized = normalizeAuthEmail(email);
  await DB.prepare(`
    UPDATE auth_invites
    SET status='revoked',revoked_at=CURRENT_TIMESTAMP
    WHERE email=? COLLATE NOCASE AND status='pending'
  `).bind(normalized).run();
  return getInvite(DB, normalized);
}

export async function recordSecurityEvent(DB, { authUserId = null, profileId = null, eventType, detail = null }) {
  await DB.prepare(`
    INSERT INTO auth_security_events(auth_user_id,profile_id,event_type,detail)
    VALUES(?,?,?,?)
  `).bind(authUserId, profileId, String(eventType).slice(0, 80), detail == null ? null : String(detail).slice(0, 500)).run();
}

export async function resetPrivateProfile(DB, profileId) {
  // Explicit allow-list. Do not turn this into dynamic table discovery: new
  // personal tables must deliberately opt into reset semantics during review.
  const statements = [
    DB.prepare('DELETE FROM daily_plan_items WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM journal_entries WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM energy_logs_v1 WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM sleep_logs_v1 WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM day_context_logs_v1 WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM progress_records WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM capacity_commitments WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM goal_activities WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM goals WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM areas WHERE profile_id=?').bind(profileId),
    DB.prepare('DELETE FROM plan_versions WHERE profile_id=?').bind(profileId)
  ];
  await DB.batch(statements);
}
