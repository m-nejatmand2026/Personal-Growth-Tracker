# Engineering audit — Phase 12: Technical debt and synthesis

Status: **COMPLETE — DEBT PRIORITIZED; FUTURE SCOPE SEPARATED FROM ENGINEERING OBLIGATIONS**

Audit context: Growth Compass — Version 1 Beta, owner-only private Beta behind Cloudflare Access.

## Overall assessment

Growth Compass is on a sound software-engineering track. The audit did not identify a reason to rewrite the application, replace the native frontend, split into microservices, or abandon the modular-monolith strategy.

The strongest engineering property is the capability-boundary discipline: module ownership, declared dependencies, public contracts, table ownership, migration ownership and graceful dependency removal are mechanically protected. CI/Preview isolation, D1 migration safety, private-Beta Access protection, operations, accessibility foundations and release procedures were materially strengthened during the audit.

The project is **not yet public/multi-user ready**. The remaining blockers are explicit and architectural rather than hidden:

- application identity/profile authorization;
- real persisted module enablement;
- database same-profile defense in depth;
- real Worker+D1 integration tests;
- real browser E2E/accessibility/performance validation;
- public privacy/account lifecycle;
- legacy compatibility retirement;
- branch governance before broader collaboration/release.

Those items do not prevent the current owner-only Beta from continuing behind Cloudflare Access.

---

## T1 — Technical debt now has one prioritized register

**Status:** PASS after remediation

`docs/TECHNICAL_DEBT_REGISTER.md` is the canonical debt/risk register produced by this audit.

It classifies work into:

- P0 public/multi-user blockers;
- P1 broader-Beta/reliability hardening;
- P2 maintainability/measured optimization;
- evidence-deferred items that are intentionally **not** debt today.

This prevents every future idea from becoming an undifferentiated backlog item.

## T2 — Public-readiness blockers are coherent, not random cleanup

**Status:** PASS as planning outcome

The P0 items form a coherent release architecture:

1. identity/profile authorization creates a trustworthy principal boundary;
2. module enablement resolves from that profile context;
3. database constraints add same-profile defense in depth;
4. Worker+D1 integration tests prove actual persistence/routing behavior;
5. browser E2E proves rendered/accessibility/client behavior;
6. privacy/account lifecycle governs other people's private data;
7. legacy compatibility is retired before becoming permanent public architecture;
8. branch governance protects the production baseline as collaboration grows.

These should be planned as release capabilities, not as isolated patches.

## T3 — Multi-device reliability debt is explicitly separated from current single-owner use

**Status:** CONCERN / prioritized P1

The current first-party private Beta can tolerate:

- human-only error messages;
- non-idempotent create retries;
- last-write-wins resource updates.

That stops being acceptable once the same profile is commonly active across multiple devices/clients or network retries become routine.

The API reliability layer should therefore be designed once around stable error codes, idempotency and optimistic concurrency rather than implemented differently in every module.

## T4 — Recovery is documented but not yet practiced

**Status:** CONCERN / prioritized P1

D1 Time Travel procedures and Worker rollback are documented and correctly separated, but a controlled Preview restore drill remains unperformed.

A production incident should not be the first time the team validates actual restore behavior.

## T5 — Shared UX framework debt is correctly distinguished from module architecture debt

**Status:** CONCERN / prioritized P2 plus human acceptance

The user's Wellness review exposed a real cross-app presentation issue: shell destination title plus module eyebrow/title/lede can create a text-heavy duplicated first viewport.

The audit classifies this as **shared experience-framework hierarchy**, not Wellness-specific styling debt.

After audit closure, the next UX refinement should define one cross-app first-viewport contract and apply it across first-class pages. This requires preview/human acceptance; it should not be automatically refactored merely because the engineering audit found it.

## T6 — Internal module growth is visible but controlled

**Status:** ACCEPTED / P2

Some frontend modules have growing single files, but they remain module-owned and the new source-size budget prevents silent unbounded growth.

Recursive splitting should occur when real private responsibilities emerge, not through a large cosmetic file reorganization.

## T7 — Performance work remains measurement-driven

**Status:** PASS as engineering policy

The audit found no justification for a frontend framework/bundler rewrite. The app remains small and dependency-light.

Potential scaling work — Today year-range calculation, Journal substring search, synchronous full export, module lazy loading — is explicitly tied to representative measurement rather than speculative complexity.

## T8 — Tooling/supply-chain debt is bounded

**Status:** CONCERN / P2

Actions and Wrangler are explicitly pinned, but local/dev transitive dependency resolution is not captured by an npm lockfile.

This should be resolved before broader contributor/release use, without adding dependencies merely to create a lockfile.

## T9 — Future product ideas are not technical debt

**Status:** PASS

The register explicitly excludes absent future capabilities from debt status, including:

- Google/email public onboarding;
- AI Planner;
- wearables;
- external developer API;
- microservices;
- React/Vue;
- third-party monitoring;
- production continuous deployment.

They may become valid product/engineering work later, but their absence does not make the current Beta poorly engineered.

## T10 — Current private-Beta exception is explicit and narrow

**Status:** PASS

The owner-only Beta may continue with P0 public blockers open because:

- both stable Worker URLs require Cloudflare Access authentication;
- Preview CI verifies the anonymous Access boundary;
- the application intentionally remains the single/default profile internally;
- no unrelated users are being onboarded;
- automatic CI cannot mutate D1 or deploy production;
- production release remains explicit/manual.

This exception ends when unrelated users are onboarded or a public release is prepared.

## Audit closure decision

**Engineering audit: complete.**

The project should continue as a modular monolith with the current native frontend and Cloudflare/D1 platform.

The next work should not be a rewrite. It should proceed in two parallel tracks after human agreement:

1. **product/experience refinement** — especially the shared first-viewport framework issue already observed on Wellness/mobile/desktop;
2. **release-readiness backlog** — repay P0/P1 items in the order required by the next actual release goal (broader Beta versus public multi-user launch).

The current owner-only Beta is suitable for continued Preview iteration. Public/multi-user readiness is intentionally not claimed.

Production Worker code and production D1 were not changed by this phase.
