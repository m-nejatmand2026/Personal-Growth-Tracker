# Preview 2 internal authentication rollout

This document is the operator contract for moving Growth Compass Preview 2 from the temporary Cloudflare Access gate to product-native accounts without changing the canonical application origin after activation.

When older Preview 2 handoff documents disagree with this file or `docs/PREVIEW2_BOOTSTRAP.md`, these current operational runbooks win.

## Canonical Preview 2 auth origin

The authoritative Preview 2 Worker/origin and **normal user entry URL** is:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/`

Opening the root serves the Preview 2 Experience Selector. Real owner/tester authentication acceptance must start at this root URL, pass Cloudflare Access while it is still enabled, then choose **Experience 2 — New**.

Experience 2 also has this direct deep link:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/experience/2/`

The Experience 2 deep link is valid for focused direct testing, but it is not the normal base entry URL and must not be substituted for the root when documenting the standard user login flow.

Cloudflare Git-generated commit and branch preview hostnames are useful deployment evidence, but they are **not** the canonical authentication origin. Do not use them for `BETTER_AUTH_URL`, Google/Apple callbacks, tester invitations or the final Cloudflare Access policy.

## Security invariants

- Authentication is handled by Better Auth inside the Preview 2 Worker.
- Authorization is owned by Growth Compass through `auth_profile_memberships`.
- The browser never selects or submits the authoritative `profile_id`.
- The Worker strips client ownership headers and injects the authenticated profile internally.
- The original owner account maps to the existing `profiles.id='default'` workspace so current data is preserved.
- Every invited tester gets a new empty private profile.
- Legacy Beta routes remain owner-only after internal auth is enforced.
- Preview 1 and Production resources are not part of this rollout.

## Deployment-safe configuration rule

The current Preview 2 branch deploy uses Wrangler without `keep_vars`. Cloudflare dashboard plaintext variables can therefore be replaced by a later deploy, while Worker secrets are preserved.

For this rollout, store **all Growth Compass auth runtime bindings as Preview 2 Worker secrets**, including non-sensitive configuration strings such as the mode, canonical URL and owner email. This deliberately favors deployment safety and keeps auth state attached to the isolated Preview 2 Worker.

Do not commit any real values to Git.

Do not put these bindings on Preview 1 or Production.

## Required Preview 2 Worker bindings

Configure these on Worker `personal-growth-tracker-preview2` only:

| Name | Storage | Required | Purpose |
| --- | --- | --- | --- |
| `GC_AUTH_MODE` | Worker secret | yes at activation | `enforced` only after the rest of the activation prerequisites pass. Omit/`legacy` keeps current behavior. |
| `BETTER_AUTH_SECRET` | Worker secret | yes | At least 32 high-entropy characters. Never commit it. |
| `BETTER_AUTH_URL` | Worker secret | yes | Must be exactly `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev` with no trailing slash. |
| `GC_OWNER_EMAIL` | Worker secret | yes | Exact email that should inherit the existing `default` workspace. |
| `GC_DEFAULT_TIMEZONE` | Worker secret if set | optional | New tester profile timezone; defaults to `UTC`. |
| `GC_GOOGLE_CLIENT_ID` | Worker secret | for Google | Google OAuth web client ID. |
| `GC_GOOGLE_CLIENT_SECRET` | Worker secret | for Google | Google OAuth web client secret. |
| `GC_APPLE_CLIENT_ID` | Worker secret | for Apple | Apple Services ID / web client ID. |
| `GC_APPLE_CLIENT_SECRET` | Worker secret | for Apple | Current Apple client-secret JWT. Rotate before expiry. |
| `GC_RESEND_API_KEY` | Worker secret | for email/password | Resend API key used only by the Worker. |
| `GC_EMAIL_FROM` | Worker secret | for email/password | Verified sender, e.g. `Growth Compass <accounts@example.com>`. |

`GC_AUTH_TEST_MODE` is test-only and must never be enabled on the deployed Preview 2 Worker.

`GC_PREVIEW2_INTERNAL_AUTH_ENABLED` is different: it is a GitHub repository variable used by remote smoke after Access removal. It is not a Worker auth binding.

## Provider callback URLs

For the canonical origin configure:

- Google redirect URI: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/api/auth/callback/google`
- Apple return URL: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/api/auth/callback/apple`

`BETTER_AUTH_URL` must equal `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev` exactly.

Do not use a rotating commit-preview hostname or the Cloudflare Git branch-preview hostname for OAuth configuration.

## Email/password behavior

Email/password is exposed only when transactional email is configured. In normal deployed mode:

- signup sends a verification email;
- unverified password accounts cannot create a session;
- password-reset links are delivered by email;
- reset revokes other sessions;
- signup remains invite-only.

Google and Apple buttons appear only when their provider credentials are present.

## D1 migration state

Migration `0008_auth_multi_user.sql` is additive. It creates Better Auth tables plus Growth Compass membership, invite and security-event tables. It does not rewrite existing personal data.

