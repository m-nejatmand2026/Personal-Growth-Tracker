# Engineering audit — Phase 5: Security and privacy

Status: **COMPLETE — CRITICAL LIVE-BETA EXPOSURE MITIGATED; PUBLIC IDENTITY BLOCKERS REMAIN**

Audit context: Growth Compass — Version 1 Beta. This phase evaluates the current owner-only Beta separately from the future public/multi-user product.

## Overall assessment

The codebase has several good security foundations: prepared D1 statements, bounded request bodies, strong output escaping in reviewed UI paths, least-privilege CI credentials, no secrets committed at the repository root, explicit privacy separation for Journal/Wellbeing/Wellness, and a hardened Worker response boundary.

The application itself still has **no application-level authentication or authorization boundary**. `resolveProfileId()` returns `default`, so the current code is not suitable for multiple independent users or public exposure.

The immediate live-Beta exposure identified by this audit has now been mitigated externally: both stable production and preview Worker URLs are protected by Cloudflare Access for **All traffic**. The owner manually verified that production/preview require authentication. Preview CI has a dedicated service identity and automatically proves anonymous operational access is blocked before its authenticated smoke test succeeds.

This Access perimeter is appropriate for the present owner-only Beta. It does **not** close the future public/multi-user identity requirement.

---

## S1 — No application authentication/authorization boundary

**Status:** FAIL for public/multi-user architecture; CURRENT PRIVATE-BETA EXPOSURE MITIGATED BY VERIFIED ACCESS  
**Severity:** CRITICAL without perimeter protection; HIGH future architecture blocker with the current perimeter in place  
**Release impact:** current owner-only Beta may continue behind Access; public/multi-user launch blocked

Evidence in application code:

- `worker/core/profile.js` exports `resolveProfileId()` which unconditionally returns `default`.
- Worker routing invokes Version 1, legacy compatibility and export handlers without application authentication middleware.
- the feature and production code baselines share this identity resolver.
- normal mutation routes derive the profile from the same unconditional resolver.

Impact without edge protection:

Anyone who could reach the Worker would act as the `default` profile through the API. This is not merely a future multi-user concern: the default profile is the real personal Beta profile.

### Verified owner-only Beta mitigation

Both current Workers are protected with Cloudflare Access using **All traffic** rather than Preview-URLs-only protection:

- `personal-growth-tracker.m-nejatmand.workers.dev`
- `personal-growth-tracker-preview.m-nejatmand.workers.dev`

Verification completed:

- the owner manually checked production requires authentication;
- the owner manually checked preview requires authentication;
- Preview GitHub Actions contains a dedicated `Growth Compass Preview CI` Access service identity stored as repository secrets;
- the Preview service identity is used for authenticated smoke testing;
- the deployment gate first attempts an anonymous operational request and fails the release if a 2xx response reaches the Worker;
- CI credentials remain masked and are never echoed by the workflow;
- production receives no Preview CI service-token policy/production deployment authority.

This is perimeter protection for the current private Beta, not the future public-user authentication architecture.

Do not replace the future identity work with a hard-coded password or client-side-only login screen.

## S2 — Future authenticated principal → profile authorization is not designed yet

**Status:** CONCERN  
**Severity:** HIGH  
**Release impact:** public/multi-user launch blocker

Cloudflare Access is suitable as the current owner-only perimeter, but a public product needs an application identity model.

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

The product owner has explicitly deferred external-user onboarding/account creation for now. Do not weaken Access or invite testers into the single-profile runtime until this architecture is intentionally implemented.

## S3 — `/api/export` exposes the most sensitive aggregate data surface

**Status:** PASS for current owner-only Beta behind verified Access; HIGH-SENSITIVITY AUTHORIZATION REQUIREMENT FOR PUBLIC USE  
**Severity:** CRITICAL if anonymously reachable; LOW operationally under current owner-only perimeter

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

The export composition itself is architecturally good and profile-scoped. Cloudflare Access now prevents anonymous requests from reaching the current owner-only Worker.

When public application authentication is implemented, keep export as a user-data ownership feature but require the same strong principal→profile authorization as all private APIs. Consider explicit download headers and confirmation UX later; global `Cache-Control: no-store` is already applied by the Worker.

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

This is especially important for Journal, Wellbeing, Progress and full exports.

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

Quality runtime tests assert these headers, and automatic Preview smoke checks continue to verify the deployed root UI under Access.

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

GitHub Actions Cloudflare credentials remain stored as repository secrets, not files. The Cloudflare CI token remains intentionally least-privilege: Workers Scripts Write + D1 Read, with no D1 Write. The dedicated Access service identity is stored separately as `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` and is used only for protected Preview smoke testing.

## S10 — No abuse/rate-limiting layer

**Status:** CONCERN  
**Severity:** MEDIUM for public release; low under the current owner-only Access perimeter

The Worker does not currently implement application rate limiting, and no repository-level Cloudflare rate-limit policy can be proven from the codebase.

Current priority is not arbitrary rate limiting while the application remains owner-only behind Access. Before public exposure, define rate limits for authentication/recovery, mutations, export and other expensive/sensitive endpoints using Cloudflare/application controls appropriate to the final identity architecture.

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

These must be designed before collecting other users' Journal/Wellbeing data.

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

**The critical anonymous live-Beta exposure is mitigated. Security audit concerns remain open for future public/multi-user use.**

Current owner-only Beta may continue because:

- both stable Worker URLs are protected by Cloudflare Access for All traffic;
- the owner manually verified authentication is required;
- Preview automation proves anonymous operational access is rejected and authenticated CI access works;
- private API responses are `no-store` and unexpected internal messages are not returned to clients;
- Preview CI has no D1 Write and no production deployment authority.

Do **not** interpret this perimeter as permission to onboard unrelated users into the existing `default` profile. Before that stage, Growth Compass needs application-level identity/profile authorization, cross-profile database defense in depth, real D1 integration tests and privacy/account lifecycle design.

Production Worker **code** and production D1 were not changed during this security remediation. Cloudflare Access configuration at the edge was intentionally changed to protect the existing private Beta.
