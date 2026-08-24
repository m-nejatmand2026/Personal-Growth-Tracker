# Preview 2 internal authentication rollout

This is the operator contract for moving Growth Compass Preview 2 from temporary Cloudflare Access to product-native accounts without changing the canonical application origin.

When older handoffs disagree with this file, `docs/PREVIEW2_BOOTSTRAP.md`, or the actual workflows, the current workflows and these runbooks win.

## Canonical Preview 2 auth origin

Normal user entry and OAuth authority:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/`

Experience 2 focused deep link:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/experience/2/`

Real owner/tester acceptance starts at the root, passes Cloudflare Access while it remains enabled, then chooses Experience 2 — New.

Cloudflare Git-generated commit and branch preview hostnames are deployment evidence only. Do not use them for `BETTER_AUTH_URL`, Google/Apple callbacks, tester invitations, or the final Access policy.

## Security invariants

- Better Auth runs inside the isolated Preview 2 Worker.
- Growth Compass authorization is owned through `auth_profile_memberships`.
- The browser never chooses authoritative `profile_id`.
- The Worker strips client ownership headers and injects authenticated ownership internally.
- The owner identity maps to existing `profiles.id='default'` so current Preview 2 data is preserved.
- Each invited tester receives a new empty private profile.
- Legacy Beta routes remain owner-only after internal auth enforcement.
- Preview 1 and Production are outside this rollout.

## Deployment-safe configuration rule

Wrangler deployment can replace plaintext dashboard variables while Worker secrets persist. Therefore **store all Growth Compass auth runtime bindings as Preview 2 Worker secrets**, including non-sensitive runtime strings such as mode, canonical URL, and owner email.

Never commit real secret values and never put these bindings on Preview 1 or Production.

## Required Preview 2 Worker bindings

| Name | Storage | Required | Purpose |
| --- | --- | --- | --- |
| `GC_AUTH_MODE` | Worker secret | at activation | `enforced` only after prerequisites pass; absent/`legacy` keeps legacy boundary. |
| `BETTER_AUTH_SECRET` | Worker secret | yes | High-entropy Better Auth secret. |
| `BETTER_AUTH_URL` | Worker secret | yes | Exactly `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev` with no trailing slash. |
| `GC_OWNER_EMAIL` | Worker secret | yes | Identity that inherits the existing `default` workspace. |
| `GC_DEFAULT_TIMEZONE` | Worker secret if set | optional | New tester profile timezone; defaults to UTC. |
| `GC_GOOGLE_CLIENT_ID` / `GC_GOOGLE_CLIENT_SECRET` | Worker secrets | for Google | Google OAuth credentials. |
| `GC_APPLE_CLIENT_ID` / `GC_APPLE_CLIENT_SECRET` | Worker secrets | for Apple | Apple web OAuth credentials/JWT. |
| `GC_RESEND_API_KEY` / `GC_EMAIL_FROM` | Worker secrets | for email/password | Transactional email configuration. |

`GC_AUTH_TEST_MODE` is test-only and must never be enabled on deployed Preview 2.

`GC_PREVIEW2_INTERNAL_AUTH_ENABLED` is a GitHub repository variable used by remote smoke after Access removal; it is not a Worker auth binding.

## Provider callback URLs

- Google: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/api/auth/callback/google`
- Apple: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/api/auth/callback/apple`

`BETTER_AUTH_URL` must equal `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev` exactly.

## D1 migration state

Authentication migration `0008_auth_multi_user.sql` remains additive and does not rewrite existing personal data. The current guarded Preview 2 schema contains **ten authorized migrations**, through `0010_journal_archive.sql`.

Quality is the sole guarded deploy authority and pins all ten migration blobs. Before auth activation, verify the isolated Preview 2 D1 reports all ten authorized migrations applied, no pending migrations, and a successful integrity check.

Do not manually reapply `0008` or any later migration when the guarded migration path already reports the schema current.

## Activation sequence

1. Confirm PR #7 is still draft on the intended `feature/experience-v2` head and Quality/remote smoke correspond to that actual head.
2. Confirm Worker/D1 are exactly `personal-growth-tracker-preview2` and remain distinct from Preview 1 and Production.
3. Confirm all ten authorized migrations are applied, zero are pending, and D1 integrity is healthy.
4. Keep `GC_AUTH_MODE` absent/`legacy` while configuring the other Preview 2 Worker secrets.
5. Configure `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GC_OWNER_EMAIL`, and at least one sign-in provider.
6. Configure provider callbacks against the canonical Preview 2 origin.
7. If email/password is desired, configure verified transactional email.
8. Set `GC_AUTH_MODE=enforced` while Cloudflare Access is **still present**.
9. Enter through the canonical root, choose Experience 2, sign in as owner, and confirm `/api/account/me` reports role `owner` and profile `default`; verify owner Directions/Goals, Activities, Progress, Journal, and Schedule remain intact.
10. Create a disposable tester invitation and verify the tester starts with an empty private workspace.
11. Create tester records and prove isolation in both directions, including archive/delete boundaries.
12. Reset the tester workspace and verify owner data remains intact.
13. Test owner → sign out → tester and tester → sign out → owner handoffs for stale-data leakage.
14. Only after real owner/tester acceptance passes, remove Cloudflare Access from the canonical Preview 2 origin. Do not alter Preview 1 or Production Access.
15. Set `GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true`.
16. Rerun remote smoke plus owner/tester desktop and phone acceptance.
17. Invite real testers only after post-Access-removal checks are green.

## Rollback

If account activation fails:

1. Retain or restore Cloudflare Access on Preview 2.
2. Set `GC_AUTH_MODE=legacy` or remove that Preview 2 secret.
3. Unset/disable `GC_PREVIEW2_INTERNAL_AUTH_ENABLED` if it had been enabled.

Do not drop additive auth or Journal archive schema and do not rewrite owner data as a rollback shortcut.

## Evidence required before broader testing

- Unit/contract/modularity tests green.
- Real Worker + isolated D1 integration green.
- Enforced-auth and user-isolation integration green.
- Chromium and WebKit desktop + phone acceptance green.
- Exact tested/deployed Preview 2 SHA recorded.
- All ten migrations applied with no pending schema work.
- One real disposable sign-in tested through the canonical root before additional invitations.
- Cloudflare Access removed only after real owner/tester acceptance succeeds.
