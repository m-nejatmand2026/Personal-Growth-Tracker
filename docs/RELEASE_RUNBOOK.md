# Growth Compass production release runbook

Status: mandatory release procedure for **Growth Compass — Version 1 Beta**.

Production is intentionally not continuous deployment during Beta validation. This runbook is the explicit path from an accepted Preview checkpoint to a production release.

It does not authorize a release by itself. Product/UX acceptance and explicit release approval are required.

## Release invariants

1. Feature/product code reaches production only through an explicitly accepted release checkpoint.
2. Automatic GitHub workflows never deploy production and never apply D1 migrations.
3. Preview must prove the exact candidate behavior before production.
4. Production D1 migration and production Worker deployment are separate explicit operations.
5. Record a recoverable database checkpoint before production schema/data changes.
6. Record both Git SHA and Cloudflare Worker Version ID for the release.
7. Do not deploy a Worker version that is incompatible with the current production D1 schema.
8. Do not use ambiguous commands such as `npm run deploy`; production-intent scripts/commands are explicitly named.
9. Cloudflare Access must remain enabled for the owner-only private Beta.
10. A failed release step stops the sequence; do not continue merely to "finish deployment."

## Current production baseline

Production Worker:

`personal-growth-tracker`

Production D1:

- name: `personal-growth-tracker`
- ID: `a182d8c8-c009-461e-ac7e-04694c1047ab`

Preview Worker/D1 are different resources. Verify exact IDs from `wrangler.jsonc` and the release gate; never infer them from memory alone.

## 1. Freeze the candidate

Before production approval:

- choose the exact feature/PR SHA;
- ensure no unreviewed changes are still arriving at that checkpoint;
- Quality must pass on that exact SHA;
- automatic Preview deployment for that SHA must pass;
- record the Preview Worker Version ID;
- human acceptance must cover the release-specific UX/behavior when applicable;
- review unresolved audit blockers that apply to this release scope.

If migrations are part of the candidate, Preview must already have them applied and validated according to `D1_MIGRATION_RUNBOOK.md`.

## 2. Final PR review

Review PR scope before merge/release:

- architecture/module boundaries;
- migration files and ownership;
- security/privacy impact;
- user-facing behavior;
- operational/runbook changes;
- test/CI changes;
- compatibility debt/sunset changes;
- accidental environment/config differences.

PR #6 remains draft until explicit acceptance. Do not mark it ready/merge solely because the engineering audit is green.

## 3. Confirm production migration state

List pending production migrations:

```sh
npx --yes wrangler@4.123.0 d1 migrations list DB --remote
```

Compare the exact result with the reviewed release plan.

If **no production migration** is required, skip to Worker dry-run after confirming the application remains compatible with the current production schema.

If migrations are required, continue through the D1 gate below.

## 4. Production D1 safety checkpoint — migrations only

Follow `docs/D1_MIGRATION_RUNBOOK.md` exactly.

At minimum:

```sh
npx --yes wrangler@4.123.0 d1 time-travel info DB
```

Record the pre-migration bookmark.

Then apply only the reviewed migrations:

```sh
npm run db:migrate:production
```

Immediately verify:

```sh
npx --yes wrangler@4.123.0 d1 migrations list DB --remote
npx --yes wrangler@4.123.0 d1 execute DB --remote --command="PRAGMA quick_check;"
npx --yes wrangler@4.123.0 d1 execute DB --remote --command="PRAGMA foreign_key_check;"
```

If a migration or integrity check fails, stop and follow the recovery decision process. Do not deploy the Worker blindly after a failed database step.

## 5. Production Worker dry-run

From the exact accepted release commit/config:

```sh
npx --yes wrangler@4.123.0 deploy --dry-run --name personal-growth-tracker
```

Verify:

- Worker name is `personal-growth-tracker`;
- D1 binding is the production database;
- expected asset count/config is present;
- no Preview database ID/Worker target appears;
- no unexpected binding/secret/environment change appears.

A dry-run is not a deployment.

## 6. Explicit production deployment

Only after the previous gates pass and release is explicitly approved:

```sh
npm run deploy:production -- --message "git:<FULL_RELEASE_SHA>"
```

Alternatively use the equivalent pinned Wrangler command directly.

Record from deployment output:

- production URL;
- Cloudflare Worker Version ID;
- full release Git SHA;
- deployment time;
- any schema migrations applied in the same release.

## 7. Authenticated production smoke validation

Production remains behind Cloudflare Access during the owner-only Beta.

Verify:

1. signed-out/private-window root access requires authentication;
2. signed-out/private-window private API access cannot expose data;
3. authenticated root UI loads;
4. authenticated `/api/health` returns `status=ok` and `database=ok`;
5. the release-specific user flow works;
6. one unrelated read flow works;
7. no new 5xx pattern appears in Workers Logs.

Avoid creating/deleting personal factual data merely as a smoke test when read-only evidence is sufficient.

## 8. Release record

For every meaningful production release, record:

- release name/version;
- exact Git SHA;
- PR(s);
- Quality run;
- Preview Worker Version ID;
- production Worker Version ID;
- migration list/state;
- pre-migration Time Travel bookmark when applicable;
- smoke-test result;
- known accepted risks/rollback notes.

Before public/general release, use an immutable Git tag and GitHub Release for accepted production checkpoints. Do not create a tag merely for every Preview deploy.

## 9. Rollback decision

Worker rollback and D1 restore are separate operations.

See `OPERATIONS_RUNBOOK.md` for Worker rollback and `D1_MIGRATION_RUNBOOK.md` for Time Travel recovery.

Before rolling back Worker code, confirm the older Worker is compatible with the currently deployed schema.

Before restoring D1, determine what Worker version will be compatible with the restored schema/data.

Do not assume "roll everything back" is one atomic operation.

## 10. Branch/repository governance

Before broader collaboration/public production releases, configure a GitHub ruleset/branch protection policy for `main` that at minimum:

- requires changes through a pull request for product code;
- requires the intended Quality/status check(s);
- prevents accidental force-push/deletion;
- restricts direct writes/bypasses to deliberate administrators;
- keeps the trusted Preview deployment workflow maintainable without turning it into a production backdoor.

The current repository is owner-controlled and `main` is not yet protected. This is an explicit pre-broader-release engineering task, not a hidden assumption.

## Private-Beta note

This runbook preserves the current conservative posture:

- Preview can deploy automatically after Quality;
- production cannot;
- Preview CI has no D1 Write permission;
- Preview CI service-token access is not production deployment authority;
- external-user onboarding/application-level multi-user identity remains deferred.
