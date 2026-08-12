# Growth Compass Version 1 — Modularity Standard

Status: mandatory architecture contract for beta and production development.

## Objective
Growth Compass is a modular monolith: one deployable application with strict internal module boundaries. The target is the smallest possible blast radius for every change. A feature may be added, removed, replaced, redesigned, or extended without unrelated modules changing.

Absolute zero coupling is impossible when two capabilities genuinely depend on the same public concept. The enforceable target is: only the changed module and consumers of its explicit public contract may need changes; unrelated modules must remain untouched.

## Core rules
1. Every business capability is a module with a stable public contract and private internals.
2. Modules may depend on platform/core contracts and explicitly declared public contracts only.
3. A module must never import another module's private implementation files.
4. Cross-module communication uses public contracts or named domain events; never hidden callbacks, DOM reach-through, or direct table access.
5. Each module owns its UI, routes, validation, domain rules, persistence adapter, migrations, tests, and export adapter when applicable.
6. The platform core contains no business rules for Goals, Capacity, Sleep, Energy, Progress, Insights, AI, or future modules.
7. Composition roots may know which modules exist; core utilities may not.
8. Module removal must degrade gracefully. Optional consumers detect capability availability rather than assuming another module exists.
9. Module enablement is a profile/user preference. Disabled modules do not render UI, register optional widgets, or participate in optional calculations.
10. Public contracts are versioned when a breaking change is unavoidable.
11. Database changes are additive, module-owned migrations. Shared platform tables are limited to identity, module enablement, settings, and stable cross-module identifiers.
12. No module reads another module's private tables directly. Shared analytics consume published read models/contracts.
13. Side effects are explicit and testable. No hidden module initialization on import.
14. All route, event, widget, and module IDs are globally unique and validated at startup/test time.
15. Boundary tests are release-blocking.

## Composition architecture
```text
Growth Compass Core / Platform
├── module registry
├── event dispatcher
├── identity/profile context
├── navigation/slot registry
├── design system
├── API transport
└── shared primitive utilities

Modules
├── areas
├── goals
├── plans
├── capacity
├── activities
├── logger
├── sleep
├── energy
├── progress
├── insights
├── ai-planner
└── future modules
```

## Required module manifest
Every module exposes one manifest. The exact runtime representation can evolve, but these semantics are mandatory:

```js
{
  id: 'capacity',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  routes: [],
  slots: [],
  publishes: [],
  subscribes: []
}
```

A module can have zero routes or zero UI slots. The manifest is the only object the composition root needs to know.

## Dependency direction
Allowed:
```text
module -> platform/core
module -> declared public contract of dependency
composition root -> module manifests
```

Forbidden:
```text
core -> business module
module A -> module B private files
module A -> module B private database tables
module A -> module B DOM nodes
module A -> module B undocumented events
```

## UI isolation
Pages such as Today and Plan are composition surfaces, not giant features. Modules contribute widgets/panels into named slots.

Example:
```text
Today slot
├── sleep.summary
├── energy.check-in
├── goals.today
├── logger.quick-add
└── capacity.summary
```

Removing Sleep removes only `sleep.summary`; Today remains valid.

Every UI contribution must:
- render inside the host element it receives;
- clean up listeners/subscriptions when unmounted;
- never query or mutate another module's DOM;
- expose inputs/outputs through its contract/events;
- use shared design tokens rather than duplicating global styling rules.

## API isolation
The Worker router is generic. Platform modules register route descriptors through the module registry. Adding a new Version 1 module must not require adding another `if (path === ...)` branch to the central router.

Legacy beta routes may remain hard-coded only during the migration period.

## Event isolation
Events are named facts, not commands to another module.

Good:
```text
progress.recorded
sleep.updated
plan.version-created
module.enabled
```

Bad:
```text
refreshInsightsNow
makeGoalsRecalculate
updateSleepCard
```

Publishers do not know subscribers. Subscribers must tolerate the event not being published when the source module is disabled.

## Data isolation
Each module owns tables using a clear prefix or bounded schema naming convention. Examples:
```text
goal_*
capacity_*
sleep_*
energy_*
ai_*
```

Cross-module reporting is built from explicit read models or service functions. Direct cross-module SQL is prohibited except in a documented migration/compatibility adapter with an expiry plan.

## Replaceability test
A module is sufficiently isolated only if all are true:
1. It can be disabled without the application failing.
2. Its UI can be redesigned without changing unrelated modules.
3. Its persistence implementation can change behind the same public contract.
4. Its API routes can change internally while keeping the external contract stable.
5. It can be deleted after removing its catalog registration and explicit consumers.
6. Tests identify all legitimate consumers of its public contract.

## Global product requirements
- Multi-user isolation is mandatory before public launch.
- Authentication/authorization is platform-level, not implemented independently by every module.
- Localization, accessibility, observability, privacy controls, exports, and auditability are cross-cutting platform services.
- AI providers are adapters behind a provider-neutral AI planning contract.
- Feature flags/module enablement allow gradual rollout and rollback.
- Module contracts must support backwards-compatible migrations so rolling deployments do not require all components to change simultaneously.

## Architecture enforcement
The test suite must validate at minimum:
- duplicate module IDs;
- missing declared dependencies;
- dependency cycles;
- duplicate route registrations;
- cross-module private imports;
- platform/core importing business modules outside a composition root;
- invalid event identifiers;
- invalid module manifests.

A PR that violates a boundary test does not merge.

## Deployment model
Remain a modular monolith while the product is young. Do not split modules into microservices merely for architectural aesthetics. A module may later be extracted into a separate Worker/service only when scale, security isolation, ownership, or independent deployment justifies the operational cost. Its public contract should make that extraction possible without rewriting consumers.

## Definition of done for a new module
A new module is not complete until it has:
- manifest;
- public contract;
- declared dependencies;
- isolated UI contribution(s), if any;
- isolated API route(s), if any;
- persistence ownership, if any;
- validation;
- unit tests;
- contract/boundary tests;
- enable/disable behavior;
- export/privacy behavior where relevant;
- accessibility requirements;
- documented events;
- preview acceptance test.
