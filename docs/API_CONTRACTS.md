# Growth Compass API contract rules

Status: active engineering contract for **Growth Compass — Version 1 Beta**.

This document governs the HTTP boundary between Growth Compass clients and the Worker. Module public contracts remain the internal capability boundary; HTTP is the application/client boundary.

## Versioning

Business capability routes for the current product live under:

`/api/v1/...`

Every registered Worker business module declares `contractVersion: 1`. Release-blocking tests reject a registered Version 1 business route outside `/api/v1`.

A breaking change to an externally consumed request/response meaning requires either:

- a compatible transition period; or
- a new versioned contract.

Do not silently reinterpret an existing field in place.

Platform/cross-cutting operational endpoints are separate from business capability versioning. Current examples include:

- `/api/health` — platform health only, no profile/business data;
- `/api/export` — cross-cutting user-data export composition;
- finite legacy Beta compatibility routes documented in the router and sunset before public launch.

## Ownership

A business module owns its HTTP routes, validation, domain normalization and persistence implementation.

Cross-module validation/enrichment goes through declared module public contracts. A route must not read another module's private tables simply because that would make the HTTP handler shorter.

The central router matches registered module routes; it must not become a switch statement containing business rules.

## Identity/profile context

During the current owner-only Beta, Cloudflare Access protects the Worker perimeter, while application code still resolves the seeded `default` profile.

Before multi-user/public use, the HTTP boundary must receive an authenticated principal/profile context from the platform identity layer. Clients must never be trusted to choose an arbitrary `profile_id` as authorization proof.

Business modules should receive the authorized profile context rather than implement authentication individually.

## Request bodies

JSON request bodies are bounded to 64 KiB at the platform HTTP layer.

Malformed JSON is a controlled client error. Module routes then normalize and validate domain input before persistence.

Do not use persistence/database errors as the primary user-input validation mechanism when a domain rule can be checked explicitly.

## Dates and time

Calendar dates crossing the API use civil `YYYY-MM-DD` date keys where the domain is date-based.

Date ranges must reject malformed dates and `from > to`.

A civil date is not interchangeable with a UTC timestamp. Modules that require timestamps must name/store them explicitly rather than inferring them from a date string.

Capacity/Today period calculations preserve actual civil calendar lengths; API clients must not assume a four-week month.

## Response shapes

List endpoints normally return:

```json
{
  "items": []
}
```

Single-item creates/updates normally return:

```json
{
  "item": {}
}
```

Successful delete/archive-style actions may return an updated item or:

```json
{
  "ok": true
}
```

Existing Version 1 snake_case field names are part of the current client contract even when they resemble persistence field names. Do not rename them casually merely for frontend taste.

Private API JSON responses are `Cache-Control: no-store` by default.

## Error contract

Current Version 1 controlled errors use:

```json
{
  "error": "Human-readable message"
}
```

and an appropriate HTTP status (for example 400, 404, 410, 413 or 500).

Unexpected internal errors return only:

```json
{
  "error": "Unexpected server error"
}
```

Internal exception detail stays in server-side operational evidence, not the client payload.

### Required future improvement

The current error envelope has no stable machine-readable error code. Before Growth Compass has multiple clients, public integrations, or a richer global error UI, add an additive stable `code` field/taxonomy while preserving human-facing messages.

Do not make clients parse English error strings to determine business behavior.

## Retry and idempotency

### Current Beta behavior

Create operations such as Progress, Journal and Daily Plan are **not generally idempotent**. Replaying the same successful POST can create another record.

The current owner-only browser client should avoid blind automatic retries of mutation requests.

### Required before multi-device/public reliability

Design one cross-module idempotency contract for retryable creates, rather than adding different duplicate-detection rules to each module.

A suitable design should:

- accept a client/request idempotency key for supported mutation classes;
- scope it to the authenticated principal/profile and operation;
- return the original successful result when the same operation is safely replayed;
- expire/deduplicate keys deliberately;
- never merge two genuinely distinct factual Progress records merely because their visible values happen to match.

This will likely require a platform-owned idempotency store/table or equivalent infrastructure. It must not become a business table owned by Progress/Journal/etc.

## Concurrent edits

### Current Beta behavior

Mutable resources generally use last-write-wins updates. `updated_at` is recorded on many resources, but update SQL does not currently require the caller's previously observed version/timestamp.

This is acceptable for the present owner-only Beta but can silently overwrite edits once the same profile is edited from multiple active devices/clients.

### Required before broader multi-device use

Introduce one coherent optimistic-concurrency contract, for example a resource version/ETag or explicit expected-version field.

The server should reject a stale update with a conflict/precondition response rather than silently overwrite newer state.

Do not add per-module ad-hoc timestamp comparison semantics.

## Pagination and bounded reads

Interactive list/history APIs must have bounded result sizes. Current modules use bounded limits for important history paths.

Complete user export is different: it must not silently omit data merely to fit an interactive-page limit. If full export becomes too large for one synchronous request, redesign it explicitly as a streaming/asynchronous export rather than truncating it.

## Deletes and history

Deletion behavior belongs to each module's domain contract.

Growth Compass's general principle is to preserve factual history unless the user explicitly deletes owned data or a privacy/account-erasure workflow requires removal.

Do not cascade-delete historical Progress merely to simplify a renamed/archived Goal/Activity. Historical references may deliberately preserve snapshots or nullable references according to the owning module's model.

## Compatibility routes

The original Beta routes are a finite migration surface with explicit classification:

- read-model;
- forwarder;
- retired.

They have an explicit `before-public-launch` sunset. New business features must not be added to the compatibility router.

A retired mutation should continue to return its explicit retirement response rather than silently mutate legacy data.

## Events versus HTTP

HTTP routes are not a substitute for cross-module event contracts. When a business fact should notify another module, publish the declared factual event and let the composition/platform event mechanism choose subscribers.

Do not make one business module call another module's private HTTP endpoint from inside the Worker.

## Public/integration readiness checklist

Before Growth Compass exposes APIs to independent clients/integrations, add/verify:

- application-level authenticated principal/profile authorization;
- stable machine-readable error codes;
- idempotency for retryable creates;
- optimistic concurrency for mutable resources;
- real Worker + D1 integration tests of representative HTTP CRUD flows;
- documented pagination/query limits;
- explicit API deprecation/version policy;
- external-client schema/reference documentation only for intentionally supported endpoints.

Do not publish an OpenAPI contract merely because the implementation has routes. First decide which APIs are intentionally supported outside the first-party Growth Compass client.
