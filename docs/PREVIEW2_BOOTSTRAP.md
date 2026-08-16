# Growth Compass — Preview 2 Bootstrap Runbook

Status: one-time environment bootstrap for the isolated new-experience lane.

This runbook is intentionally explicit. Automatic deployment remains disabled until the isolated Cloudflare environment exists and is protected.

## Target identities

Branch:
`feature/experience-v2`

Worker:
`personal-growth-tracker-preview2`

Workers.dev hostname:
`personal-growth-tracker-preview2.m-nejatmand.workers.dev`

D1 database name:
`personal-growth-tracker-preview2`

GitHub deployment workflow:
`.github/workflows/deploy-preview2.yml`

## Safety invariants

Preview 2 must never use either existing database ID:

- Production D1: `a182d8c8-c009-461e-ac7e-04694c1047ab`
- Preview 1 D1: `1937971c-f2f2-4dad-bc65-3d22952584bb`

The Preview 2 deployment workflow rejects either identity.

## One-time setup

### 1. Create Preview 2 D1

In Cloudflare, create a new D1 database named:

`personal-growth-tracker-preview2`

Copy the generated database UUID.

Do not rename/reuse Production or Preview 1.

### 2. Add GitHub repository variables

Repository → Settings → Secrets and variables → Actions → Variables.

Create:

`GC_PREVIEW2_D1_ID`

Value: the UUID of `personal-growth-tracker-preview2`.

Create:

`GC_PREVIEW2_ENABLED`

Initial value:

`false`

Do not enable automatic deployment yet.

### 3. Initialize Preview 2 schema

Apply the repository migrations to the new Preview 2 D1 only.

Use the reviewed D1 migration procedure already documented in `docs/D1_MIGRATION_RUNBOOK.md`.

The important requirement is that the target is the new Preview 2 UUID and neither existing database.

After applying migrations, verify integrity (`PRAGMA quick_check` or the current runbook-equivalent check).

### 4. Protect Preview 2 with Cloudflare Access

Create/configure a Cloudflare Access application for:

`personal-growth-tracker-preview2.m-nejatmand.workers.dev`

The application must block anonymous access.

Permit the owner/user policy needed for private-Beta testing.

For CI smoke tests, allow the existing Preview CI service token represented by GitHub secrets:

- `CF_ACCESS_CLIENT_ID`
- `CF_ACCESS_CLIENT_SECRET`

Alternatively create dedicated Preview 2 CI credentials and update the workflow before enabling it.

### 5. Verify Access before enabling automation

Anonymous request to:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/api/health`

must not return 2xx.

Authenticated service-token access must be permitted once the Worker exists.

### 6. Enable automation

Set GitHub repository variable:

`GC_PREVIEW2_ENABLED=true`

From that point, successful `Quality` runs for a PR whose head branch is exactly `feature/experience-v2` automatically trigger the guarded Preview 2 deployment.

## Automatic deployment behavior

The workflow:

1. accepts only successful PR-triggered `Quality` runs;
2. accepts only `feature/experience-v2` from this repository;
3. checks out the exact tested SHA;
4. requires the Preview 2 D1 repository variable;
5. generates an isolated Wrangler config at runtime;
6. rejects Production D1;
7. rejects Preview 1 D1;
8. refuses to deploy if any Preview 2 migration is pending;
9. dry-runs the Worker;
10. deploys only `personal-growth-tracker-preview2`;
11. verifies anonymous Access rejection;
12. authenticates using the Preview CI service token;
13. smoke-tests the root UI and `/api/health` D1 state.

No automatic workflow applies D1 migrations.

## Day-to-day development after bootstrap

No local Wrangler deploy should normally be needed.

Use:

```text
feature/experience-v2 change
→ Quality
→ exact green SHA
→ Deploy Preview 2
→ smoke test
→ user review
```

## Preview 1 and Production preservation

Preview 1 remains:

- branch `feature/experience-refinement`
- Worker `personal-growth-tracker-preview`
- D1 `personal-growth-tracker-preview`

Production remains separately protected.

Do not use Preview 1 as the Preview 2 deployment target and do not repoint the current Preview 1 workflow.
