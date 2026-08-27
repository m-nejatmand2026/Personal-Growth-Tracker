# Growth Compass engineering audit plan

Status: prepared for the post-stabilization audit of **Growth Compass — Version 1 Beta**.

This is an evidence-based engineering audit, not a visual-only review. Each area should produce:

- observed evidence;
- pass / concern / fail status;
- severity: critical / high / medium / low;
- concrete remediation;
- release impact;
- regression test or operational guard where appropriate.

## 1. Architecture and modularity

Audit:

- module ownership boundaries;
- declared frontend and Worker dependencies;
- private cross-module imports;
- cross-module SQL/table access;
- composition roots versus business logic;
- event ownership and factual event semantics;
- module enable/disable and removal behavior;
- recursive internal isolation;
- compatibility layer containment and sunset rules;
- Wellness Boost and future-module extension points;
- Today and Plan composition-surface purity.

Evidence sources:

- `docs/MODULARITY_STANDARD.md`;
- module manifests/catalogs;
- boundary tests;
- Worker routes/public contracts;
- SQL ownership scanner;
- frontend imports and event registry.

## 2. CI/CD and supply-chain safety

Audit:

- Quality trigger and permissions;
- automatic preview deployment trust boundary;
- exact-tested-SHA deployment;
- fork/untrusted-code behavior;
- secret exposure risk;
- action version pinning strategy;
- Node/Wrangler version reproducibility;
- dependency installation behavior;
- preview/production separation;
- migration deployment policy;
- smoke test quality;
- concurrency and cancellation behavior;
- rollback path;
- absence of accidental production continuous deployment.

Known stabilization fact:

- preview automation is structurally ready but Cloudflare repository secrets must be bootstrapped once before it can complete a deployment.

## 3. Automated test strategy

Audit:

- unit/domain coverage;
- contract coverage;
- modularity/boundary coverage;
- API route coverage;
- persistence validation;
- negative/error-path coverage;
- accessibility regression coverage;
- PWA/install regression coverage;
- CI/CD safety tests;
- stale wording assertions versus behavioral assertions;
- end-to-end/browser coverage gaps;
- deterministic test inputs and time-zone/date handling;
- fixture quality and isolation.

Classify tests by purpose so release gates do not depend on brittle text snapshots.

## 4. Data model, D1, migrations and integrity

Audit:

- table ownership;
- foreign/reference semantics;
- indexes and query patterns;
- migration ordering;
- additive/backward-compatible migration policy;
- module-owned migrations;
- preview versus production migration state;
- backup/Time Travel procedures;
- `quick_check`/integrity verification;
- historical-data preservation;
- legacy compatibility data isolation;
- export completeness;
- deletion/archive semantics;
- profile scoping and future multi-user readiness.

Known release fact:

- production migrations `0006_activities_contract.sql` and `0007_wellbeing_energy.sql` remain intentionally pending until production acceptance.

## 5. Security and privacy

Audit:

- authentication/authorization assumptions;
- current single-user Beta limitations;
- input validation and normalization;
- SQL parameterization;
- XSS/HTML escaping;
- CSRF relevance for mutation paths;
- security headers;
- CORS behavior;
- secret management;
- GitHub Actions secret trust boundary;
- Cloudflare token least privilege;
- sensitive Journal/Wellbeing handling;
- export privacy;
- logging of private content;
- future multi-user isolation requirements;
- dependency/supply-chain exposure.

Public/global release must not occur until multi-user/security assumptions are explicitly audited.

## 6. Observability and operations

Audit:

- useful structured Worker logging;
- error visibility without leaking private data;
- deploy traceability to Git SHA;
- preview smoke tests;
- production smoke-test plan;
- Cloudflare deployment/version history;
- rollback procedure;
- D1 failure diagnostics;
- client-side error states;
- health/status endpoint need;
- incident checklist;
- backup/restore drill readiness.

## 7. Frontend engineering and accessibility

Audit:

- shared experience framework ownership;
- module-specific CSS versus shared primitives;
- duplicate/dead CSS;
- responsive breakpoints;
- 375px overflow;
- touch targets;
- keyboard access;
- focus handling;
- modal focus trap/inert behavior;
- reduced motion;
- semantic HTML;
- accessible names;
- chart text equivalents;
- color contrast;
- mobile safe areas;
- screen density and progressive disclosure;
- PWA installed-mode behavior.

Human UX acceptance remains separate from automated accessibility acceptance.

## 8. Performance and resource efficiency

Audit:

- Worker startup and bundle size;
- static asset count/weight;
- unnecessary module loading;
- API request fan-out;
- D1 query count and limits;
- unbounded reads;
- pagination;
- client rendering cost;
- PWA cache/update behavior;
- audio/Wellness resource behavior;
- mobile network resilience;
- future growth constraints.

Measure before optimizing.

## 9. API and domain-contract quality

Audit:

- route naming/versioning;
- request/response consistency;
- validation errors;
- public module contract width;
- idempotency where relevant;
- date/time semantics;
- pagination/limits;
- archived-reference behavior;
- backward compatibility;
- accidental legacy endpoint dependence;
- domain invariants for Area → Goal → Activity → Progress;
- Daily Plan versus Progress separation;
- Wellbeing/Insights non-causal semantics.

## 10. Documentation and source of truth

Audit:

- README accuracy;
- `MODULARITY_STANDARD.md`;
- `EXPERIENCE_ARCHITECTURE.md`;
- `DEVELOPMENT_WORKFLOW.md`;
- Wellness Boost contract;
- current backlog;
- stale Revision A statements;
- architecture diagrams or ADR need;
- migration/runbook documentation;
- preview/production environment documentation;
- exact current implementation checkpoint.

Documentation must describe the current system, not only historical intentions.

## 11. Release engineering

Audit:

- branch/PR policy;
- required checks;
- production approval gate;
- release checklist;
- production migration ordering;
- Time Travel/backup checkpoint;
- dry run;
- deploy command safety;
- smoke tests;
- rollback;
- release version/tag strategy;
- changelog/release notes;
- post-release verification.

Preview automation and production release automation must remain separate trust paths.

## 12. Technical debt and maintainability

Inventory:

- legacy compatibility routes/tables;
- duplicated presentation logic;
- stale naming/comments;
- package/dependency reproducibility;
- missing lockfile strategy;
- overly broad files/modules;
- test brittleness;
- missing integration/e2e coverage;
- manual operational steps;
- TODO/FIXME debt;
- future multi-user blockers;
- performance hotspots;
- documentation drift.

Each debt item should have owner, severity, target phase and removal condition.

## Audit completion criteria

The audit is complete when:

1. every category has evidence and a status;
2. critical/high findings have remediation plans;
3. release blockers are explicit;
4. architectural findings are reflected in tests or standards where feasible;
5. documentation is updated to the audited state;
6. production remains untouched until the separate release gate is explicitly accepted.
