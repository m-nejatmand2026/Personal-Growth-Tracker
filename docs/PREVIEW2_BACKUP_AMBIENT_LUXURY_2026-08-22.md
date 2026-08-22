# Preview 2 — Ambient Luxury Snapshot (2026-08-22)

Backup key: `preview2-ambient-luxury-2026-08-22`

Purpose: preserve the currently deployed Preview 2 interface before the Warm Editorial Instrument / growth-composition redesign replaces it.

## Isolation

This backup is for Preview 2 only:

- Worker: `personal-growth-tracker-preview2`
- D1: `personal-growth-tracker-preview2`
- Branch: `feature/experience-v2`
- Draft PR: #7

Never use this backup against Preview 1 or Production.

## What the guarded deployment captures before replacement

Before it is allowed to migrate or deploy, the Preview 2 deploy job must successfully capture:

1. Current active Preview 2 Worker deployment identity.
2. Current Worker version ID(s) used by that deployment.
3. Current Worker deployment message, including the prior Git commit when available.
4. Current Preview 2 D1 Time Travel bookmark.
5. A human-readable `RESTORE.txt` and machine-readable `restore-manifest.json`.

The non-sensitive rollback manifest is uploaded as a GitHub Actions artifact named:

`preview2-ambient-luxury-2026-08-22-<workflow-run-id>`

The artifact is retained for 90 days.

## Why there is no raw D1 SQL artifact here

This repository is public. A raw D1 export can contain private user data, so it must not be uploaded to a public-repository Actions artifact or committed to Git.

For the immediate redesign rollback window, the database recovery point is Cloudflare D1 Time Travel. Cloudflare maintains Time Travel independently of Worker versions and can restore the isolated Preview 2 database to the recorded bookmark while that bookmark remains within the account's Time Travel retention window.

The interface itself remains recoverable long-term from the recorded Worker version and, when present, the prior `git:<sha>` deployment message. The overnight work does not introduce a new D1 migration, so bringing the prior interface back should normally require only a Worker/interface rollback, not a database rollback.

If a long-term portable database archive is later required, it must be exported to a genuinely private storage destination rather than this public repository.

## Restore strategy

### Worker/interface rollback

Prefer Cloudflare Workers version rollback using the recorded Worker version ID. This restores the prior Worker code, static assets, bindings, and compatibility settings without changing D1 data.

If the deployment manifest includes a prior `git:<sha>` message, that commit is an additional long-term code-level recovery reference.

### Database rollback

Do not restore D1 merely to undo an interface redesign. Worker rollback and D1 rollback are separate operations.

Only if the Preview 2 database itself must return to the exact pre-redesign state, restore the isolated Preview 2 D1 using the recorded Time Travel bookmark. This overwrites the current Preview 2 database and is intentionally a separate, explicit recovery action.

## Recovery order

1. Verify the target is exactly `personal-growth-tracker-preview2`.
2. Restore/rollback the Worker first.
3. Verify the Preview 2 interface and API behavior.
4. Restore D1 only if data state also needs to be reverted and the bookmark remains valid.
5. Re-run Preview 2 smoke and isolation verification.

## Safety rule

A redesigned Preview 2 deployment must not proceed unless the rollback identity and D1 Time Travel bookmark are captured first. If either cannot be captured, deployment fails closed.
