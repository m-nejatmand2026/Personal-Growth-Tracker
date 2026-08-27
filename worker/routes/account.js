import { bad, json, readJsonBody } from '../core/http.js';
import { authConfigured, authMode, authProviderStatus } from '../core/auth.js';
import {
  createInvite,
  listInvites,
  recordSecurityEvent,
  resetPrivateProfile,
  revokeInvite
} from '../data/auth-profiles.js';

function requireAuthContext(authContext) {
  if (!authContext?.user || !authContext?.profileId) {
    return bad('Authentication required.', 401);
  }
  return null;
}

function requireOwner(authContext) {
  const missing = requireAuthContext(authContext);
  if (missing) return missing;
  if (authContext.role !== 'owner') return bad('Owner access required.', 403);
  return null;
}

export function accountStatusRoute({ env }) {
  const mode = authMode(env);
  const providers = authProviderStatus(env);
  return json({
    mode,
    configured: authConfigured(env),
    invite_only: true,
    providers: {
      google: providers.google,
      apple: providers.apple,
      email: providers.email,
      email_verification: providers.email_verification
    }
  });
}

export function accountMeRoute({ authContext }) {
  const missing = requireAuthContext(authContext);
  if (missing) return missing;
  const { user, session, profileId, role } = authContext;
  return json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      email_verified: Boolean(user.emailVerified),
      image: user.image || null
    },
    session: {
      expires_at: session?.expiresAt || null
    },
    workspace: {
      profile_id: profileId,
      role,
      can_manage_invites: role === 'owner',
      can_reset: role === 'tester'
    }
  });
}

export async function listInvitesRoute({ env, authContext }) {
  const denied = requireOwner(authContext);
  if (denied) return denied;
  return json({ items: await listInvites(env.DB) });
}

export async function createInviteRoute({ request, env, authContext }) {
  const denied = requireOwner(authContext);
  if (denied) return denied;
  const body = await readJsonBody(request);
  const invite = await createInvite(env.DB, authContext.user.id, body.email);
  await recordSecurityEvent(env.DB, {
    authUserId: authContext.user.id,
    profileId: authContext.profileId,
    eventType: 'invite_created',
    detail: invite.email
  });
  return json({ item: invite }, 201);
}

export async function revokeInviteRoute({ request, env, authContext }) {
  const denied = requireOwner(authContext);
  if (denied) return denied;
  const body = await readJsonBody(request);
  const invite = await revokeInvite(env.DB, body.email);
  if (!invite) return bad('Invitation not found.', 404);
  await recordSecurityEvent(env.DB, {
    authUserId: authContext.user.id,
    profileId: authContext.profileId,
    eventType: 'invite_revoked',
    detail: invite.email
  });
  return json({ item: invite });
}

export async function resetWorkspaceRoute({ request, env, authContext }) {
  const missing = requireAuthContext(authContext);
  if (missing) return missing;
  if (authContext.role !== 'tester') {
    return bad('The owner workspace cannot be reset from the tester reset action.', 403);
  }
  const body = await readJsonBody(request);
  if (body.confirm !== 'RESET') return bad('Type RESET to confirm workspace reset.', 400);

  await resetPrivateProfile(env.DB, authContext.profileId);
  await recordSecurityEvent(env.DB, {
    authUserId: authContext.user.id,
    profileId: authContext.profileId,
    eventType: 'workspace_reset'
  });
  return json({ reset: true });
}
