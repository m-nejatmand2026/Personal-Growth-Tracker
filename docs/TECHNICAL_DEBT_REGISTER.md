# Growth Compass technical debt register

Status: active prioritized debt/risk register for **Growth Compass — Version 1 Beta**.

This register comes from the 12-phase engineering audit. It deliberately separates real engineering debt from future product scope.

Priority meanings:

- **P0 — public/multi-user blocker:** do not launch broadly while unresolved.
- **P1 — broader-Beta/reliability hardening:** current owner-only Beta can continue, but resolve before scale/multi-device risk grows.
- **P2 — maintainability/quality improvement:** address incrementally when touching the owning area or when measurements justify it.
- **Deferred by evidence:** intentionally not implemented until usage/measurement creates a real need.

## P0 — public/multi-user blockers

### TD-001 — Application-level identity and profile authorization

Current state: Cloudflare Access protects the private-Beta perimeter, but application code still resolves the seeded `default` profile.

Required outcome:

- authenticated principal at the platform boundary;
- principal → authorized profile mapping;
- no client-controlled arbitrary profile authorization;
- cross-profile authorization tests with at least two profiles;
- preserve existing owner history when identity is introduced;
- business modules receive authorized profile context and do not implement login themselves.

Do not onboard unrelated users into the current single-profile runtime.

### TD-002 — Persisted profile-owned module enablement

Current registries understand dependency-aware enable/disable graphs, but runtime routing/navigation/composition do not persist or apply a profile's module preferences end to end.

Required outcome:

- platform-owned preference persistence;
- identity/profile-aware resolution;
- same enabled set applied to Worker routes and frontend navigation/composition;
- dependency cascade/graceful removal tests.

Design with TD-001 rather than adding an isolated Settings toggle.

### TD-003 — Database same-profile defense in depth

Application/public contracts consistently scope resources by `profile_id`, but several cross-entity relationships are not protected by composite database constraints that prove both rows belong to the same profile.

Before multi-user use, design one coherent schema-hardening migration set rather than piecemeal foreign keys.

### TD-004 — Real Worker + D1 integration test layer

Current tests strongly cover domain rules, static architecture and selected real Worker fetch/router behavior, but representative CRUD is not executed against isolated D1 using the real migration chain.

Required before public release:

- apply migrations into isolated test D1;
- execute representative HTTP create/read/update/delete flows;
- prove profile isolation/foreign-key behavior;
- exercise migration compatibility and error paths.

### TD-005 — Real browser E2E/accessibility/performance layer

Source tests cannot prove actual browser focus, screen-reader naming, zoom/reflow, virtual keyboard, audio/speech behavior, Web API cleanup or real rendering/request performance.

Add a focused browser suite before public release. Keep it high-value; do not duplicate every fast source test in a browser.

### TD-006 — Public privacy/account lifecycle

Before collecting other users' Journal/Wellbeing/private data, define and implement:

- user-facing privacy/data inventory;
- account/profile deletion and verified erasure;
- retention/backups/Time Travel implications;
- session/recovery/revocation behavior;
- future AI/wearable consent boundaries;
- incident/user-notification governance appropriate to release scope.

### TD-007 — Legacy Beta compatibility sunset

Legacy read-model/forwarder/retired HTTP routes and compatibility tables are deliberately finite and marked `before-public-launch`.

Before public release:

- verify no active client depends on them;
- migrate/export any remaining required data;
- remove runtime compatibility routes/tables where safe;
- keep historical migration files as history, not runtime architecture.

### TD-008 — Protect `main` before broader collaboration/public release governance

GitHub currently reports `main.protected = false`.

Before collaborators/public production flow:

- require intended PR + Quality checks;
- block force-push/deletion;
- restrict bypass/direct-write authority deliberately;
- preserve the trusted Preview workflow without creating a production backdoor.

## P1 — broader-Beta/reliability hardening

### TD-009 — API reliability contract: error codes, idempotency, optimistic concurrency

Current limitations:

- controlled error envelope has human message but no stable machine code;
- create POSTs are not generally idempotent;
- mutable resources are last-write-wins.

Design these as one platform/API reliability layer before multiple active devices/independent clients are common:

- additive stable error codes;
- operation/profile-scoped idempotency keys for retryable creates;
- resource version/ETag/expected-version optimistic concurrency.

