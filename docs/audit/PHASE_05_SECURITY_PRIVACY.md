# Engineering audit — Phase 5: Security and privacy

Status: **COMPLETE — CRITICAL LIVE-BETA FINDING REQUIRES ACTION**

Audit context: Growth Compass — Version 1 Beta. This phase evaluates the current owner-only Beta separately from the future public/multi-user product.

## Overall assessment

The codebase has several good security foundations: prepared D1 statements, bounded request bodies, strong output escaping in reviewed UI paths, least-privilege CI credentials, no secrets committed at the repository root, explicit privacy separation for Journal/Wellbeing/Wellness, and a newly hardened Worker response boundary.

However, the application itself currently has **no authentication or authorization boundary**. `resolveProfileId()` always returns `default`, and Version 1 plus legacy/export APIs are routed without proving an authenticated principal. The automatic preview smoke test successfully calls `/api/v1/areas` without credentials, proving that preview is reachable without application authentication. The production code baseline has the same identity implementation and export route.

This is a **critical live-Beta privacy/security issue** if the Worker is not already protected by an external Cloudflare Access policy or equivalent edge control. It is also an absolute blocker for multi-user/public release.

---

## S1 — No application authentication/authorization boundary

**Status:** FAIL  
**Severity:** CRITICAL  
**Release impact:** immediate live-Beta protection required; public launch blocked

Evidence:

- `worker/core/profile.js` exports `resolveProfileId()` which unconditionally returns `default`.
- Worker routing invokes Version 1, legacy compatibility and export handlers without authentication middleware.
- the feature and `main` code baselines share this identity resolver.
- automatic Preview smoke testing performs an unauthenticated GET to `/api/v1/areas` and succeeds.
- normal mutation routes similarly derive the profile from the same unconditional resolver.

Impact:

Unless an external edge policy is already active, anyone who can reach the Worker URL can act as the `default` profile through the API. This is not merely a future multi-user concern: the default profile is the real personal Beta profile.

### Immediate owner-only Beta mitigation

Protect both the production and preview Workers with **Cloudflare Access** (or an equivalent verified edge authentication policy) and allow only the owner's identity plus a dedicated CI service identity needed for automated preview smoke tests.

This is a perimeter protection for the current private Beta, not the future public-user authentication architecture.

After Access is enabled:

- unauthenticated browser/API requests must not reach Growth Compass data routes;
- automated preview smoke tests must authenticate with a dedicated Access service token stored only as GitHub Actions secrets;
- the service token must be scoped only to the preview application if practical;
- the smoke workflow must never log service credentials;
- Access enforcement must be tested from an unauthenticated request as well as an authenticated request.

Do not solve this by adding a hard-coded password or client-side-only login screen.

## S2 — Future authenticated principal → profile authorization is not designed yet

**Status:** CONCERN  
**Severity:** HIGH  
**Release impact:** public/multi-user launch blocker

Cloudflare Access is suitable as an immediate owner-only perimeter, but a public product needs an application identity model.

Required architecture before public release:

1. authenticate a user/principal server-side;
2. resolve the principal to one or more authorized profile IDs;
3. never accept an arbitrary profile ID from an untrusted client as authorization proof;
4. make every Version 1 route operate under the resolved principal/profile context;
5. provide explicit account/profile creation and lifecycle rather than migration-seeded personal data;
6. test horizontal authorization failures between two real profiles;
7. connect profile-owned module preferences to this same identity boundary;
8. design session expiry, logout, recovery and device/session revocation.

This finding is coupled to Architecture A2 and Data D1-2: identity, module preferences and same-profile database constraints should be designed coherently.

## S3 — `/api/export` exposes the most sensitive aggregate data surface

**Status:** FAIL until S1 is mitigated  
**Severity:** CRITICAL while unauthenticated; LOW after strong authorization

`worker/routes/export.js` composes a full profile export through module public contracts, including:

- profile data;
- Areas and Goals;
- Activities;
- Plan versions and values;
- Capacity commitments;
- Daily Plan items;
- Journal entries;
- factual Progress records;
- Wellbeing energy, sleep and day-context observations;
- legacy Beta compatibility data.

The export composition itself is architecturally good and profile-scoped. The security problem is that it inherits the missing identity boundary.

After authentication is implemented, keep export as a user-data ownership feature, but require the same strong authorization as all private APIs. Consider explicit download headers and audit/confirmation UX later; global `Cache-Control: no-store` is already applied by the Worker.

## S4 — Prepared statements and parameter binding are the normal persistence pattern

**Status:** PASS  
**Severity:** —

Representative module persistence reviewed during Phases 1–5 uses D1 `prepare(...).bind(...)` rather than concatenating user-provided values into SQL. Where numeric LIMIT values are interpolated, they are derived from bounded numeric normalization rather than raw request strings.

Architecture tests also scan module SQL ownership, reducing the chance that future direct SQL quietly bypasses module boundaries.

This audit found no direct request-to-SQL string interpolation in the reviewed Version 1 persistence paths. Real isolated D1 integration tests remain necessary to complement this static review.

## S5 — Request-body bounds and malformed JSON handling

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

Existing `readJsonBody()` already enforced a 64 KiB body limit by both declared `Content-Length` and streamed byte count.

