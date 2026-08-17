# Engineering audit — Phase 9: API and domain contracts

Status: **COMPLETE — VERSIONED BOUNDARY STRONG; RETRY/CONCURRENCY GAPS RECORDED**

Audit context: Growth Compass — Version 1 Beta. The HTTP API is currently consumed by the first-party browser client; no external/public API is promised yet.

## Overall assessment

The application has a strong internal/external contract separation for its maturity. Business routes belong to registered modules, modules declare `contractVersion: 1`, Version 1 business routes live under `/api/v1`, input is normalized before persistence, cross-module validation uses declared public contracts, and the finite legacy Beta surface is explicitly classified and sunset-bound.

This phase adds a release-blocking Version-1 namespace gate and `docs/API_CONTRACTS.md`, which records the HTTP boundary independently from the internal module-contract standard.

The main current-Beta limitations are reliability semantics rather than route organization: create operations are not generally idempotent, mutable resources use last-write-wins updates, and controlled error responses have human messages but no stable machine-readable error code. Those should be solved once at the platform/API contract level before broader multi-device/public use, not independently by each module.

---

## A9-1 — Registered business APIs are explicitly Version 1

**Status:** PASS after additional enforcement

Every registered Worker business module declares:

`contractVersion: 1`

and every registered business route is required by Quality to remain inside:

`/api/v1/...`

The gate examines the actual Worker module catalog rather than relying on route-name documentation.

Platform/cross-cutting routes such as `/api/health`, `/api/export`, and finite legacy compatibility routes remain intentionally outside the module Version-1 namespace.

## A9-2 — HTTP route ownership follows module ownership

**Status:** PASS

Representative review confirms:

- Areas owns Area routes/normalization/persistence;
- Goals owns Goal routes and validates Area references through the Areas public contract;
- Daily Plan owns its lifecycle/status transitions;
- Journal owns private-reflection CRUD;
- Progress validates factual records and resolves Activity/Goal meaning through the Activities public contract;
- Today composes public contracts rather than private table joins.

The central Worker router matches registered module routes and contains no Version-1 business switch statement.

This matches the modularity standard: HTTP does not justify breaking private capability boundaries.

## A9-3 — Input validation is generally explicit before persistence

**Status:** PASS for reviewed routes

Representative validations include:

- civil date syntax and ordered ranges;
- positive resource IDs;
- bounded text lengths;
- allowed status/priority/measurement/period sets;
- Goal Area existence through a public contract;
- Daily Plan lifecycle transition checks;
- bounded JSON request size at the platform HTTP layer;
- domain-specific Progress normalization.

Database constraints remain defense in depth, not a replacement for user/domain validation.

## A9-4 — Current response shapes are simple and reasonably consistent

**Status:** PASS / document current convention

Observed common shapes:

- lists: `{ "items": [...] }`;
- creates/updates: `{ "item": {...} }`;
- delete/success actions: `{ "ok": true }` or an updated item;
- controlled error: `{ "error": "human-readable message" }`.

Creates normally return HTTP 201, missing owned resources return 404, retired compatibility mutations return 410, and oversized bodies return 413.

`docs/API_CONTRACTS.md` now records these conventions so future modules do not invent unrelated envelopes casually.

## A9-5 — Error responses lack stable machine-readable codes

**Status:** CONCERN  
**Severity:** MEDIUM current Beta; HIGH before multiple clients/integrations

`worker/core/http.js` currently models an `HttpError` as message + status, and controlled API responses expose only the human-readable `error` string.

Consequences:

- a richer global client error layer cannot reliably distinguish domain cases without HTTP status/message interpretation;
- independent future clients could become coupled to English text;
- localizing user-facing error text would risk changing client behavior if messages are treated as identifiers.

Required future remediation:

Add an **additive** stable error `code` taxonomy while preserving human-readable messages. Do not make clients parse English strings.

This should be designed alongside the Phase 7 platform error-state work rather than introduced route by route.

## A9-6 — Create mutations are not generally idempotent

**Status:** CONCERN  
**Severity:** MEDIUM owner-only Beta; HIGH before multi-device/retry-heavy use

Representative POST creates for:

- Progress;
- Journal;
- Daily Plan;
- Areas/Goals

perform ordinary inserts after validation. Repeating a successful request can therefore create another resource/fact unless a module-specific uniqueness rule happens to reject it.

For factual Progress, naïve value-based duplicate detection would be dangerous: two genuinely distinct sessions can legitimately have identical visible values.

Required future remediation:

Design a platform/API idempotency contract for supported retryable creates, likely using a principal/profile + operation + client idempotency key and a platform-owned deduplication store or equivalent.

