# Preview 2 — Ambient Luxury Snapshot (2026-08-22)

Backup key: `preview2-ambient-luxury-2026-08-22`

Purpose: preserve the currently deployed Preview 2 before the Warm Editorial Instrument / growth-composition redesign replaces it.

## Isolation

This backup is for Preview 2 only:

- Worker: `personal-growth-tracker-preview2`
- D1: `personal-growth-tracker-preview2`
- Branch: `feature/experience-v2`
- Draft PR: #7

Never use this backup against Preview 1 or Production.

## What the guarded deployment captures before replacement

The Preview 2 deploy job must successfully create all of the following before it is allowed to migrate or deploy:

1. Current active Preview 2 Worker deployment identity.
2. Current Worker version ID(s) used by that deployment.
3. Current Worker deployment message, including the prior Git commit when available.
4. Current Preview 2 D1 Time Travel bookmark.
5. Full remote Preview 2 D1 schema + data export as `d1-full.sql`.
6. A human-readable `RESTORE.txt` and machine-readable `restore-manifest.json`.

These files are uploaded as a GitHub Actions artifact named:

`preview2-ambient-luxury-2026-08-22-<workflow-run-id>`

The artifact is retained for 90 days. Database contents are never committed to this public repository.

## Restore strategy

### Worker/interface rollback

Prefer Cloudflare Workers version rollback using the recorded Worker version ID. This restores the prior Worker code, static assets, bindings, and compatibility settings without changing D1 data.

If the deployment manifest includes a prior `git:<sha>` message, that commit is an additional code-level recovery reference.

### Database rollback

Do not restore D1 merely to undo an interface redesign. Worker rollback and D1 rollback are separate operations.

Only if the Preview 2 database itself must return to the exact pre-redesign state, restore the isolated Preview 2 D1 using the recorded Time Travel bookmark. This overwrites the current Preview 2 database and is therefore intentionally a separate, explicit recovery action.

The exported `d1-full.sql` is the longer-lived portable database backup stored in the private Actions artifact.

## Recovery order

1. Verify the target is exactly `personal-growth-tracker-preview2`.
2. Restore/rollback the Worker first.
3. Verify the Preview 2 interface and API behavior.
4. Restore D1 only if data state also needs to be reverted.
5. Re-run Preview 2 smoke and isolation verification.

## Safety rule

A redesigned Preview 2 deployment must not proceed unless the backup artifact step succeeds. If Worker identity, D1 bookmark, or SQL export cannot be captured, deployment fails closed.
