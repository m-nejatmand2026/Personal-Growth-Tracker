# Engineering audit — Phase 10: Documentation and maintainability

Status: **COMPLETE — CURRENT ENTRY POINT/PRECEDENCE RESTORED; HISTORICAL MATERIAL RETAINED AS CONTEXT**

Audit context: Growth Compass — Version 1 Beta. The repository has accumulated product specifications, architecture rules, research, runbooks and audit records through a long Beta evolution.

## Overall assessment

The project is well documented in depth, but the audit found a serious discoverability problem: the repository root README still described the original personal tracker (Momente B1, weekly targets, six-month roadmap) and instructed a reader to create/replace remote D1 infrastructure manually. That stale entry point conflicted with the current modular Growth Compass architecture and device-independent CI/Preview workflow.

This phase replaces the README with a current repository entry point, introduces an explicit documentation map/precedence model, and adds regression tests preventing the obsolete bootstrap instructions from returning.

The remaining documentation challenge is consolidation rather than volume. Historical/research/Revision A material is useful context but must remain clearly subordinate to current normative architecture/product decisions. The rolling engineering audit synthesis should be refreshed after all 12 phases rather than duplicating mutable test counts/checkpoints across many long-lived files.

---

## DOC1 — Repository README was materially obsolete

**Status:** PASS after remediation  
**Severity before remediation:** HIGH

The old README described:

- a mobile-first single-user tracker centered on energy/Momente/weekly targets/roadmap;
- old legacy data tables as the primary model;
- creating a D1 database and replacing a placeholder ID;
- manual Wrangler/local deployment as the normal workflow.

Those instructions no longer represented the live Version 1 architecture and could cause a contributor to perform the wrong environment operation.

Remediation:

The README now describes:

- Growth Compass — Version 1 Beta;
- Area → Goal → Activity → Progress Record;
- current major capabilities;
- modular-monolith architecture;
- current Cloudflare/D1/native frontend stack;
- owner-only Access perimeter;
- device-independent Quality → Preview workflow;
- explicit migration/operations runbooks;
- current audit/release posture;
- local development as optional rather than normal deployment authority.

It explicitly rejects creating/replacing remote D1 infrastructure from README instructions.

## DOC2 — Documentation precedence/discoverability was implicit

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM/HIGH

New `docs/DOCUMENTATION_MAP.md` classifies and orders:

- normative architecture/engineering contracts;
- product/capability specs;
- operational runbooks;
- engineering audit evidence;
- UX/research/historical material;
- mutable live-code truth.

Key rule:

`MODULARITY_STANDARD.md` remains the highest architecture authority. Operational runbooks beat obsolete copied command snippets. Revision A/mockup material does not silently override accepted Revision B/shared-framework decisions.

## DOC3 — Current normative architecture documents are strong

**Status:** PASS

The reviewed current architecture set includes:

- `MODULARITY_STANDARD.md`;
- `ARCHITECTURE.md`;
- ADR-0001 modular monolith;
- `EXPERIENCE_ARCHITECTURE.md`;
- `API_CONTRACTS.md`.

They consistently support a modular monolith, declared dependencies/public contracts, composition surfaces and progressive disclosure.

No architecture rewrite is justified by documentation drift.

## DOC4 — Operational procedures are now separated by concern

**Status:** PASS

Current operational sources are distinct:

- `DEVELOPMENT_WORKFLOW.md` — normal Quality/Preview flow;
- `D1_MIGRATION_RUNBOOK.md` — schema/data migration and D1 recovery;
- `OPERATIONS_RUNBOOK.md` — incidents, Worker versions/rollback/health;
- `PRIVATE_BETA_ACCESS.md` — current Access perimeter.

This separation is preferable to one giant deployment document because Worker rollback, D1 restore, Access and routine Preview delivery have different safety boundaries.

## DOC5 — API boundary lacked a dedicated current contract document

**Status:** PASS after Phase 9 remediation

`API_CONTRACTS.md` now records versioning, route ownership, request/date semantics, response/error envelopes, idempotency/concurrency gaps, list/export behavior and legacy sunset rules.

This reduces the risk that frontend assumptions or database field names evolve into undocumented external behavior.

## DOC6 — Audit evidence is detailed but mutable checkpoint duplication is a maintenance risk

**Status:** CONCERN  
**Severity:** MEDIUM

Phase audit documents intentionally record exact historical SHAs/test counts. That is useful evidence.

However, the older rolling `ENGINEERING_AUDIT_REPORT.md` can become stale while later phase files continue to evolve. It should not be treated as automatically current merely because its filename says REPORT.

Required closure action in Phase 12:

- refresh the audit synthesis after all 12 phases;
- link to phase evidence rather than duplicating every detail;
- summarize current blockers/priorities;
- label historical checkpoint values as historical.

## DOC7 — Historical/Revision A/research material is useful but must stay visibly non-normative

**Status:** ACCEPTED WITH PRECEDENCE RULE

The repository intentionally retains evolution/research documents. Deleting all history would remove useful rationale.

The maintainability rule is instead:

- current normative docs state current behavior;
- historical/reference docs are context;
- mockups do not authorize unsupported metrics/data;
- future proposals do not become implemented scope merely because they are documented.

The documentation map now makes that distinction explicit.

## DOC8 — Mechanical documentation drift prevention now exists for the highest-risk entry point

**Status:** PASS after remediation

`tests/documentation-contract.test.js` prevents the root README from regressing to:

- Momente/weekly-target/six-month tracker positioning;
- placeholder D1 replacement instructions;
- `wrangler d1 create personal-growth-tracker` as repository bootstrap;
- copied remote database-ID setup;
- local/manual deployment as a required normal path.

It also verifies README links to the authoritative architecture/operations documents and that documentation precedence remains explicit.

Do not try to mechanically assert every sentence of every specification; tests should protect high-risk operational/normative facts, not freeze prose.

## DOC9 — Current source of truth for mutable state remains GitHub/live code

**Status:** PASS

Docs now explicitly state that mutable implementation details should be verified from:

- live active branch code;
- module catalogs;
- `wrangler.jsonc`;
- Quality/deploy workflow;
- regression tests.

This avoids copying mutable SHAs/Worker IDs/config snippets into many documents and then trusting stale duplicates.

## Verification checkpoint

After Phase 10 remediation:

- feature SHA: `3404d0ed5e94dbf916cfb86098ef635d3f6edbe1`
- Quality run #330
- **282 / 282 passing**
- exact tested feature head confirmed by Quality checkout.

Documentation commits after this checkpoint must also pass Quality before the phase is frozen.

## Phase 10 decision

**Documentation direction: continue with less duplication, not more documents.**

The repository now has a reliable entry point and precedence map. The remaining documentation work belongs mainly to audit/release closure:

- final audit synthesis in Phase 12;
- production release runbook/checklist in Phase 11;
- mark/organize historical material as needed when it creates real confusion;
- keep normative docs updated in the same change as architecture/operational contract changes.

Production Worker code and production D1 were not changed by this phase.
