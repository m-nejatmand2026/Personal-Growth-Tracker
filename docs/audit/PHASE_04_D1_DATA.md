# Engineering audit — Phase 4: D1, data, migrations and integrity

Status: **COMPLETE — CONCERNS RECORDED**

Audit context: Growth Compass — Version 1 Beta, private single-user Beta moving toward future multi-user/public readiness.

## Overall assessment

The D1 layer is disciplined for the current Beta: Version 1 persistence is profile-scoped in normal application paths, migration evolution is mostly additive, factual Progress is separated from planned intent, historical compatibility is retained, and multi-statement Plan/Capacity versioning uses D1 transactional `batch()` behavior.

The principal weakness is defense in depth: several relational invariants — especially **same-profile parent/child relationships** — are enforced by application/public-contract code rather than by database constraints. That is acceptable for the current owner-only Beta, but is a **public/multi-user hardening blocker**.

## D1-1 — Normal Version 1 persistence is consistently profile-scoped

**Status:** PASS  
**Severity:** —

Evidence reviewed:

- Areas, Goals, Activities, Plans, Capacity, Progress, Daily Plan, Journal and Wellbeing persistence all bind `profile_id` for profile-owned reads and writes.
- Goals validate `area_id` through the profile-scoped Areas public contract.
- Activities validate `goal_id` through the profile-scoped Goals public contract.
- Plans accept only Goal references returned for the current profile.
- Progress writes resolve Activity identity through the profile-scoped Activities public contract and derive Goal/Activity IDs from that reference.
- Legacy `sessions` reads are explicitly limited to the original `default` profile.

This is a strong application-level isolation baseline.

## D1-2 — Cross-profile relational integrity is not database-enforced

**Status:** CONCERN  
**Severity:** HIGH  
**Release impact:** public/multi-user launch blocker

Representative schema relationships are keyed only by the referenced row ID:

- `goals.area_id -> areas(id)`;
- `goal_activities.goal_id -> goals(id)`;
- `goal_plan_values.goal_id -> goals(id)`;
- `progress_records.goal_id -> goals(id)`;
- `progress_records.activity_id -> goal_activities(id)`.

The database therefore proves that a referenced row exists, but not that it belongs to the same profile as the child row/plan version.

Normal API paths currently prevent cross-profile references through public-contract validation. The remaining risk is a future route bug, import/repair process, migration, administrative tool, or new persistence path that bypasses that validation.

### Required hardening design

Before multi-user/public release, design one coherent migration/model change that enforces same-profile relationships at the database boundary. Likely options include composite unique keys and composite foreign keys such as `(profile_id, id)`, or equivalent profile-owned surrogate relationships.

Do **not** add isolated composite constraints one table at a time without applying the full migration chain to isolated D1 integration tests first.

The same hardening should also verify that a Progress `activity_id` and `goal_id` cannot describe two unrelated entities.

## D1-3 — Schema/SQL execution is not covered by isolated D1 integration tests

**Status:** CONCERN  
**Severity:** HIGH  
**Release impact:** public-launch blocker; important before substantial schema work

This is the data-layer manifestation of Phase 3 finding T4.

Current gates inspect migration SQL, table ownership and persistence source, but they do not execute the complete migration chain against isolated D1 storage in CI.

Required before major public-release data hardening:

1. create an isolated D1 test database/storage per test run;
2. apply migrations `0001` through current head exactly as shipped;
3. run `PRAGMA quick_check` and `PRAGMA foreign_key_check`;
4. execute representative HTTP CRUD for the core capability chain and independent modules;
5. prove cross-profile rejection/isolation;
6. test version-history and deletion/archive behavior;
7. reset isolated storage between tests.

Do not substitute a handwritten fake D1 for this layer.

## D1-4 — Migration evolution preserves compatibility/history well

**Status:** PASS with legacy debt  
**Severity:** —

Evidence:

- `0002` is explicitly additive to the original Beta schema.
- `0003` adds Capacity versioning fields and backfills existing logical series IDs.
- `0004` adds Daily Plan independently from Progress.
- `0005` adds Journal independently from Progress/Insights.
- `0006` performs explicit one-time Activity identity normalization while retaining legacy compatibility.
- `0007` creates profile-scoped Wellbeing energy observations and copies original Beta energy history rather than replacing/deleting it.
- canonical Progress keeps `goal_id` and `activity_id` nullable with `ON DELETE SET NULL`, protecting factual rows from accidental parent deletion.
- Areas, Goals and Activities use archive semantics in normal Version 1 UI/API behavior rather than hard deletion.

