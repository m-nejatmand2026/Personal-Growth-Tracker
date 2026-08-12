# Growth Compass — Version 1 architecture

Status: beta development. “Version 1” is the product specification target, not a production-readiness claim.

The mandatory isolation rules are defined in [`docs/MODULARITY_STANDARD.md`](./MODULARITY_STANDARD.md). If this file and the Modularity Standard ever disagree, the Modularity Standard wins.

## Architecture choice
Growth Compass is a **modular monolith**: one deployable application with strict internal bounded modules. We deliberately avoid premature microservices while designing every module so it can later be extracted behind the same public contract if scale, security isolation, ownership, or independent deployment requires it.

## Platform layer
The platform contains only cross-cutting infrastructure:

```text
platform/core
├── module registry
├── event dispatcher/bus
├── profile/identity context
├── API transport and HTTP primitives
├── dates/formatting primitives
├── design system/tokens
├── observability hooks
└── composition support
```

Platform/core code must not contain business rules for Goals, Areas, Capacity, Sleep, Energy, Progress, Insights, AI Planner, or future modules.

## Business modules
Version 1 capabilities are modules. A mature module owns its public contract and private internals:

```text
modules/<module>/
├── module.js            # manifest/public registration
├── contract/            # public DTOs/events/services
├── ui/                  # widgets/views/controllers
├── api/                 # route handlers
├── domain/              # business rules
├── data/                # persistence implementation
├── migrations/          # module-owned additive migrations
└── tests/                # unit/contract tests
```

During beta migration, some module manifests are adapters over existing `routes/`, `data/`, and `features/` files. Those adapters are transitional; the manifest boundary is stable while internals move underneath it.

## Composition roots
Only composition roots intentionally know the set of installed modules:

```text
worker/modules/catalog.js
public/js/modules/catalog.js
```

Adding/removing an installed business module should normally require changing its own module directory plus the relevant catalog entry. Generic platform/core code must not be edited.

## Worker request flow
```text
request
  ↓
worker/index.js
  ↓
router
  ↓
module registry
  ↓
matched module route
  ↓
module domain/data
```

Version 1 API routes are registered from module manifests. The central router no longer requires one conditional per Version 1 capability. Legacy beta routes remain hard-coded only until migration completes.

## Frontend composition
Pages such as Today and Plan are composition surfaces rather than monolithic features.

```text
Plan slot
├── capacity panel
├── areas panel
├── goals panel
└── plan-budget panel
```

The host loads registered slot modules through the frontend module registry. A failed module blocks only its explicit dependents; independent modules still render.

Future Today composition follows the same rule:

```text
Today slot
├── sleep.summary
├── energy.check-in
├── goals.today
├── logger.quick-add
└── capacity.summary
```

## Communication
Direct private cross-module imports are prohibited. Cross-module interaction uses one of:

1. a declared public contract/service;
2. a named domain event;
3. a stable shared platform identifier/read model.

Publishers do not know subscribers. Events describe facts (`goal.updated`, `plan.version-created`) rather than commands (`refreshInsightsNow`).

## Data boundaries
D1 remains the source of truth. Shared platform tables are limited to identity/profile/module enablement/settings and stable identifiers. Each business module owns its own tables/migrations as the schema is progressively reorganized.

No module may query another module’s private tables directly in steady-state production architecture. Temporary compatibility adapters must be documented and removed after migration.

## Environment boundary
Production and preview use separate Workers and separate D1 databases. Feature work follows:

```text
feature branch
→ isolated preview D1
→ preview Worker
→ automated tests
→ acceptance test
→ PR
→ main
```

Production and preview must never share writable personal data during destructive/edit testing.

## Automated architecture enforcement
`npm test` includes modularity boundary tests. CI runs those tests for pull requests and `main`.

Release-blocking checks include:
- duplicate module IDs;
- missing dependencies;
- dependency cycles;
- duplicate registered routes;
- cross-module private imports;
- platform/core importing business modules;
- invalid event/module contracts.

## Technology evolution
The beta currently uses native ES modules. The next tooling-hardening step is a controlled migration to TypeScript plus Cloudflare’s Vite integration so contracts become compile-time enforceable while preserving the same module boundaries. That migration must not be mixed with product redesign changes in one uncontrolled step.

## Non-negotiable outcome
A change to one capability may affect that module and explicit consumers of its public contract. It must not require unrelated modules to change merely because they share the same application.
