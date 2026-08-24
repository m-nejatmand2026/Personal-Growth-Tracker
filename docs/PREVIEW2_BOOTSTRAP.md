# Growth Compass — Preview 2 Bootstrap Runbook

Status: current isolated Preview 2 migration and deployment contract.

This runbook is operational authority for Preview 2 infrastructure. When older handoffs conflict with this file, `docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md`, or the actual workflows, the actual workflows and these current runbooks win.

## Canonical Preview 2 identities

- Branch: `feature/experience-v2`
- Worker: `personal-growth-tracker-preview2`
- D1: `personal-growth-tracker-preview2`
- Canonical root: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/`
- Experience 2 deep link: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/experience/2/`

The canonical root is the normal owner/tester entry and authentication origin. Cloudflare Git-generated commit/branch preview hostnames are deployment evidence only and must not be used for `BETTER_AUTH_URL`, OAuth callbacks, tester invitations, or Access policy.

## Protected resources

Preview 2 must never use either protected database:

- Production D1: `a182d8c8-c009-461e-ac7e-04694c1047ab`
- Preview 1 D1: `1937971c-f2f2-4dad-bc65-3d22952584bb`

Preview 1 remains on `feature/experience-refinement`, Worker/D1 `personal-growth-tracker-preview`. Production and Preview 1 deployment/migration paths are outside this runbook.

## Deployment authority

`Quality` in `.github/workflows/quality.yml` is the **sole guarded Preview 2 deployment authority** for PR #7. It tests the exact PR head before any migration or deploy, captures the current Preview 2 Worker rollback identity and a D1 Time Travel bookmark, resolves the isolated Preview 2 D1, applies only the explicitly authorized migration set, requires zero pending migrations, deploys only the exact tested SHA to `personal-growth-tracker-preview2`, and directly verifies the resulting Worker identity and D1 health.

`.github/workflows/deploy-preview2-branch.yml` is intentionally **non-deploying**. It is a branch safety gate and must not contain Cloudflare credentials, Wrangler deployment, D1 migration, or other Cloudflare write operations.

`.github/workflows/preview2-remote-smoke.yml` independently checks the staged authentication boundary and isolated D1 for the current PR head.

## Current migration model

The guarded Quality deployment currently authorizes **exactly ten SQL migration files**. Every authorized migration is pinned by Git blob identity, including:

- `0008_auth_multi_user.sql`
- `0009_time_aware_capacity.sql`
- `0010_journal_archive.sql`

Migration `0010_journal_archive.sql` is additive and Journal-owned. It adds reversible archive state to private Journal entries without creating or mutating Progress, Insights, Wellbeing, or AI evidence.

Quality invokes the guarded idempotent Preview 2 migration script only after the exact-head test gate and rollback capture:

```bash
GC_PREVIEW2_MIGRATION_CONFIRM=personal-growth-tracker-preview2 \
  bash scripts/migrate-preview2.sh
```

The script is fail-closed and Preview-2-only. It resolves exactly one D1 named `personal-growth-tracker-preview2`, refuses the Production and Preview 1 database IDs, lists pending migrations, applies only to remote `env.preview2` when needed, requires zero pending migrations afterward, runs `PRAGMA quick_check;`, and never deploys a Worker itself.

If all ten migrations are already applied, it performs no schema change and still verifies integrity.

### Adding a future migration

An eleventh migration must not silently become deployable merely because a SQL file exists. A deliberate schema change requires, in the same Preview 2 change:

1. a migration with correct module ownership;
2. relevant persistence/API/product tests;
3. an exact migration-count update in Quality;
4. the exact new Git blob pin in Quality and its safety contract tests.

Never weaken migration-count or blob checks to make CI pass.

## Guarded deployment order

The current successful path is:

```text
exact PR head
→ unit / contract / modularity tests
→ real Worker + isolated local D1 integration
→ auth isolation integration
→ Chromium + WebKit browser acceptance
→ resolve isolated Preview 2 D1
→ capture Worker rollback identity + D1 Time Travel bookmark
→ verify and apply only the authorized ten-migration set
→ require zero pending migrations + D1 integrity
→ Wrangler dry run
→ deploy exact tested SHA to personal-growth-tracker-preview2 only
→ verify deployment message and isolated D1 directly
→ independent remote smoke
```

A failed test prevents the migration and deploy job. A migration mismatch is a safety stop, not a reason to bypass the gate.

## Required CI credentials

The guarded Quality deployment requires GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The remote-smoke security boundary does not depend on a Cloudflare Access service-token shortcut.

## Internal-auth boundary

Until real owner/tester acceptance succeeds, Cloudflare Access remains in front of the canonical Preview 2 origin. `GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true` is set only after Access is intentionally removed and Growth Compass internal authentication is proven as the public/private boundary.

Authentication rollout details are governed by `docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md`.

## Day-to-day Preview 2 development

```text
inspect current PR head
→ implement only on feature/experience-v2
→ Quality exact-head tests
→ guarded migration/deploy only if all tests pass
→ remote smoke/evidence
→ inspect rendered evidence
→ continue
```

Do not merge PR #7 or alter Preview 1/Production until the owner explicitly authorizes those separate actions.
