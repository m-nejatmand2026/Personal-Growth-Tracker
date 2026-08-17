# Growth Compass — Preview 2 Bootstrap Runbook

Status: isolated Preview 2 environment bootstrap and recovery procedure.

Preview 2 is intentionally separated from Preview 1 and Production. The branch deployment may discover/create the isolated Preview 2 D1 database, but it must never apply schema migrations automatically.

## Target identities

Branch:
`feature/experience-v2`

Worker:
`personal-growth-tracker-preview2`

Workers.dev hostname:
`personal-growth-tracker-preview2.m-nejatmand.workers.dev`

D1 database name:
`personal-growth-tracker-preview2`

Branch deployment workflow:
`.github/workflows/deploy-preview2-branch.yml`

Cloudflare credential probe:
`.github/workflows/preview2-cloudflare-probe.yml`

Explicit migration command:
`scripts/migrate-preview2.sh`

## Safety invariants

Preview 2 must never use either existing database ID:

- Production D1: `a182d8c8-c009-461e-ac7e-04694c1047ab`
- Preview 1 D1: `1937971c-f2f2-4dad-bc65-3d22952584bb`

Both the automatic branch deployment and the explicit migration command verify that the resolved Preview 2 database differs from those identities.

The automatic deployment must fail closed while any migration is pending. Only the explicit migration command may apply Preview 2 migrations.

## Bootstrap sequence

### 1. Verify Cloudflare credentials

The repository secrets used for Preview 2 are:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CF_ACCESS_CLIENT_ID`
- `CF_ACCESS_CLIENT_SECRET`

The Preview 2 Cloudflare probe verifies account access and D1 permission without deploying Preview 1 or Production.

### 2. Resolve the isolated Preview 2 D1

The branch deployment resolves exactly one D1 database named:

`personal-growth-tracker-preview2`

If no such database exists, it creates one. If more than one matching database exists, bootstrap must fail rather than guess.

The resolved database ID is checked against the Production and Preview 1 IDs before any deploy-related action proceeds.

### 3. Initialize or advance Preview 2 schema explicitly

Automatic CI intentionally refuses to apply migrations. When the branch deployment reports pending Preview 2 migrations, run the guarded repository command from the repository root with Cloudflare credentials in the environment:

```bash
GC_PREVIEW2_MIGRATION_CONFIRM=personal-growth-tracker-preview2 \
  bash scripts/migrate-preview2.sh
```

The script:

1. requires the exact explicit confirmation value;
2. requires secret-backed Cloudflare account credentials;
3. resolves exactly one D1 named `personal-growth-tracker-preview2`;
4. refuses the Production D1 ID;
5. refuses the Preview 1 D1 ID;
6. regenerates a temporary Wrangler configuration pinned to Preview 2;
7. lists pending migrations before applying anything;
8. applies migrations only to remote `env.preview2`;
9. requires zero pending migrations afterward;
10. runs `PRAGMA quick_check;` and requires an `ok` result;
11. never deploys a Worker.

The command is idempotent: if no migrations are pending, it skips the apply step and still performs the integrity check.

### 4. Protect Preview 2 with Cloudflare Access

Cloudflare Access must protect:

`personal-growth-tracker-preview2.m-nejatmand.workers.dev`

Anonymous access must not receive a 2xx response for `/api/health`.

Authenticated CI smoke tests use:

- `CF_ACCESS_CLIENT_ID`
- `CF_ACCESS_CLIENT_SECRET`

Do not reuse Preview 1 as the Preview 2 target.

### 5. Deploy through the guarded branch workflow

A push to exactly `feature/experience-v2` runs `.github/workflows/deploy-preview2-branch.yml`.

The workflow:

1. accepts only this repository and exact Preview 2 branch;
2. checks out the exact pushed SHA without persisted Git credentials;
3. runs unit, contract and modularity tests;
4. runs real Worker + isolated D1 integration tests;
5. runs Chromium/WebKit browser acceptance;
6. resolves/creates exactly one isolated Preview 2 D1;
7. regenerates a Preview 2-only Wrangler config;
8. rejects Production and Preview 1 D1 identities;
9. refuses deployment if any Preview 2 migration is pending;
10. dry-runs only `personal-growth-tracker-preview2`;
11. deploys only `personal-growth-tracker-preview2`;
12. proves anonymous Access rejection;
13. authenticates using the CI service token;
14. smoke-tests the experience selector, Experience 1 compatibility route, Experience 2 route and D1 health.

No automatic workflow applies D1 migrations.

## Expected recovery when deployment stops at the migration gate

A failure at `Refuse pending Preview 2 migrations` is a deliberate safety stop, not a deployment defect.

Recovery order:

```text
verify the resolved database is Preview 2
→ run scripts/migrate-preview2.sh explicitly
→ confirm PRAGMA quick_check = ok
→ rerun the failed Preview 2 branch deployment
→ require protected selector + both experiences + D1 health smoke tests to pass
```

Do not remove or weaken the pending-migration gate to make deployment green.

## Day-to-day development after bootstrap

Normal Preview 2 development remains:

```text
feature/experience-v2 change
→ Quality + branch tests
→ guarded Preview 2 deploy
→ protected smoke test
→ user review
```

A new repository migration intentionally reintroduces the explicit migration step before the next Preview 2 deployment can succeed.

## Preview 1 and Production preservation

Preview 1 remains:

- branch `feature/experience-refinement`
- Worker `personal-growth-tracker-preview`
- D1 `personal-growth-tracker-preview`

Production remains separately protected.

Never repoint Preview 1, Production, or their D1 bindings while bootstrapping Preview 2.
