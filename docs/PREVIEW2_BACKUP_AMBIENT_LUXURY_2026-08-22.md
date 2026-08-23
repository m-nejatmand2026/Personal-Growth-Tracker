# Preview 2 — Ambient Luxury Snapshot (2026-08-22)

Backup key: `preview2-ambient-luxury-2026-08-22`

Purpose: preserve the Preview 2 interface that was serving immediately before the Warm Editorial Instrument / growth-composition redesign replaced it.

## Isolation

This backup is for Preview 2 only:

- Worker: `personal-growth-tracker-preview2`
- D1: `personal-growth-tracker-preview2`
- Branch: `feature/experience-v2`
- Draft PR: #7

Never use this backup against Preview 1 or Production.

## Captured rollback snapshot

The guarded Preview 2 deployment captured this snapshot before any migration or replacement deployment:

- Backup display name: `Preview 2 — Ambient Luxury Snapshot (2026-08-22)`
- Captured UTC: `2026-08-23T03:39:58.304Z`
- Worker deployment ID: `4321faaf-2f52-4668-b5d6-46c72eec99c0`
- Worker version ID: `7ab142c7-226f-4895-86b5-6407c98da597`
- Worker deployment message: `git:0619e178175a378298b9011f00e48ee839dc3558`
- Durable Git recovery commit: `0619e178175a378298b9011f00e48ee839dc3558`
- Original Worker deployment created at: `2026-08-22T20:19:42.824103Z`
- D1 Time Travel bookmark: `000000c2-00000000-000050d0-74299128587f62078ac71b082a536e00`
- GitHub Actions artifact: `preview2-ambient-luxury-2026-08-22-32615651459`
- Artifact retention expiry: `2026-11-21T03:33:34Z`

The Worker version and Git commit are the durable interface recovery references. The D1 Time Travel bookmark is intentionally temporary and is valid only while it remains inside Cloudflare's Time Travel retention window.

## What the guarded deployment captures before replacement

Before it is allowed to migrate or deploy, the Preview 2 deploy job must successfully capture:

1. Current active Preview 2 Worker deployment identity.
2. Current Worker version ID(s) used by that deployment.
3. Current Worker deployment message, including the prior Git commit when available.
4. Current Preview 2 D1 Time Travel bookmark.
5. A human-readable `RESTORE.txt` and machine-readable `restore-manifest.json`.

The rollback manifest is uploaded as a GitHub Actions artifact named:

`preview2-ambient-luxury-2026-08-22-<workflow-run-id>`

The artifact is retained for 90 days. It contains rollback identifiers only; it never contains a raw SQL export, application records, authentication secrets, or user content.

## Why there is no raw D1 SQL artifact here

This repository is public. A raw D1 export can contain private user data, so it must not be uploaded to a public-repository Actions artifact or committed to Git.

For the immediate redesign rollback window, the database recovery point is Cloudflare D1 Time Travel. Cloudflare maintains Time Travel independently of Worker versions and can restore the isolated Preview 2 database to the recorded bookmark while that bookmark remains within the account's Time Travel retention window.

Cloudflare also supports restoring D1 by timestamp. The deployment capture time is therefore an additional recovery locator within the Time Travel retention window even if the generated bookmark is not at hand.

The interface itself remains recoverable long-term from Worker version `7ab142c7-226f-4895-86b5-6407c98da597` and Git commit `0619e178175a378298b9011f00e48ee839dc3558`.

The redesign did not introduce a migration beyond the already-authorized Preview 2 migration set, so bringing the prior interface back should normally require only a Worker/interface rollback, not a database rollback.

A genuinely complete long-term portable database archive still requires a private storage destination outside this public repository. Until such a destination is configured, do not describe the D1 backup as permanent.

## Restore strategy

### Worker/interface rollback

Preferred operational rollback:

1. Target only Worker `personal-growth-tracker-preview2`.
2. Roll back to Worker version `7ab142c7-226f-4895-86b5-6407c98da597` (captured from deployment `4321faaf-2f52-4668-b5d6-46c72eec99c0`).
3. Verify the canonical Preview 2 origin and isolated D1 health.
4. Re-run Preview 2 remote smoke/isolation checks.

Long-term code fallback: redeploy the Preview 2 Worker from Git commit `0619e178175a378298b9011f00e48ee839dc3558` using the same isolated Preview 2 bindings and guarded Preview 2 release procedure. Do not deploy that commit to Preview 1 or Production.

### Database rollback

Do not restore D1 merely to undo an interface redesign. Worker rollback and D1 rollback are separate operations.

Only if the Preview 2 database itself must return to the exact pre-redesign state, restore isolated D1 `personal-growth-tracker-preview2` using bookmark `000000c2-00000000-000050d0-74299128587f62078ac71b082a536e00` (or capture timestamp `2026-08-23T03:39:58.304Z`) while it remains inside Cloudflare's Time Travel retention window. This overwrites the current Preview 2 database and is intentionally a separate, explicit recovery action.

## Recovery order

1. Verify the target is exactly `personal-growth-tracker-preview2`.
2. Restore/rollback the Worker first.
3. Verify the Preview 2 interface and API behavior.
4. Restore D1 only if data state also needs to be reverted and the Time Travel recovery point remains valid.
5. Re-run Preview 2 smoke and isolation verification.

## Safety rule

A redesigned Preview 2 deployment must not proceed unless the rollback identity and D1 Time Travel recovery point are captured first. If either cannot be captured, deployment fails closed.