Do not implement separate ad-hoc rules in each business module.

### TD-010 — Controlled Preview D1 recovery drill

Time Travel/recovery is documented but has not been practiced in a deliberate restore-and-verify drill.

Before risky production schema/data work or public release:

- capture a Preview bookmark;
- make a controlled reversible change;
- restore;
- record the previous bookmark;
- run migration/integrity/application checks;
- document actual recovery timing/failure modes.

### TD-011 — Shared client error/state presentation contract

Current modules use a mix of `.empty`, inline fallback sections and polite toast status.

Define shared presentation primitives for:

- loading;
- empty;
- degraded/unavailable;
- inline validation;
- retryable network/server failure;
- appropriate polite vs urgent accessibility announcements.

Modules keep ownership of business wording.

### TD-012 — Logger activity-suggestion semantics

Logger currently advertises `aria-autocomplete=list` while suggestions are ordinary focusable buttons, not a complete combobox/listbox model.

Resolve based on real browser/screen-reader testing. Prefer the simpler input + explicit suggestion buttons model unless a full combobox is justified.

## P2 — maintainability / measured optimization

### TD-013 — Plan composition read-model coupling

Plan is correctly a composition host but still knows several contributor-private model shapes. Introduce stable composition-facing summary contracts as Plan gains more contributors.

### TD-014 — Recursive internal isolation in larger frontend modules

Some module-owned UI files are becoming large. Split only where a real private responsibility boundary exists (form/controller/player/renderer/etc.), not by arbitrary line count.

The frontend source budget now prevents silent unbounded growth.

### TD-015 — Shared first-viewport hierarchy

Human review found the shell destination title plus module eyebrow/title/lede can make the top of first-class pages feel duplicated/text-heavy, especially on mobile.

This is a shared experience-framework concern, not a Wellness-only issue.

After the engineering audit, define one cross-app hierarchy rule and apply it consistently across Today/Plan/Progress/Insights/Journal/Wellness rather than page-by-page.

This item needs human UX acceptance and should not be treated as an automatic engineering refactor.

### TD-016 — Today long-range calculation benchmark/optimization trigger

Year/month direction currently preserves exact civil/effective-dated semantics by expanding dates and scanning plan history. Optimize only when representative benchmarks show material cost.

Any optimization must preserve real calendar lengths and historical version semantics.

### TD-017 — Journal search scaling

Journal `%query%` substring search is simple and correct but may scan more private text as a user's history grows.

Consider a Journal-owned search/FTS strategy only after representative latency measurements justify it. Do not turn search indexing into an implicit AI/Insights data path.

### TD-018 — Large synchronous export scaling

Full user export is intentionally complete and unbounded. Benchmark representative multi-year accounts; if it becomes too large, move to explicit streaming/asynchronous export rather than silent truncation.

### TD-019 — Deterministic local/tool dependency snapshot

GitHub Actions pin Wrangler explicitly and Actions use immutable SHAs, but no npm lockfile currently captures the transitive local/dev dependency graph.

Before broader contributor/release use, decide whether to commit a lockfile and use a deterministic install convention. Do not add dependencies merely to justify this item.

### TD-020 — Route-overlap proof beyond exact registration

Registry route-conflict checks compare registered method/pattern identity but do not solve arbitrary regex intersection.

As route volume grows, add stable route IDs/representative concrete-path ownership checks rather than attempting a general regex solver.

## Deferred by evidence / intentionally not debt today

The following are **not current technical debt simply because they do not exist**:

- microservices;
- React/Vue/another frontend framework;
- bundling/code splitting beyond current measured need;
- distributed tracing/third-party monitoring SDK;
- aggressive alerting without a traffic/error baseline;
- public Google/email account onboarding;
- AI Planner;
- wearable integrations;
- external developer API/OpenAPI publication;
- production continuous deployment.

These may become valid product/engineering work later, but implementing them now would be scope expansion rather than debt repayment.

## Current private-Beta posture

The owner-only Beta may continue while P0 items remain open because:

- both stable Workers are protected by Cloudflare Access for All traffic;
- Preview CI proves anonymous operational access is blocked;
- the application remains intentionally single/default-profile internally;
- no unrelated users are being onboarded;
- production is not automatically deployed;
- production D1 is not automatically mutated.

This exception ends when the product begins onboarding unrelated users or preparing a public release.
