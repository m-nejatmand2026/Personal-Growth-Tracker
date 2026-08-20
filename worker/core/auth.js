import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';

import { HttpError } from './http.js';
import {
  ensureUserProfile,
  isSignupAllowed,
  recordSecurityEvent
} from '../data/auth-profiles.js';

export const AUTH_PROFILE_HEADER = 'x-growth-profile-id';
export const AUTH_USER_HEADER = 'x-growth-auth-user-id';
export const AUTH_ROLE_HEADER = 'x-growth-auth-role';
export const AUTH_MODE_HEADER = 'x-growth-auth-mode';

export function authMode(env) {
  return String(env.GC_AUTH_MODE || 'legacy').toLowerCase() === 'enforced'
    ? 'enforced'
    : 'legacy';
}

export function authProviderStatus(env) {
  const testMode = String(env.GC_AUTH_TEST_MODE || '') === '1';
  const emailDelivery = Boolean(env.GC_RESEND_API_KEY && env.GC_EMAIL_FROM);
  return Object.freeze({
    google: Boolean(env.GC_GOOGLE_CLIENT_ID && env.GC_GOOGLE_CLIENT_SECRET),
    apple: Boolean(env.GC_APPLE_CLIENT_ID && env.GC_APPLE_CLIENT_SECRET),
    email: testMode || emailDelivery,
    email_verification: !testMode && emailDelivery
  });
}

export function authConfigured(env) {
  return Boolean(
    env.BETTER_AUTH_SECRET &&
    String(env.BETTER_AUTH_SECRET).length >= 32 &&
    env.GC_OWNER_EMAIL
  );
}

function appBaseUrl(request, env) {
  const configured = String(env.BETTER_AUTH_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  return new URL(request.url).origin;
}

function queueBackground(ctx, promise) {
  if (ctx?.waitUntil) {
    ctx.waitUntil(Promise.resolve(promise).catch((error) => {
      console.error(JSON.stringify({
        event: 'auth_background_failure',
        error_name: error?.name || 'Error',
        message: error?.message || 'Unknown error'
      }));
    }));
    return;
  }
  void Promise.resolve(promise).catch(() => {});
}

async function sendResendEmail(env, { to, subject, text }) {
  if (!env.GC_RESEND_API_KEY || !env.GC_EMAIL_FROM) {
    throw new Error('Transactional email is not configured.');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.GC_RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.GC_EMAIL_FROM,
      to: [to],
      subject,
      text
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Email delivery failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }
}

function socialProviders(env) {
  const providers = {};
  if (env.GC_GOOGLE_CLIENT_ID && env.GC_GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GC_GOOGLE_CLIENT_ID,
      clientSecret: env.GC_GOOGLE_CLIENT_SECRET,
      prompt: 'select_account'
    };
  }
  if (env.GC_APPLE_CLIENT_ID && env.GC_APPLE_CLIENT_SECRET) {
    providers.apple = {
      clientId: env.GC_APPLE_CLIENT_ID,
      clientSecret: env.GC_APPLE_CLIENT_SECRET
    };
  }
  return providers;
}

export function createAuth(request, env, ctx) {
  if (!authConfigured(env)) {
    throw new HttpError('Growth Compass authentication is not configured.', 503);
  }

  const providers = authProviderStatus(env);
  const testMode = String(env.GC_AUTH_TEST_MODE || '') === '1';
  const baseURL = appBaseUrl(request, env);
  const trustedOrigins = [new URL(baseURL).origin];
  if (providers.apple) trustedOrigins.push('https://appleid.apple.com');

  return betterAuth({
    database: env.DB,
    baseURL,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
    socialProviders: socialProviders(env),
    emailAndPassword: {
      enabled: providers.email,
      requireEmailVerification: providers.email_verification,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: providers.email_verification
        ? async ({ user, url }) => {
            queueBackground(ctx, sendResendEmail(env, {
              to: user.email,
              subject: 'Reset your Growth Compass password',
              text: `Reset your Growth Compass password: ${url}\n\nIf you did not request this, you can ignore this email.`
            }));
          }
        : undefined
    },
    emailVerification: providers.email_verification
      ? {
          sendOnSignUp: true,
          sendOnSignIn: true,
          autoSignInAfterVerification: true,
          expiresIn: 60 * 60,
          sendVerificationEmail: async ({ user, url }) => {
            queueBackground(ctx, sendResendEmail(env, {
              to: user.email,
              subject: 'Verify your Growth Compass email',
              text: `Verify your email to continue to Growth Compass: ${url}\n\nThis link expires in one hour.`
            }));
          }
        }
      : undefined,
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!(await isSignupAllowed(env.DB, env, user.email))) {
              throw new APIError('FORBIDDEN', {
                message: 'This Growth Compass preview is invite-only.'
              });
            }
            return { data: user };
          },
          after: async (user) => {
            const membership = await ensureUserProfile(env.DB, env, user);
            await recordSecurityEvent(env.DB, {
              authUserId: user.id,
              profileId: membership.profile_id,
              eventType: 'account_created'
            });
          }
        }
      },
      session: {
        create: {
          after: async (session) => {
            // Security events share the same D1 boundary as the session. Await
            // the write so a returned auth response never leaves a D1 write
            // racing the user's first authenticated product request.
            await recordSecurityEvent(env.DB, {
              authUserId: session.userId,
              eventType: 'session_created'
            });
          }
        }
      }
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false
      }
    },
    advanced: {
      database: {
        generateId: 'uuid'
      },
      useSecureCookies: new URL(baseURL).protocol === 'https:',
      crossSubDomainCookies: { enabled: false }
    }
  });
}

export async function getAuthenticatedContext(request, env, ctx) {
  const auth = createAuth(request, env, ctx);
  const result = await auth.api.getSession({ headers: request.headers });
  if (!result?.user) throw new HttpError('Authentication required.', 401);
  const membership = await ensureUserProfile(env.DB, env, result.user);
  return Object.freeze({
    auth,
    user: result.user,
    session: result.session,
    profileId: membership.profile_id,
    role: membership.role
  });
}

export function requestWithAuthContext(request, authContext, mode = 'enforced') {
  const headers = new Headers(request.headers);
  headers.delete(AUTH_PROFILE_HEADER);
  headers.delete(AUTH_USER_HEADER);
  headers.delete(AUTH_ROLE_HEADER);
  headers.delete(AUTH_MODE_HEADER);
  headers.set(AUTH_PROFILE_HEADER, authContext.profileId);
  headers.set(AUTH_USER_HEADER, authContext.user?.id || 'legacy-owner');
  headers.set(AUTH_ROLE_HEADER, authContext.role || 'owner');
  headers.set(AUTH_MODE_HEADER, mode);
  return new Request(request, { headers });
}

export function legacyAuthContext() {
  return Object.freeze({
    user: null,
    session: null,
    profileId: 'default',
    role: 'owner'
  });
}
