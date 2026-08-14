# Growth Compass Version 1 — Modularity Standard

Status: mandatory architecture contract for beta and production development.

## Objective
Growth Compass is a modular monolith: one deployable application with strict internal module boundaries. The target is the smallest possible blast radius for every change. A feature may be added, removed, replaced, redesigned, or extended without unrelated modules changing.

Absolute zero coupling is impossible when two capabilities genuinely depend on the same public concept. The enforceable target is: only the changed module and consumers of its explicit public contract may need changes; unrelated modules must remain untouched.

The same rule applies recursively inside a module. A module is not allowed to become a new monolith internally: replaceable subcomponents should communicate through narrow internal contracts so changing one part of a capability does not unnecessarily disturb its siblings.

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
16. Every normal user-facing capability must have an easy/default path. Advanced configuration is progressively disclosed rather than forced into the common flow.
17. Easy and advanced modes must use the same domain rules and public contracts. Do not create two separate implementations whose behavior can drift.
18. Internal subcomponents follow the same isolation principle as top-level modules: changing a replaceable subcomponent should affect only that subcomponent and explicit internal consumers.
19. Commercial packaging and entitlement decisions are platform concerns. Business modules must not hard-code subscription names, pricing tiers, prices, SKUs, payment-provider concepts, or billing workflows.
20. Independently gateable functionality uses stable capability identifiers owned by the product architecture, not commercial package names. A capability may move between Free, paid tiers, trials, bundles, add-ons, organizations, promotions, or future commercial models without changing its business implementation.
21. Entitlement resolution maps an authorized profile/account context to capability decisions. Business modules consume a neutral availability/authorization decision; they do not consume payment-provider customer objects, price IDs, checkout sessions, invoices, or subscription-provider internals.
22. Protected capabilities are enforced authoritatively at the Worker/API boundary. Frontend hiding, lock states, or upgrade messaging are presentation behavior and must never be the only access control.
23. Effective capability availability is resolved centrally from installed modules, declared dependencies, rollout/feature flags, entitlement, and the user's own enable/disable preference. Individual business modules must not invent independent pricing or availability logic.
24. Authentication providers and billing providers are replaceable platform adapters. Replacing Google/Apple/email authentication or a future billing provider must not require rewriting Goals, Journal, Progress, Wellness, Insights, or other unrelated business modules.

## Progressive disclosure contract
Growth Compass must support both users who want a fast, low-friction experience and users who want detailed control.

Default behavior:
- show the minimum fields required for the common task;
- provide sensible defaults and reusable presets;
- keep common actions fast enough for daily use;
- never require advanced configuration to perform a normal action.

Advanced behavior:
- reveal detailed scheduling, effective dates, measurement options, overrides, and other expert controls only when requested;
- preserve exactly the same underlying records, validation and calculations as easy mode;
- allow the user to move from easy to advanced configuration without losing data;
- avoid advanced-only data structures that make the easy path a second-class or incompatible mode.

Example: a recurring Sleep schedule may default to “8 hours every day”. The same Capacity module may reveal a custom-by-day editor for “8 hours Sunday–Friday, 10 hours Saturday” plus effective dates. Both paths produce the same Capacity contract and historical calculations.

## Composition architecture
```text
Growth Compass Core / Platform
├── module registry
├── event dispatcher
├── identity/profile context
├── capability/entitlement resolver (future; neutral during owner-only Beta)
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

## Commercial packaging and entitlement boundary
The architecture must assume from the beginning that an entire module or a smaller capability inside a module may later be free, paid, bundled, trial-only, organization-provided, or sold as an optional add-on.

The intended direction is:

```text
Authenticated principal
        ↓
Authorized profile
        ↓
Commercial state / purchases
        ↓
Platform entitlement resolver
        ↓
Stable capability decisions
        ↓
Module registry + Worker routes + navigation + composition
        ↓