Audit remediation:

- introduced typed `HttpError` client errors;
- oversized bodies return controlled HTTP 413;
- malformed JSON returns controlled HTTP 400;
- unexpected server exceptions no longer expose their internal message to API clients.

Runtime regression tests cover malformed JSON and generic unexpected 500 responses.

## S6 — API/private-data response caching

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

All JSON responses now include:

`Cache-Control: no-store`

This is especially important for Journal, Wellbeing, Progress and full exports once authentication exists.

## S7 — Baseline browser security headers

**Status:** PASS after remediation, browser validation still required  
**Severity before remediation:** MEDIUM

The Worker now adds baseline security headers to both application Assets responses and API responses:

- Content-Security-Policy with same-origin scripts/styles/connect, no objects, no framing, and narrow media/image allowances;
- Permissions-Policy disabling camera, microphone and geolocation by default;
- Referrer-Policy `no-referrer`;
- HSTS;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`.

Quality runtime tests assert these headers, and the automatic preview UI/API smoke passed after deployment.

Human browser validation is still required for Meditation speech/audio, install behavior and normal navigation because a successful HTTP smoke test cannot prove every browser feature remains compatible with the CSP.

## S8 — UI output escaping is a positive pattern

**Status:** PASS for reviewed high-sensitivity paths  
**Severity:** —

`public/js/core/dom.js` provides `escapeHtml()` covering `& < > " '`. Reviewed Journal rendering escapes dates, labels, titles, body previews, tags, search values and editor values before inserting HTML templates.

This audit did not find a reviewed high-sensitivity path intentionally rendering Journal or user-entered text as raw HTML.

Recommendation: retain source/static XSS contract tests and add browser E2E with hostile representative text after the browser-test layer exists.

## S9 — Local secret hygiene is good but `.env` patterns were incomplete

**Status:** PASS after remediation  
**Severity before remediation:** LOW

Existing `.gitignore` already excluded:

- `.dev.vars*`;
- `.wrangler`;
- `node_modules`.

Repository root review did not show a committed `.env`/`.dev.vars` secret file.

Audit remediation adds:

- `.env`;
- `.env.*`;
- exception for `!.env.example`.

GitHub Actions Cloudflare credentials remain stored as repository secrets, not files. The Cloudflare CI token remains intentionally least-privilege: Workers Scripts Write + D1 Read, with no D1 Write.

## S10 — No abuse/rate-limiting layer

**Status:** CONCERN  
**Severity:** MEDIUM for public release; lower once private Beta is protected by Access

The Worker does not currently implement application rate limiting, and no repository-level Cloudflare rate-limit policy can be proven from the codebase.

Immediate priority is authentication/Access, not arbitrary rate limits. Before public exposure, define rate limits for authentication/recovery, mutations, export and other expensive/sensitive endpoints using Cloudflare/application controls appropriate to the final identity architecture.

Do not apply a single global request limit that breaks legitimate synchronization or future wearable integrations.

## S11 — Privacy governance/account lifecycle is incomplete

**Status:** CONCERN  
**Severity:** HIGH for public release

Positive product behavior already exists:

- user export is comprehensive;
- Journal is explicitly separate from Progress/Insights/AI;
- Wellness meditation writes no Progress/Wellbeing/history data;
- Wellbeing is observational and profile-scoped;
- individual Journal and Progress records can be deleted where the product supports deletion;
- factual history is not silently rewritten.

Missing public-product governance includes:

- privacy policy / data inventory presented to users;
- account/profile deletion and verified data-erasure workflow;
- retention rules for deleted accounts and operational backups/Time Travel;
- authentication/session data retention;
- explicit consent/permission model before future AI or wearable data sharing;
- processor/subprocessor and regional-data decisions as the product becomes public;
- incident-response and user-notification procedure.

These should be designed before collecting other users' Journal/Wellbeing data.

## S12 — Public source repository is not a security boundary

**Status:** CONCERN / product-owner decision  
**Severity:** MEDIUM privacy/reputation consideration; not an application vulnerability by itself

The GitHub repository is currently public. Runtime secrets are not stored in the reviewed repository root, which is good. However, historical migrations and commit history contain founder/default-profile seed/configuration material.

If open source is intentional, keep designing as though every line of source and history is public. If it is not intentional, repository visibility should be reviewed separately; making it private would not replace authentication or secure the deployed Worker.

No repository visibility change is authorized by this audit.

## S13 — Cookie/session CSRF architecture is not applicable yet, but becomes mandatory with auth

**Status:** DEFERRED DESIGN REQUIREMENT

There is currently no application cookie/session authentication, so conventional authenticated CSRF protection is not yet meaningful. When public identity is introduced, select one coherent session model and add appropriate SameSite/Origin/CSRF controls rather than layering ad-hoc tokens after routes are already public.

## Phase 5 decision

**Security is the first audit area with a critical live-Beta blocker.**

Safe code hardening completed on the feature/preview path, but it does not solve S1. The next required operational decision is to protect the current owner-only production and preview Workers with a verified authentication perimeter before treating either URL as private.

Future public release additionally requires application-level identity/profile authorization, same-profile database defense in depth, real D1 integration tests, privacy/account lifecycle design and abuse controls.

Production Worker/D1 were not changed during this phase.
