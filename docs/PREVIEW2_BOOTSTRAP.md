# Growth Compass — Preview 2 Bootstrap Runbook

Status: current isolated Preview 2 bootstrap, migration and deployment contract.

This runbook is the operational authority for Preview 2 infrastructure. Older Preview 2 handoff documents may describe the original bootstrap design; when they differ from this file or `docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md`, these two current runbooks win.

Preview 2 is intentionally separated from Preview 1 and Production.

## Canonical Preview 2 identities

Branch:
`feature/experience-v2`

Worker:
`personal-growth-tracker-preview2`

Canonical Workers.dev origin:
`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev`

Experience 2 path:
`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/experience/2/`

D1 database:
`personal-growth-tracker-preview2`

Branch deployment workflow:
`.github/workflows/deploy-preview2-branch.yml`

PR remote-smoke workflow:
`.github/workflows/preview2-remote-smoke.yml`

Guarded migration command:
`scripts/migrate-preview2.sh`

Cloudflare Git-generated commit/branch preview hostnames are deployment evidence only. They are not the canonical Preview 2 auth origin and must not be used for `BETTER_AUTH_URL`, OAuth callback URLs, tester invitations or the final Access policy.

## Safety invariants

Preview 2 must never use either existing database ID:

- Production D1: `a182d8c8-c009-461e-ac7e-04694c1047ab`
- Preview 1 D1: `1937971c-f2f2-4dad-bc65-3d22952584bb`

The branch deployment and migration script resolve Preview 2 by the exact database name `personal-growth-tracker-preview2` and refuse either protected ID.

Production and Preview 1 migration/deployment paths are outside this workflow.

## Required Cloudflare CI credentials

The current Preview 2 workflows require these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The current branch deploy and PR remote-smoke workflows do not depend on `CF_ACCESS_CLIENT_ID` or `CF_ACCESS_CLIENT_SECRET`. Do not add Access service-token dependencies merely to satisfy stale bootstrap documentation.

## Preview 2 D1 resolution

The branch deployment resolves exactly one D1 database named:

`personal-growth-tracker-preview2`

If none exists, the branch workflow may create it. If more than one matching database exists, deployment fails rather than guessing.

The resolved ID is checked against the explicit Production and Preview 1 IDs before any migration or deployment action proceeds.

## Current migration model

The original Preview 2 bootstrap used a manual-only migration gate. That is no longer the current branch behavior.

The current `.github/workflows/deploy-preview2-branch.yml` is allowed to advance **only the explicitly authorized Preview 2 migration set**. It currently requires exactly eight SQL migration files and pins the Git blob for every authorized migration, including `0008_auth_multi_user.sql`.

The workflow then invokes:

```bash
GC_PREVIEW2_MIGRATION_CONFIRM=personal-growth-tracker-preview2 \
  bash scripts/migrate-preview2.sh
```

The script is still fail-closed and Preview-2-only. It:

1. requires the exact explicit confirmation value;
2. requires Cloudflare account credentials;
3. resolves exactly one D1 named `personal-growth-tracker-preview2`;
4. refuses the Production D1 ID;
5. refuses the Preview 1 D1 ID;
6. generates a temporary Preview 2-only Wrangler configuration;
7. lists pending migrations before changing anything;
8. applies migrations only to remote `env.preview2` when migrations are actually pending;
9. requires zero pending migrations afterward;
10. runs `PRAGMA quick_check;` and requires `ok`;
11. never deploys a Worker itself.

The command is idempotent. If all eight migrations are already applied, it performs no schema change and still verifies integrity.

### Adding a future migration

A ninth migration must not silently start running just because a SQL file exists.

A deliberate schema change requires updating the branch workflow's authorized migration count and exact blob pin in the same reviewed Preview 2 change. Until that happens, the workflow must fail closed.

Never weaken the migration-count or blob checks to make CI green.

## Cloudflare Access before internal-auth cutover

Until real Growth Compass account acceptance succeeds, Cloudflare Access must protect the canonical Preview 2 origin:

`personal-growth-tracker-preview2.m-nejatmand.workers.dev`

Before internal auth becomes the public front door, anonymous access must not receive a 2xx response for `/api/health`.

The current smoke workflows verify the boundary directly rather than authenticating through an Access service token.

## Branch deployment behavior

A push to exactly `feature/experience-v2` runs `.github/workflows/deploy-preview2-branch.yml`.

The workflow:

1. accepts only this repository and exact Preview 2 branch;
2. checks out the exact pushed SHA without persisted Git credentials;
3. runs unit, contract and modularity tests;
4. runs real Worker + isolated D1 integration tests;
5. runs enforced-auth integration tests;
6. runs Chromium/WebKit browser acceptance;
7. resolves/creates exactly one isolated Preview 2 D1;
8. regenerates a Preview 2-only Wrangler config;
9. rejects Production and Preview 1 D1 identities;
10. verifies the exact authorized migration count and blob pins;
11. runs the guarded idempotent Preview 2 migration script;
12. requires zero pending Preview 2 migrations;
13. dry-runs and deploys only `personal-growth-tracker-preview2`;
14. verifies the current auth boundary, Worker route and isolated D1 health.

The PR workflow `.github/workflows/preview2-remote-smoke.yml` independently verifies the staged security boundary and isolated D1 for the PR head.

## Interpreting migration failures

A migration-related branch failure is a safety stop, not a reason to bypass the gate.

Use this order:

```text
confirm the resolved database is personal-growth-tracker-preview2
→ determine whether the migration set itself changed
→ if no schema change was intended, restore the authorized eight-file set
→ if a new migration is intentional, review it and explicitly update the authorized count/blob pin
→ rerun the guarded migration path
→ require zero pending migrations and PRAGMA quick_check = ok
→ rerun deployment
```

Do not run Preview 2 migration commands against Preview 1 or Production.

## Internal-auth activation

Authentication rollout is governed by:

`docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md`

Important boundary:

- Cloudflare Access remains in front while real owner/tester acceptance is performed.
- `GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true` is set only after Access is intentionally removed from the canonical Preview 2 origin and Growth Compass internal auth is confirmed as the real public boundary.

Do not use the obsolete `GC_PREVIEW2_ENABLED` bootstrap flag as an auth-activation signal.

## Day-to-day Preview 2 development

Normal Preview 2 development is:

```text
feature/experience-v2 change
→ Quality + branch tests
→ guarded authorized Preview 2 migration check/apply
→ guarded Preview 2 deploy
→ protected/internal-auth-aware remote smoke
→ user review
```

## Preview 1 and Production preservation

Preview 1 remains:

- branch `feature/experience-refinement`
- Worker `personal-growth-tracker-preview`
- D1 `personal-growth-tracker-preview`

Production remains separately protected.

Never repoint Preview 1, Production or their D1 bindings while bootstrapping or activating Preview 2.
