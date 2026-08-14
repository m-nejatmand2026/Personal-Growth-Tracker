# Engineering audit — Phase 6: Observability and operations

Status: **COMPLETE — CORE PRIVATE-BETA OPERATIONS HARDENED; CONCERNS RECORDED**

Audit context: Growth Compass — Version 1 Beta, owner-only private Beta behind Cloudflare Access.

## Overall assessment

The project already had useful GitHub deployment history, Cloudflare Worker versions, preview smoke testing and a strong D1 migration runbook, but operational evidence was fragmented. Worker logging was minimal, Preview smoke testing read a user-owned Areas endpoint, deployment versions were not directly labelled with their Git SHA, and Worker rollback/incident handling was not formalized.

This phase hardens those gaps without changing Growth Compass business behavior. Workers Logs are now explicit configuration, 5xx logs carry structured operational context without request/profile payloads, Preview has a platform-owned data-free D1 health endpoint, automatic deployments stamp the exact Git SHA into Cloudflare version history, and an incident/rollback runbook now separates Worker rollback from D1 recovery.

The remaining concerns are primarily pre-public operational maturity: a controlled D1 restore drill has not been executed, browser-side failure observability is minimal, and meaningful alerting/service thresholds do not yet have a traffic baseline.

---

## O1 — Workers Logs persistence was not explicit in repository configuration

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM  
**Release impact:** resolved for current environments

Observed issue:

- `wrangler.jsonc` previously contained no explicit `observability` contract;
- the repository therefore did not prove whether persistent Worker logging should remain enabled if account/platform defaults changed or an environment was recreated.

Remediation:

- top-level production configuration now explicitly sets `observability.enabled = true`;
- preview explicitly sets the same environment contract;
- current private-Beta head sampling is `1` so the low-volume environment retains full Worker log evidence;
- preview deployment safety tests fail if this configuration is removed.

Assessment:

Full sampling is appropriate for the present low-traffic owner-only Beta. Revisit sampling/retention when real usage creates meaningful cost, privacy and volume tradeoffs rather than optimizing prematurely.

## O2 — Custom API error logging lacked enough operational context and logged expected client errors

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

Observed issue:

The Worker logged every thrown API error with only:

- event;
- path;
- method;
- message.

That meant expected 4xx validation failures generated custom error noise, while server failures lacked status and request-correlation context.

Remediation:

- custom `api_error` logs are now reserved for 5xx server failures;
- logs include `path`, `method`, `status`, `error_name`, server-side message and Cloudflare `cf-ray` when available;
- request bodies and profile/business payloads are not logged;
- runtime tests prove malformed JSON produces a controlled 400 without a custom error log;
- runtime tests prove unexpected failures return only `Unexpected server error` to the client while recording operational context server-side.

Privacy note:

Future logging changes must not add Journal body text, Wellbeing data, Access credentials, profile exports or other private user content merely to make diagnosis easier.

## O3 — Cloudflare Worker versions were not directly mapped to the exact Git SHA

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

The GitHub workflow already deployed the exact Quality-tested SHA, but Cloudflare deployment/version history did not carry that SHA as explicit version metadata.

Remediation:

Automatic Preview deploy now runs Wrangler with:

`--message "git:$TESTED_SHA"`

The workflow also continues to verify that the checked-out commit equals `workflow_run.head_sha` before credentials are used.

Operational result:

A Preview incident can now be traced from GitHub SHA → Deploy Preview run → Cloudflare Worker Version ID/message and back without relying only on timestamps.

## O4 — Preview smoke testing used a user-owned business route

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

Observed issue:

The post-deploy smoke check used `/api/v1/areas`. That was read-only and useful, but operational health should not depend on one business module or unnecessarily return profile data to a CI runner.

Remediation:

A platform-owned endpoint now exists:

`GET /api/health`

It:

- does not resolve a profile;
- does not read module tables;
- executes only `SELECT 1 AS ok` through the bound D1 database;
- returns only `status=ok` and `database=ok`;
- remains protected by Cloudflare Access because the whole Worker is protected.

Automatic Preview smoke now:

1. proves anonymous `/api/health` access is blocked by Access;
2. authenticates with the dedicated Preview CI service token;
3. verifies the root UI contains Growth Compass;
4. verifies `/api/health` confirms the D1 binding.

The deployment safety test explicitly rejects a return to `/api/v1/areas` for this operational smoke path.

## O5 — Worker rollback and incident response were conversation knowledge rather than an engineering procedure

**Status:** PASS for documented procedure  
**Severity before remediation:** MEDIUM

Remediation:

`docs/OPERATIONS_RUNBOOK.md` now defines:

- incident classification and evidence capture;
- Workers Logs diagnosis;
- Git SHA + Worker Version ID traceability;
- Access verification;
- data-free health use;
- preview and production Worker rollback procedures;
- explicit separation between Worker rollback and D1 recovery;
- post-recovery verification;
- production smoke-test expectations.