The current protected Preview 2 branch workflow pins all eight authorized migration blobs and runs the guarded idempotent Preview 2 migration path before deployment. Before auth activation, verify the isolated Preview 2 D1 reports all eight migrations applied and no migrations pending.

Do **not** blindly reapply migration `0008`. If the schema is already current, the guarded migration script must perform no schema change and only verify integrity.

## Activation sequence

1. Confirm PR #7 is still on the intended `feature/experience-v2` head and Quality/remote smoke are green for that actual head.
2. Confirm the canonical Preview 2 Worker is `personal-growth-tracker-preview2` and Cloudflare Access still protects `personal-growth-tracker-preview2.m-nejatmand.workers.dev`.
3. Confirm the isolated Preview 2 D1 has exactly the authorized eight migrations applied, zero pending migrations and a successful integrity check.
4. Keep `GC_AUTH_MODE` absent/`legacy` while configuring the remaining Preview 2 Worker secrets.
5. Configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GC_OWNER_EMAIL`, and at least one sign-in provider.
6. Configure Google/Apple callback URLs against the canonical Preview 2 origin.
7. If email/password is desired, configure Resend and the verified sender.
8. Set Preview 2 Worker secret `GC_AUTH_MODE=enforced` while Cloudflare Access is **still present**.
9. Open `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/`, pass Cloudflare Access if prompted, choose **Experience 2 — New**, sign in with the owner email, and confirm `/api/account/me` resolves role `owner` and profile `default`. Verify current owner Goals, Activities, Journal, Progress and Schedule remain present.
10. Create one disposable invitation in Account settings. Register that tester through the same root-entry → Experience 2 flow and verify the workspace starts empty.
11. Create several tester records and verify the owner cannot see them; verify the tester cannot read/update/delete owner records or access owner-only legacy boundaries.
12. Reset the tester workspace and verify only tester records are removed.
13. Verify owner → sign out → tester and tester → sign out → owner handoffs leave no stale UI or private data behind.
14. Only after all real owner/tester acceptance passes, remove Cloudflare Access from the canonical Preview 2 origin. Do not alter Preview 1 or Production Access policies.
15. Set GitHub repository variable `GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true`. Remote smoke then changes its boundary expectation from “Cloudflare Access blocks anonymous users” to “account status is public and private APIs return 401”.
16. Rerun remote smoke plus owner/tester desktop and phone acceptance.
17. Invite the first real tester only after the post-Access-removal checks are green.

## Owner acceptance checklist

After `GC_AUTH_MODE=enforced`, while Cloudflare Access is still protecting entry, verify:

- start at the canonical root `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/`;
- Cloudflare Access still appears first when required;
- the root Experience Selector appears after Access;
- choose **Experience 2 — New**;
- Growth Compass login appears in Experience 2;
- owner signs in with the exact `GC_OWNER_EMAIL` identity;
- `/api/account/me` shows role `owner` and profile `default`;
- existing Goals are present;
- existing Activities are present;
- existing Progress is present;
- existing Journal is present;
- existing Schedule/private data is intact;
- account panel shows the correct identity/role;
- sign-out succeeds and invalidates the old session;
- signing back in through the same root-entry flow restores the same owner workspace.

## Disposable tester acceptance checklist

Verify the tester initially sees no owner private data:

- empty Goals;
- empty Activities;
- empty Progress;
- empty Journal;
- empty private workspace.

Then create tester records and prove isolation in both directions before reset testing.

## Rollback

If account activation has any issue:

1. Restore/retain Cloudflare Access on the canonical Preview 2 hostname.
2. Set Preview 2 Worker secret `GC_AUTH_MODE=legacy` or remove that secret.
3. Set `GC_PREVIEW2_INTERNAL_AUTH_ENABLED=false`/unset it if it had already been enabled.

Do **not** drop migration `0008` tables and do not move or rewrite owner data. The additive auth tables can remain dormant while the issue is investigated.

## Tester lifecycle

- Owner enters a tester email in **Account → Invite testers**.
- The tester opens `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/`, passes Access if still enabled, and chooses **Experience 2 — New**.
- The tester signs in with Google, Apple, or verified email/password using the invited email.
- First successful account creation creates a new private profile with no owner data.
- **Reset my workspace** deletes only that tester’s V1 product records; it cannot reset the owner workspace.
- Revoking a pending invite prevents that email from registering. Accepted accounts are not silently destroyed by revoking an old invitation.

## Evidence required before broad testing

- Unit/contract/modularity tests green.
- Real Worker + D1 integration green.
- Enforced-auth integration green.
- User A/User B isolation tests green for Areas, Goals, Activities, Daily Plan, Schedule/Capacity, Progress, Journal, Wellbeing, export and legacy-route boundaries.
- Chromium and WebKit browser acceptance green.
- Exact Preview 2 migration and deployment SHA recorded.
- One disposable real sign-in tested through the canonical root-entry flow before inviting additional people.
- Cloudflare Access removed only after real owner/tester acceptance succeeds.
