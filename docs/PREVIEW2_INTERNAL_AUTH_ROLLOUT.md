# Preview 2 internal authentication rollout

This document is the operator contract for moving Growth Compass Preview 2 from the temporary Cloudflare Access gate to product-native accounts without changing the Experience 2 application URL after activation.

## Security invariants

- Authentication is handled by Better Auth inside the Preview 2 Worker.
- Authorization is owned by Growth Compass through `auth_profile_memberships`.
- The browser never selects or submits the authoritative `profile_id`.
- The Worker strips client ownership headers and injects the authenticated profile internally.
- The original owner account maps to the existing `profiles.id='default'` workspace so current data is preserved.
- Every invited tester gets a new empty private profile.
- Legacy Beta routes remain owner-only after internal auth is enforced.
- Preview 1 and Production resources are not part of this rollout.

## Required Preview 2 Worker values

Set these only on the isolated Preview 2 deployment:

| Name | Type | Required | Purpose |
| --- | --- | --- | --- |
| `GC_AUTH_MODE` | variable | yes at activation | Set to `enforced` only after the rest of this checklist passes. Omit/`legacy` keeps current behavior. |
| `BETTER_AUTH_SECRET` | secret | yes | At least 32 high-entropy characters. Never commit it. |
| `BETTER_AUTH_URL` | variable | yes | The final stable Experience 2 origin, without a trailing slash. |
| `GC_OWNER_EMAIL` | variable/secret | yes | Exact email that should inherit the existing `default` workspace. |
| `GC_DEFAULT_TIMEZONE` | variable | optional | New tester profile timezone; defaults to `UTC`. |
| `GC_GOOGLE_CLIENT_ID` | secret | for Google | Google OAuth web client ID. |
| `GC_GOOGLE_CLIENT_SECRET` | secret | for Google | Google OAuth web client secret. |
| `GC_APPLE_CLIENT_ID` | secret | for Apple | Apple Services ID / web client ID. |
| `GC_APPLE_CLIENT_SECRET` | secret | for Apple | Current Apple client-secret JWT. Rotate before expiry. |
| `GC_RESEND_API_KEY` | secret | for email/password | Resend API key used only by the Worker. |
| `GC_EMAIL_FROM` | variable | for email/password | Verified sender, e.g. `Growth Compass <accounts@example.com>`. |

`GC_AUTH_TEST_MODE` is test-only and must never be enabled on the deployed Preview 2 Worker.

## Provider callback URLs

For the final stable origin `https://YOUR-EXPERIENCE-2-HOST`, configure:

- Google redirect URI: `https://YOUR-EXPERIENCE-2-HOST/api/auth/callback/google`
- Apple return URL: `https://YOUR-EXPERIENCE-2-HOST/api/auth/callback/apple`

`BETTER_AUTH_URL` must equal `https://YOUR-EXPERIENCE-2-HOST` exactly. Do not use a commit-preview hostname for OAuth configuration because commit-preview URLs rotate.

## Email/password behavior

Email/password is exposed only when transactional email is configured. In normal deployed mode:

- signup sends a verification email;
- unverified password accounts cannot create a session;
- password-reset links are delivered by email;
- reset revokes other sessions;
- signup remains invite-only.

Google and Apple buttons appear only when their provider credentials are present.

## D1 migration

Migration `0008_auth_multi_user.sql` is additive. It creates Better Auth tables plus Growth Compass membership, invite, and security-event tables. It does not rewrite existing personal data.

The protected Preview 2 branch deploy workflow pins all eight migration blobs and refuses unexpected migration changes. Verify the isolated Preview 2 D1 has no pending migrations before activation.

## Activation sequence

1. Deploy the code with `GC_AUTH_MODE` absent/`legacy` while Cloudflare Access still protects Preview 2.
2. Confirm Quality and the isolated Preview 2 branch deployment are green, including the enforced-auth synthetic integration tests.
3. Configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GC_OWNER_EMAIL`, and at least one sign-in provider.
4. Configure Google/Apple callback URLs against the final stable Experience 2 hostname.
5. If email/password is desired, configure Resend and the verified sender.
6. Set `GC_AUTH_MODE=enforced` on Preview 2 and verify while Cloudflare Access is still present using an authenticated operator session/service path.
7. Sign in with the owner email and confirm `/api/account/me` resolves role `owner` and profile `default`. Verify current owner Goals/Activities/Journal/Progress remain present.
8. Create one disposable invitation in Account settings. Register that tester and verify the workspace is empty.
9. Verify the disposable tester cannot read/update/delete owner records and cannot access legacy Beta routes.
10. Remove Cloudflare Access from the final Experience 2 hostname only. Do not alter Preview 1 or Production Access policies.
11. Set the GitHub repository variable `GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true`. Remote smoke then changes its boundary expectation from “Cloudflare Access blocks anonymous users” to “account status is public and private APIs return 401”.
12. Invite the first real tester from the Growth Compass Account panel.

## Rollback

If account activation has any issue:

1. Restore Cloudflare Access on the Experience 2 hostname.
2. Set `GC_AUTH_MODE=legacy` or remove it.
3. Set `GC_PREVIEW2_INTERNAL_AUTH_ENABLED=false`/unset it.

Do **not** drop migration 0008 tables and do not move or rewrite owner data. The additive auth tables can remain dormant while the issue is investigated.

## Tester lifecycle

- Owner enters a tester email in **Account → Invite testers**.
- The tester opens the same stable Experience 2 URL.
- The tester signs in with Google, Apple, or verified email/password using the invited email.
- First successful account creation creates a new private profile with no owner data.
- **Reset my workspace** deletes only that tester’s V1 product records; it cannot reset the owner workspace.
- Revoking a pending invite prevents that email from registering. Accepted accounts are not silently destroyed by revoking an old invitation.

## Evidence required before broad testing

- Unit/contract/modularity tests green.
- Real Worker + D1 integration green.
- User A/User B isolation tests green for Areas, Goals, Activities, Daily Plan, Schedule/Capacity, Progress, Journal, Wellbeing, export and legacy-route boundaries.
- Chromium and WebKit browser acceptance green in legacy deployment mode.
- Exact Preview 2 migration and deployment SHA recorded.
- One disposable real sign-in tested on the final hostname before inviting additional people.
