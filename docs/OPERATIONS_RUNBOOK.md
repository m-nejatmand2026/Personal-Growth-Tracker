# Growth Compass operations runbook

Status: active operational procedure for **Growth Compass — Version 1 Beta**.

This runbook covers Worker/preview incidents, deployment diagnosis and rollback. Database migration/recovery remains governed by `docs/D1_MIGRATION_RUNBOOK.md`.

## Operational boundaries

Current environments:

- production Worker: `personal-growth-tracker`
- preview Worker: `personal-growth-tracker-preview`
- production D1: `personal-growth-tracker` / `a182d8c8-c009-461e-ac7e-04694c1047ab`
- preview D1: `personal-growth-tracker-preview` / `1937971c-f2f2-4dad-bc65-3d22952584bb`

Both stable Worker URLs are protected by Cloudflare Access during the owner-only Beta.

Normal preview delivery is automatic:

`feature change -> Quality -> Deploy Preview -> Access check -> UI + D1 health smoke`

Production remains an explicit release action and is never part of this automatic workflow.

## Observability contract

`wrangler.jsonc` explicitly enables Workers Logs for production and preview with full head sampling during the current low-traffic private Beta.

Server-side API failures use structured JSON custom logs only for 5xx failures. The current fields are:

- `event = api_error`
- request `path`
- HTTP `method`
- HTTP `status`
- `error_name`
- server-side `message`
- Cloudflare `ray_id` when available

Do not add request bodies, Journal text, Wellbeing observations, profile payloads, Access credentials, API tokens or other private user content to operational logs.

Expected 4xx validation/client errors are not copied into custom error logs. Their request status remains visible through platform invocation/request telemetry.

## Data-free health check

The platform owns:

`GET /api/health`

It does not resolve a profile or read business-module tables. It verifies the D1 binding using only:

`SELECT 1 AS ok`

Healthy response:

```json
{
  "status": "ok",
  "database": "ok"
}
```

The route is still protected by Cloudflare Access because the Worker is protected for **All traffic**. It is an operational endpoint, not a public unauthenticated status page.

Preview CI uses this endpoint instead of a user-owned business route, so deployment verification does not need to read Areas, Goals, Journal, Progress or other profile data.

## Deployment traceability

Every automatic preview deployment must be traceable in two directions:

1. GitHub Quality checks out the exact pull-request head SHA.
2. Deploy Preview checks out that same `workflow_run.head_sha`.
3. Wrangler deploys the preview Worker with version message:
   `git:<full-sha>`
4. The GitHub Actions run records the resulting Cloudflare Worker Version ID.

When diagnosing a deployment, record both:

- Git SHA;
- Cloudflare Worker Version ID.

Do not diagnose only from a timestamp or the phrase "latest deployment."

## Preview incident checklist

When Preview behaves unexpectedly:

1. **Stop further changes** if a deploy, migration or data operation is still in progress.
2. Classify the symptom first:
   - Cloudflare Access/authentication;
   - Worker/API;
   - static asset/client;
   - D1/database;
   - deployment/CI.
3. Record:
   - affected URL/path;
   - approximate time;
   - Git SHA;
   - Worker Version ID;
   - Cloudflare Ray ID when available;
   - relevant GitHub Quality/Deploy Preview run IDs.
4. Check the latest GitHub `Quality` result.
5. Check the latest `Deploy Preview` result and identify the first failed step.
6. In Cloudflare Worker Observability/Logs, search the incident time window and relevant path/Ray ID. For API server failures, filter for `event = api_error` where available.
7. If D1 is suspected:
   - call the authenticated `/api/health` endpoint;
   - inspect pending migrations;
   - use `PRAGMA quick_check` / `PRAGMA foreign_key_check` when database integrity is in question.
8. Decide separately whether recovery requires:
   - a forward code fix;
   - a Worker rollback;
   - a D1 recovery action.
9. After recovery, rerun the relevant smoke checks and verify one unrelated application area when practical.
10. Record the root cause and permanent regression guard before considering the incident closed.

## Worker rollback

A Worker code rollback and a D1 database restore are **different operations**.

Do not roll back Worker code to a version that is incompatible with the currently bound D1 schema.

### Preview Worker

First identify the known-good Version ID from Cloudflare deployment/version history. Confirm its Git message/SHA and schema compatibility.

Then, if rollback is the safer recovery:

```sh
npx --yes wrangler@4.123.0 rollback <VERSION_ID> --name personal-growth-tracker-preview --message "rollback: <reason>"
```

After rollback:

- verify Cloudflare Access still blocks anonymous access;
- verify the root UI;
- verify authenticated `/api/health`;
- verify the affected user flow.

### Production Worker

Production rollback requires explicit release/incident approval. Never perform it merely because Preview failed.

If an approved production rollback is needed:

```sh
npx --yes wrangler@4.123.0 rollback <VERSION_ID> --name personal-growth-tracker --message "rollback: <reason>"
```

Before executing, confirm the target version is compatible with the current production D1 schema and bindings.

## D1 failure and recovery

For migration failure, corruption suspicion, Time Travel bookmarks, restore decisions and integrity checks, use:

`docs/D1_MIGRATION_RUNBOOK.md`

Important separation:

- Worker rollback does not undo a D1 migration or data change.
- D1 Time Travel restore does not select an older Worker version.
- When both layers changed, determine a compatible Worker + schema pair before recovery.

A real Preview Time Travel restore drill has not yet been performed as part of this audit. Perform and document a controlled non-production recovery drill before public release or before especially risky schema/data work.

## Production smoke-test plan

Production has no CI service token during the current owner-only Beta. That is intentional: normal automation has no production deployment authority.

After an explicitly approved production release, authenticate as the owner and verify at minimum:

1. anonymous/private-window access is blocked by Cloudflare Access;
2. authenticated root UI loads;
3. authenticated `/api/health` returns `status=ok` and `database=ok`;
4. the release-specific user flow works;
5. one unrelated read flow still works;
6. no new 5xx pattern appears in Workers Logs.

Any production mutation used as a smoke test must be intentional and reversible; prefer reads where possible.

## Client-side failures

The browser currently receives normalized API error messages through `public/js/core/api.js`, but there is no client telemetry service and no automatic frontend error reporting.

That is acceptable for the current owner-only Beta. Before broader/public use, improve the client error model so offline/network, authentication, validation and server failures can be distinguished without exposing private content. Any future client telemetry must receive an explicit privacy review before collection is enabled.

## Alerting and tracing

Do not add third-party monitoring merely to increase tool count.

For the current low-traffic private Beta:

- Workers Logs + GitHub Actions + health checks are the primary operational evidence;
- automatic distributed tracing is not required yet;
- alerting thresholds have not been established because there is not yet a meaningful traffic/error baseline.

Revisit tracing, alerting and retention once usage grows enough to define useful service objectives and error-rate thresholds.

## Incident closure criteria

An incident is closed only when:

- service/data state is known and stable;
- the current Worker Version ID and Git SHA are recorded;
- D1 state/integrity is known when relevant;
- Access protection remains in force;
- the affected flow is verified;
- the cause is documented;
- a regression test, operational guard or explicit accepted-risk decision exists where appropriate.