Business modules
```

Commercial products package capabilities; they do not define the capabilities themselves.

Good:
```text
insights.basic
insights.advanced
wellness.meditation
wellness.premium-audio
planning.advanced
ai.guidance
```

A future commercial catalog may map those stable capabilities into any package:

```text
Free        -> insights.basic
Plus        -> planning.advanced
Premium     -> insights.advanced + wellness.meditation
Add-on      -> wellness.premium-audio
```

Changing those mappings must not require changing Insights, Wellness, Planning, or AI business logic.

Module-level and feature-level access are separate from user preference. For a future multi-user product, effective availability should conceptually be resolved as:

```text
installed
AND dependency-resolved
AND rollout-enabled
AND entitled
AND user-enabled
```

Some capabilities may be mandatory platform capabilities and therefore not user-disableable. That exception must be explicit rather than hidden inside module code.

The owner-only Beta does not implement accounts, paid subscriptions, billing, or persisted entitlement state. Until that future workstream exists, no fake pricing checks or hard-coded Beta plan tiers should be introduced merely to simulate the final system. The architecture boundary is established now so the real identity + profile + entitlement system can be added later without rewriting business modules.

When entitlements are implemented, tests must prove at minimum:
- backend denial cannot be bypassed by calling an API directly;
- frontend navigation/composition and backend authorization derive from the same resolved capability set;
- changing commercial package mappings does not require business-module changes;
- a billing-provider adapter can be replaced without changing business modules;
- disabled/unentitled optional modules do not break unrelated capabilities;
- declared module dependencies remain enforced after entitlement filtering.

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
business module -> billing/payment-provider internals
business module -> hard-coded commercial tier logic
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

Complex modules should apply the same rule internally. For example, a future Focus Timer can contain countdown state, controls and completion-alert adapters without giving the timer direct ownership of Progress persistence. Replacing the alert sound or removing the timer must not require changes to Logger, Goals, Capacity, or unrelated Today widgets.

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
focus-timer.completed
```

Bad:
```text
refreshInsightsNow
makeGoalsRecalculate
updateSleepCard
saveTimerIntoProgressNow
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

Future billing/customer/subscription provider identifiers and entitlement state belong to bounded platform/commerce storage, not business-module tables. Business records may reference the authorized profile and stable capability identifiers where needed, but they must not duplicate provider-specific commercial state.

## Replaceability test
A module is sufficiently isolated only if all are true:
1. It can be disabled without the application failing.
2. Its UI can be redesigned without changing unrelated modules.
3. Its persistence implementation can change behind the same public contract.
4. Its API routes can change internally while keeping the external contract stable.
5. It can be deleted after removing its catalog registration and explicit consumers.
6. Tests identify all legitimate consumers of its public contract.
7. Its optional advanced UI can be removed without breaking the easy/default workflow.
8. A replaceable internal subcomponent can change without requiring unrelated sibling internals to change.
9. Its commercial packaging can change without changing the module's business implementation.
10. A payment/authentication provider can change without changing the module.

## Global product requirements
- Multi-user isolation is mandatory before public launch.
- Authentication/authorization is platform-level, not implemented independently by every module.
- Entitlement and commercial packaging are platform-level; business modules expose stable capabilities and remain unaware of pricing/package names.
- Localization, accessibility, observability, privacy controls, exports, and auditability are cross-cutting platform services.
- AI providers are adapters behind a provider-neutral AI planning contract.
- Feature flags/module enablement allow gradual rollout and rollback.
- Module contracts must support backwards-compatible migrations so rolling deployments do not require all components to change simultaneously.
- Easy/default workflows and advanced/custom workflows are two presentations over the same validated domain contract, not separate product forks.
- Frontend availability and backend authorization must converge on one resolved capability set once accounts/entitlements exist.

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

When commercial entitlements are implemented, the release-blocking suite must additionally prevent direct billing/payment-provider coupling inside business modules and prove API authorization cannot be bypassed through frontend-only gating.

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
- easy/default workflow where the capability is user-facing;
- advanced controls through progressive disclosure when advanced configuration exists;
- stable capability identifiers for independently gateable sub-features where applicable, without embedding commercial plan names or payment-provider logic;
- preview acceptance test.