Until then, first-party clients should not blindly replay uncertain mutation requests as though they were safe GETs.

## A9-7 — Mutable resources use last-write-wins concurrency

**Status:** CONCERN  
**Severity:** LOW owner-only single-client Beta; HIGH before active multi-device/public use

Representative updates:

- read the current owned resource;
- normalize a patch/update;
- execute `UPDATE ... WHERE profile_id=? AND id=?`;
- update `updated_at`;
- do not require the caller's previously observed resource version/timestamp.

Therefore two clients can edit the same resource and the later write can silently overwrite the earlier one.

Required future remediation:

Introduce one coherent optimistic-concurrency strategy such as resource version/ETag or explicit expected version. A stale write should produce a conflict/precondition response rather than silent overwrite.

Do not invent different timestamp-comparison rules for Journal, Goals, Daily Plan, etc.

## A9-8 — Civil-date semantics are strong but should remain an explicit API rule

**Status:** PASS

Growth Compass correctly treats date-based domains as civil `YYYY-MM-DD` keys rather than pretending all calendar meaning is a UTC timestamp.

Representative route/domain code validates actual civil dates and range ordering. Today/Capacity calculations preserve real month/year lengths.

`docs/API_CONTRACTS.md` now records that clients must not interchange civil dates and timestamps or assume four-week months.

## A9-9 — Interactive history reads are bounded; complete export is intentionally different

**Status:** PASS / future scale concern already tracked in Phase 8

Interactive Progress and Journal histories enforce bounded result sizes. This protects ordinary UI requests.

Full user export deliberately does not silently truncate. If export eventually exceeds a safe synchronous request size, the correct redesign is an explicit streaming/asynchronous export—not applying an interactive page limit and omitting user data.

## A9-10 — Persistence-like field names are already part of the Version 1 client contract

**Status:** ACCEPTED CURRENT CONTRACT

Many Version 1 payloads use snake_case fields such as `occurred_on`, `planned_minutes`, `area_id`, `updated_at`.

Some mirror database columns, but they are now consumed as application contract fields. Renaming them purely for frontend aesthetics would be a breaking change with little product benefit.

Future domain shaping should focus on semantic leakage, not naming fashion. Where a response truly leaks an internal/private persistence concept, introduce a public read model deliberately rather than globally camel-casing everything.

## A9-11 — Legacy Beta HTTP compatibility is finite and sunset-bound

**Status:** PASS

The compatibility router explicitly classifies old routes as:

- read-model;
- forwarder;
- retired.

Every entry carries the `before-public-launch` sunset contract. New Version 1 capabilities are registry routes, not additions to the compatibility switch.

This is the correct migration pattern: compatibility remains visible debt rather than becoming permanent architecture.

## A9-12 — External API publication is intentionally deferred

**Status:** PASS / product decision

There is currently no reason to publish OpenAPI/external-client credentials merely because the first-party app has HTTP routes.

Before intentionally supporting independent clients/integrations, Growth Compass needs:

- application-level identity/profile authorization;
- stable machine-readable errors;
- idempotency;
- optimistic concurrency;
- real Worker+D1 HTTP integration tests;
- deprecation/version rules;
- intentionally supported schemas/endpoints.

The internal module public contracts should remain separate from any future external HTTP developer API.

## Remediation added in this phase

New enforcement/documentation:

- `tests/api-contracts.test.js`
  - every installed Worker business module must declare contractVersion 1;
  - every installed Version 1 business route must remain under `/api/v1`;
  - business routes use the bounded supported HTTP method set.
- `docs/API_CONTRACTS.md`
  - versioning;
  - ownership;
  - identity context;
  - body/date semantics;
  - response/error conventions;
  - retry/idempotency requirements;
  - concurrent-edit requirements;
  - pagination/export/history/compatibility rules.

## Verification checkpoint

After Phase 9 enforcement/documentation:

- feature SHA: `2bfd9aceaeeb240b17d5a3b4ae8d06326b3e22a5`
- Quality run #326
- **279 / 279 passing**
- Quality checked out exactly that feature SHA.

Documentation commits after this checkpoint must also pass Quality before the phase is frozen.

## Phase 9 decision

**API/domain direction: continue.** Version 1 is organized and validation-conscious enough for the current private Beta.

Before broader multi-device/public use, prioritize as one coherent platform/API reliability design:

1. machine-readable error codes;
2. retry/idempotency contract;
3. optimistic concurrency;
4. authenticated principal/profile context;
5. real Worker+D1 HTTP integration tests.

Production Worker code and production D1 were not changed by this phase.