Legacy founder-specific data in `0001`/`0002` is historical migration debt, not a model to repeat for future user creation.

## D1-5 — Plan and Capacity history mutations use transactional batches

**Status:** PASS  
**Severity:** —

`savePlanVersion()` groups version/value changes in `DB.batch()`. Capacity effective-dated versioning similarly closes the previous row and creates the new row in one batch.

Cloudflare D1 documents batched statements as transactional: a failing statement aborts/rolls back the sequence. This matches the application's historical-versioning requirement.

The Plan route also validates Goal references and value ranges before entering persistence.

## D1-6 — Capacity `series_id` is an application invariant, not a schema invariant

**Status:** CONCERN  
**Severity:** LOW

Migration `0003` adds nullable `series_id` and backfills existing rows. Normal create/version paths always supply a series ID, so the live application invariant is sound. The column itself is still nullable, meaning direct/import/future paths can create an invalid version-series row.

Consider making the invariant database-enforced during a future Capacity-owned migration once isolated D1 migration tests exist.

## D1-7 — Several semantic/date/JSON constraints are application-only

**Status:** CONCERN  
**Severity:** LOW to MEDIUM

Examples:

- many civil-date fields are `TEXT` without an ISO-date CHECK constraint;
- `daily_minutes_json` and `tags_json` are text without `json_valid(...)` constraints;
- Goal target/minimum relationships are validated by route/domain code rather than CHECK constraints;
- Plan target/minimum relationships are similarly application-validated.

The routes currently normalize/validate these values, and D1 supports SQLite JSON functions. Database-level checks would improve defense in depth, but should be added only where they remain compatible with existing data and real D1 integration tests.

## D1-8 — Index coverage is generally aligned with current access paths

**Status:** PASS with future performance review  
**Severity:** —

Useful composite/indexed shapes already include:

- Areas: profile + active + sort order;
- Goals: profile + status + sort order;
- Plan versions: profile + effective dates;
- Capacity: profile + active + sort order, plus profile + series + effective dates;
- Progress: profile + occurred date, Goal/date and Activity/date;
- Daily Plan: profile + date + status + order;
- Journal: profile + date;
- Wellbeing observations: profile/date primary keys.

No speculative index migration is justified during this audit. Journal substring search and future large-history queries should be revisited in the Performance phase with real D1 query/insight evidence.

## D1-9 — Historical founder seed data must not become the future account bootstrap model

**Status:** CONCERN  
**Severity:** MEDIUM  
**Release impact:** resolve as identity/onboarding becomes multi-user

`0001` and `0002` contain founder/default-profile seed data and personal planning values. That is understandable historical Beta bootstrap, and runtime gates already isolate compatibility data to `default`.

For public account/profile creation, user-specific data must come from an explicit onboarding/profile service, not from schema migrations. Reusable template/reference data such as `area_templates` may remain platform-owned, but personal Goals, Capacity commitments and profile names must not be migration-driven for new users.

## D1-10 — Migration/recovery procedure was undocumented as a repository contract

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

Added `docs/D1_MIGRATION_RUNBOOK.md` during this audit. It now requires:

- exact reviewed migration list;
- preview-first application;
- pre-migration Time Travel bookmark;
- no automatic migration in the preview deploy workflow;
- post-migration `PRAGMA quick_check`;
- `PRAGMA foreign_key_check`;
- `PRAGMA optimize` after schema/index changes, followed by another integrity check;
- human preview validation;
- explicit production approval;
- recorded rollback/recovery procedure.

Cloudflare documents Time Travel as point-in-time recovery and provides a previous bookmark when restoring so the restore itself can be reversed. D1 also documents `PRAGMA quick_check`, `PRAGMA foreign_key_check`, and recommends `PRAGMA optimize` after schema changes.

## D1-11 — Production migration state remains intentionally behind preview

**Status:** PASS / intentional release gate

Current known state:

- preview has `0006_activities_contract.sql` and `0007_wellbeing_energy.sql` applied;
- production still intentionally has `0006` and `0007` pending;
- this audit does not authorize or apply those production migrations;
- automatic preview deploys refuse to run when preview migrations are pending.

This environment separation is correct while UX/engineering acceptance is still in progress.

## Phase 4 decision

**Continue with D1; do not redesign the persistence platform.**

The two pre-public priorities are:

1. real isolated Worker+D1 migration/CRUD integration testing;
2. database-enforced same-profile relational integrity before multi-user exposure.

The existing additive/versioned approach, preview-first workflow, Time Travel recovery model and profile-filtered application paths should be retained.
