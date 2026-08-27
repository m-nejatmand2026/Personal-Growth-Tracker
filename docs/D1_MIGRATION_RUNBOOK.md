# Growth Compass D1 migration runbook

Status: mandatory release procedure for **Growth Compass — Version 1 Beta**.

This runbook applies to any change that creates or applies a D1 migration. It supplements `docs/MODULARITY_STANDARD.md`; the modularity standard wins on ownership questions.

## Non-negotiable rules

1. **Never apply an unreviewed migration to production.**
2. **Preview first.** The exact migration set must be applied and validated on the isolated preview D1 before production approval.
3. **Automatic Worker preview deployment never applies migrations.** A pending migration intentionally blocks automatic preview deployment.
4. **Production migration is an explicit release action.** It requires user acceptance and a recorded pre-migration Time Travel bookmark.
5. **Module-owned, additive by default.** New migration files declare `Module-Owner:` and any temporary `Compatibility-Tables:` exceptions.
6. **Preserve factual history.** Existing Progress/Wellbeing/history data is not rewritten or deleted merely to simplify a new model.
7. **No production data repair by ad-hoc console mutation.** A required data transformation belongs in a reviewed migration or an explicit, recorded repair procedure.
8. Use the repository-pinned Wrangler version: **4.123.0**.

## Before writing a migration

Confirm all of the following:

- the owning business module is identified;
- a platform-owned migration is genuinely platform infrastructure rather than hidden business logic;
- dependencies use public contracts at runtime rather than cross-module table reads;
- the change is additive where practical;
- any destructive operation has a documented reason and recovery path;
- profile isolation is preserved;
- indexes match known query shapes rather than being added speculatively;
- compatibility tables have an explicit sunset plan;
- the migration filename is the next ordered migration number.

For migrations created after the modularity standard, include headers such as:

```sql
-- Module-Owner: activities
-- Compatibility-Tables: legacy_table_name
```

Use an empty compatibility list when none is needed.

## Local / isolated validation requirement

Before public release, the automated integration suite must apply the complete migration chain to isolated D1 test storage and exercise representative HTTP CRUD paths. Until that Phase 3 audit requirement is implemented, static migration gates plus preview validation remain necessary but are not considered complete database integration coverage.

## Preview migration procedure

The preview database is:

- binding: `DB`
- name: `personal-growth-tracker-preview`
- ID: `1937971c-f2f2-4dad-bc65-3d22952584bb`

### 1. Confirm the exact feature checkpoint

Quality must be green for the exact feature SHA that contains the migration.

### 2. List unapplied preview migrations

```sh
npx --yes wrangler@4.123.0 d1 migrations list DB --remote --env preview
```

Review the exact filenames before continuing.

### 3. Record a pre-migration Time Travel bookmark

```sh
npx --yes wrangler@4.123.0 d1 time-travel info DB --env preview
```

Record the bookmark in the release/audit record before applying the migration. Time Travel is the rollback mechanism for a failed remote schema/data change; a restore is destructive and must itself be treated as an explicit recovery action.

### 4. Apply only the reviewed preview migrations

```sh
npx --yes wrangler@4.123.0 d1 migrations apply DB --remote --env preview
```

If Wrangler reports a migration error, stop. Do not manually mark it applied and do not continue to Worker deployment.

### 5. Confirm migration state

```sh
npx --yes wrangler@4.123.0 d1 migrations list DB --remote --env preview
```

Expected result: no unapplied migrations.

### 6. Run database integrity checks

```sh
npx --yes wrangler@4.123.0 d1 execute DB --remote --env preview --command="PRAGMA quick_check;"
```

Expected result: `ok`.

```sh
npx --yes wrangler@4.123.0 d1 execute DB --remote --env preview --command="PRAGMA foreign_key_check;"
```

Expected result: no violating rows.

After schema/index changes, run:

```sh
npx --yes wrangler@4.123.0 d1 execute DB --remote --env preview --command="PRAGMA optimize;"
```

Then rerun `PRAGMA quick_check`.

### 7. Allow automatic preview deployment to resume

Once no preview migrations are pending, the guarded GitHub workflow may deploy the exact Quality-tested feature SHA. Its authenticated operational smoke test must verify the root UI plus the platform-owned `/api/health` route, which executes a data-free `SELECT 1` against the preview D1 binding. The smoke test must not read user-owned module data merely to prove database availability.

### 8. Human preview validation

Exercise the affected user flow plus at least one unrelated module. A migration is not accepted merely because SQL applied successfully.

## Production migration gate

Production D1:

- binding: `DB`
- name: `personal-growth-tracker`
- ID: `a182d8c8-c009-461e-ac7e-04694c1047ab`

Production migration is **not** part of ordinary ChatGPT → GitHub → preview automation.

Before any production migration:

1. user explicitly accepts the preview release candidate;
2. PR/release checkpoint is frozen and Quality is green;
3. preview has the same migration set successfully applied and validated;
4. production unapplied migrations are listed and reviewed;
5. a production Time Travel bookmark is recorded;
6. the planned Worker release and schema compatibility order is confirmed;
7. a rollback decision point is defined.

### Production preflight

```sh
npx --yes wrangler@4.123.0 d1 migrations list DB --remote
```

```sh
npx --yes wrangler@4.123.0 d1 time-travel info DB
```

Do **not** proceed unless the database identity and pending migration list are exactly expected.

### Production apply — explicit approval only

```sh
npx --yes wrangler@4.123.0 d1 migrations apply DB --remote
```

This command must never be embedded in the automatic preview workflow.

### Production integrity validation

```sh
npx --yes wrangler@4.123.0 d1 execute DB --remote --command="PRAGMA quick_check;"
```

```sh
npx --yes wrangler@4.123.0 d1 execute DB --remote --command="PRAGMA foreign_key_check;"
```

After schema/index changes:

```sh
npx --yes wrangler@4.123.0 d1 execute DB --remote --command="PRAGMA optimize;"
```

Rerun `PRAGMA quick_check` after optimization.

Only after database integrity passes should the corresponding production Worker release proceed.

## Recovery

If a remote migration or data transformation produces an unacceptable state:

1. stop all further migration/deploy actions;
2. record the current database state and error evidence;
3. determine whether a forward corrective migration is safer than restoration;
4. if restoration is required, use the previously recorded Time Travel bookmark;
5. remember that Time Travel restore overwrites the database in place and cancels in-flight queries;
6. record the `previous_bookmark` returned by a restore so the restore itself can be undone if necessary;
7. rerun `PRAGMA quick_check`, `PRAGMA foreign_key_check`, migration listing, and application smoke tests after recovery.

Never improvise a production restore without an explicit recovery decision.

Worker code rollback is a separate operation. See `docs/OPERATIONS_RUNBOOK.md`; a Worker rollback does not undo D1 schema/data changes.

## Current Beta state

At the time this runbook was introduced:

- preview already has migrations `0006_activities_contract.sql` and `0007_wellbeing_energy.sql` applied;
- production intentionally still has `0006` and `0007` pending;
- no production migration is authorized by this document.