Important invariant:

A Worker rollback does **not** revert D1 schema/data. A D1 Time Travel restore does **not** choose a Worker version. Any incident involving both must select a compatible code/schema pair deliberately.

## O6 — D1 backup/recovery procedure exists, but no controlled restore drill is recorded

**Status:** CONCERN  
**Severity:** MEDIUM  
**Release impact:** perform before public release and before especially risky production data/schema work

Evidence:

- `docs/D1_MIGRATION_RUNBOOK.md` defines Time Travel bookmarks, migration verification, quick/foreign-key checks and recovery decisions;
- Preview has previously recorded a Time Travel bookmark;
- however, this audit has not executed and documented a controlled Preview Time Travel restore-and-recover drill.

Risk:

A documented recovery command is not equivalent to practiced recovery. The first real restore should not occur during a production incident.

Required remediation:

Run a deliberate non-production drill at a stable checkpoint:

1. capture Preview bookmark and known data/checkpoint;
2. perform a controlled reversible change;
3. restore Preview using Time Travel;
4. record the returned previous bookmark;
5. run migration list, `quick_check`, `foreign_key_check` and application health;
6. verify representative application state;
7. document actual duration/failure modes.

Do not perform this drill while active UX validation would lose useful Preview data.

## O7 — Client-side error observability is intentionally minimal

**Status:** CONCERN  
**Severity:** MEDIUM before broader Beta/public use; LOW for current owner-only Beta

Evidence:

`public/js/core/api.js` currently converts non-2xx responses into an `Error` using the API error text or HTTP status. There is no richer typed failure model and no browser telemetry/error collection.

Consequences:

- offline/network failure, Access/session failure, validation failure and server failure are not represented as strongly differentiated platform states;
- user-facing modules may need to infer behavior from generic errors;
- remote client failures are not automatically correlated with Worker logs.

Recommendation before broader use:

Introduce a small platform-owned API error model with stable categories/status metadata, then audit module error states. Only consider client telemetry after an explicit privacy/data-minimization design; do not add a third-party monitoring SDK by default.

## O8 — No automated production smoke identity

**Status:** ACCEPTED CURRENT DESIGN  
**Severity:** LOW for private Beta

Production is intentionally outside continuous deployment and the dedicated Access service token is scoped to Preview. Production smoke testing therefore remains an explicit owner-authenticated release action.

This is safer than giving ordinary preview automation production access. Revisit only when a separately designed production release pipeline exists.

## O9 — Alerting and distributed tracing are not configured

**Status:** ACCEPTED / DEFERRED  
**Severity:** LOW now

The current owner-only Beta has no meaningful service-level baseline from which to derive useful alert thresholds. Workers Logs, GitHub Actions, health checks and Cloudflare version history provide adequate evidence for the current scale.

Do not add tracing/alerting merely for tool completeness. Reassess when traffic grows enough to define useful availability/error-rate objectives and retention/cost requirements.

## O10 — `main` currently has no GitHub branch protection

**Status:** CONCERN  
**Severity:** HIGH before collaborators/public contribution; MEDIUM in current owner-controlled repository  
**Release impact:** release-engineering blocker before broad contributor access

Evidence from the GitHub branch API during this audit:

- `main.protected = false`;
- required-status-check enforcement is off.

Current mitigating context:

- the repository is owner-controlled;
- product work is intentionally held in a draft PR;
- the only post-baseline `main` changes made during the audit are the trusted Preview workflow needed for `workflow_run` operation;
- there is no automatic production deployment.

Nevertheless, direct unreviewed writes to `main` are technically possible. Before collaborators, public contributions or production release automation, configure a GitHub ruleset/branch protection policy that requires the intended PR/check/review path and prevents accidental direct production-baseline changes.

This item will be revisited in Phase 11 — Release engineering.

## Verification checkpoint

Core Phase 6 code and workflow contract after trusted Preview-workflow history was synchronized:

- feature SHA: `aa1df4af21f6ecad8f9ff7bb361d7f5d5badcaec`
- Quality run #309
- **270 / 270 passing**

That Quality run checked out exactly the feature SHA above.

Final documentation commits after that checkpoint must also pass the full Quality gate before Phase 6 is considered frozen.

## Phase 6 decision

**Operational direction: continue.** The private Beta now has an appropriate lightweight operations foundation without introducing unnecessary monitoring infrastructure or leaking user data into CI/logging.

Before public/global release:

- execute a controlled Preview D1 recovery drill (O6);
- improve typed client failure handling before larger-user support burden (O7);
- protect `main` through a GitHub ruleset/branch policy before broader contribution/release automation (O10);
- revisit alerting/tracing only when usage supports meaningful thresholds.

Production Worker code and production D1 remain untouched by this phase.
