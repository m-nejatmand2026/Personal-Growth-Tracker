# Growth Compass documentation map

Status: active documentation index for **Growth Compass — Version 1 Beta**.

The repository contains normative architecture/product rules, operational procedures, implementation/reference notes and audit records. They are not all equal sources of truth.

## Precedence

When documents conflict, use this order unless an explicitly newer approved product decision supersedes it:

1. **Canonical product identity/name:** Growth Compass — Version 1 Beta.
2. **`MODULARITY_STANDARD.md`** for architecture/isolation rules.
3. **`UX_UI_MASTER_SPEC.md`** for current UX/UI design direction, measurable design quality targets, responsive/accessibility strategy and Revision C+ presentation decisions.
4. **`EXPERIENCE_ARCHITECTURE.md`** for durable product semantics, easy/default interaction principles and capability experience rules that are not superseded by the UX/UI Master Specification.
5. **Current API/data/operations contracts and runbooks** for their respective boundaries.
6. **Live code + release-blocking tests on the active feature branch** for mutable implementation state.
7. **Audit phase records** as evidence/findings; they do not override normative product rules.
8. **Historical/research/mockup/reference documents** as context only.

A screenshot/mockup or old implementation note never overrides a current domain/architecture contract by itself.

## Normative architecture, engineering and design contracts

Read these when changing system structure, boundaries or first-class UX/UI:

- [`MODULARITY_STANDARD.md`](MODULARITY_STANDARD.md) — mandatory module isolation and dependency standard; highest architecture authority.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — current modular-monolith architecture and composition model.
- [`ADR-0001-modular-monolith.md`](ADR-0001-modular-monolith.md) — architectural decision record for the modular monolith.
- [`API_CONTRACTS.md`](API_CONTRACTS.md) — HTTP Version 1 contract/version/retry/concurrency rules.
- [`UX_UI_MASTER_SPEC.md`](UX_UI_MASTER_SPEC.md) — definitive evidence-backed Revision C+ UX/UI direction, current-interface critique, quality targets, responsive/accessibility contract, design-system requirements, validation framework and redesign roadmap.
- [`EXPERIENCE_ARCHITECTURE.md`](EXPERIENCE_ARCHITECTURE.md) — durable product/UX semantics and easy/default presentation principles. Where visual/presentation direction differs, the newer UX/UI Master Specification wins; where architecture/ownership differs, the Modularity Standard wins.

## Product/capability specifications

These define approved capability behavior and semantics:

- [`DAILY_PLAN_AND_JOURNAL_SPEC.md`](DAILY_PLAN_AND_JOURNAL_SPEC.md)
- [`WELLNESS_BOOST.md`](WELLNESS_BOOST.md)
- Revision B research/implementation documents where they are marked current/approved and have not been superseded by the UX/UI Master Specification.

Capability-specific specifications are subordinate to the Modularity Standard on architecture and must not redefine another module's ownership.

## Operational procedures

Use these for real environment changes or incidents:

- [`DEVELOPMENT_WORKFLOW.md`](DEVELOPMENT_WORKFLOW.md) — normal device-independent Quality → Preview workflow.
- [`D1_MIGRATION_RUNBOOK.md`](D1_MIGRATION_RUNBOOK.md) — all remote D1 migration/recovery procedures.
- [`OPERATIONS_RUNBOOK.md`](OPERATIONS_RUNBOOK.md) — Worker incidents, logs, versions, rollback and health checks.
- [`RELEASE_RUNBOOK.md`](RELEASE_RUNBOOK.md) — explicit accepted-Preview → production release procedure.
- [`PRIVATE_BETA_ACCESS.md`](PRIVATE_BETA_ACCESS.md) — owner-only Cloudflare Access perimeter.

Operational runbooks override old README/manual command snippets when they disagree.

## Engineering audit

- [`ENGINEERING_AUDIT_PLAN.md`](ENGINEERING_AUDIT_PLAN.md) — scope/order/exit criteria.
- `audit/PHASE_*.md` — evidence and findings for each audit phase.
- [`ENGINEERING_AUDIT_REPORT.md`](ENGINEERING_AUDIT_REPORT.md) — rolling/final synthesis; check its status/header before treating checkpoint counts as current.
- [`POST_AUDIT_HARDENING_2026-08-14.md`](POST_AUDIT_HARDENING_2026-08-14.md) — additive current checkpoint for modularity hardening and the real Worker + isolated D1 integration gate completed after the 12-phase audit.

Audit findings classify current risk. They do not authorize production deployment or product-scope changes by themselves. When a later dated hardening checkpoint explicitly records a finding as remediated, use the later checkpoint together with live code/tests for current implementation status while keeping the original audit as historical evidence.

## UX/research/reference material

Documents containing research, mockups, Revision A/Revision B history, migration notes or future proposals are supporting evidence rather than automatic implementation requirements unless the documentation map marks them normative.

Use them to understand intent, but verify the currently accepted product decision before changing runtime behavior.

In particular:

- Revision A/Revision B material may explain how the current interface evolved but does not override the current UX/UI Master Specification on Revision C+ presentation decisions.
- future capability proposals (AI, wearables, communications, focus timer, broader onboarding, etc.) are not implemented merely because a document describes them.
- mockups do not authorize invented metrics or unsupported data relationships.

## Mutable implementation truth

For code-level questions, verify the live active branch rather than relying on a copied snippet in a document.

Important composition roots:

- `worker/modules/catalog.js`
- `public/js/modules/catalog.js`

Important release gates:

- `.github/workflows/quality.yml`
- `.github/workflows/deploy-preview.yml`
- `tests/`

Important environment contract:

- `wrangler.jsonc`

## Documentation change rules

When a change materially alters architecture, operations, UX/UI direction or a public/domain contract:

1. update the owning normative document/runbook in the same change;
2. update regression tests when the rule can be mechanically enforced;
3. do not duplicate mutable values (SHAs, test counts, Worker Version IDs) into many long-lived documents unless the value is explicitly a historical checkpoint;
4. label historical checkpoints as historical;
5. link to the authoritative document instead of copying long procedures into multiple files;
6. remove or clearly mark instructions that could cause a destructive/outdated environment operation.

## New contributor reading path

For a new engineer/contributor:

1. repository `README.md`;
2. `MODULARITY_STANDARD.md`;
3. `ARCHITECTURE.md`;
4. `UX_UI_MASTER_SPEC.md`;
5. `EXPERIENCE_ARCHITECTURE.md`;
6. `DEVELOPMENT_WORKFLOW.md`;
7. relevant capability spec;
8. relevant runbook/API contract;
9. current audit findings and any later post-audit hardening checkpoint for the area being changed.

This reading path is intentionally shorter than reading every document in chronological order.
