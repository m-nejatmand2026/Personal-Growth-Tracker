# Growth Compass — Product / Backend Alignment Audit

Date: 2026-08-15
Scope: owner-only private Beta, `feature/experience-refinement`, no Production changes.

## Executive verdict

**Keep the current backend and modular-monolith foundation. Do not rewrite it.**

The rejected 20/100 frontend did not reveal a backend collapse. The data layer still separates long-term direction, short-horizon intention, factual history, reflection and wellbeing in ways that support the rebuilt product.

However, one product/data-model mismatch is now important enough to make explicit: **canonical Activities currently require a Goal.** That restriction contributed to a capture flow that asks too much at the moment of action. The rebuilt UI can improve capture immediately without a schema change, but the Activity contract should be revisited before Growth Compass treats Activities as truly universal reusable actions.

## Evidence that the rejected redesign was presentation-only

Comparing the last pre-Figma-current checkpoint `38bb96e0c84f94d02b437ef1b28c3617671fda70` with the rejected checkpoint `23c051407409b5d483b08a8bd8647888e062dfc0` shows 78 commits but **no Worker module or migration changes**. The changed runtime files are frontend CSS/HTML/JS plus presentation tests/docs. Therefore the usability regression did not mutate the canonical backend model.

## Domain separation — PASS

The current schema correctly distinguishes:

- `goals` — long-term direction;
- `goal_activities` — reusable actions attached to Goals;
- `plan_versions` + `goal_plan_values` — effective-dated guidance;
- `capacity_commitments` — physical time commitments;
- `daily_plan_items` — dated intentions;
- `progress_records` — historical facts;
- `journal_entries` — private reflection;
- Wellbeing observation tables — optional state/context.

This is the right conceptual separation for the new page map.

### Particularly strong boundary

`daily_plan_items` and `progress_records` are independent. This supports the required rule:

`Plan / Start now = intention`

`Done = factual Progress only after explicit confirmation`

The rebuild should preserve this exactly.

## Database design — GOOD for private Beta

### Strengths

- profile scope exists on business tables;
- foreign keys are enabled;
- common profile/date/status indexes exist;
- migrations are additive and preserve history;
- plan guidance is effective-dated rather than overwriting old facts;
- Journal is structurally separate from Progress/Insights;
- Capacity has explicit commitment kinds, weekday masks and effective dates;
- Progress supports time, quantity and boolean-style evidence rather than assuming every Goal is a timer.

### Important mismatch: Activity requires Goal — REVIEW REQUIRED

Current `goal_activities.goal_id` is `NOT NULL`, and the Activity API validates `Goal is required.` before creation.

That is internally consistent, but it conflicts with the broader product definition if an Activity is meant to be a universal reusable action. Examples such as `Call dentist`, `Buy groceries`, `Read article`, or a new exploratory habit may not deserve a Goal before they can be captured.

**Decision for the current rebuild:** do not rush a Production schema migration. The UI must first make existing Activity selection/creation dramatically easier. Generic Daily Plan items already provide a safe non-Activity path for intentions.

**Decision before broader Activity Library scope:** choose explicitly between:

A. `Activity = always Goal-linked growth action` and make generic Daily Plan items the non-Goal action type; or

B. `Activity = reusable action, Goal relationship optional` and migrate the contract/schema accordingly.

The product map currently favors B, but this should be treated as a deliberate domain revision rather than a cosmetic UI change.

### Daily Plan Activity key integrity — ACCEPTABLE COMPATIBILITY DEBT

`daily_plan_items.activity_key` is stored as text rather than a foreign key. This helps compatibility and preserves items if an Activity changes/archive behavior, but it provides weaker database integrity.

For the owner-only Beta this is acceptable. Before public multi-user scale, either formalize the snapshot semantics or introduce a stronger reference strategy.

## Modularity — STRONG

The Worker is organized as a modular monolith with separate modules for Activities, Areas, Capacity, Daily Plan, Goals, Journal, Plans, Progress, Today, Wellbeing and Wellness Boost.

Good properties already enforced by the project:

- business modules have manifests/contracts;
- private cross-module imports are prohibited by tests;
- table/migration ownership is enforced;
- Today and Plan are composition surfaces rather than database owners;
- Progress owns factual history;
- Journal remains independent;
- Wellbeing and Wellness are separate concepts;
- platform/core do not own business rules.

### Remaining modularity debt

Not a blocker for the current visual rebuild:

- persisted profile-owned module enablement is not complete end-to-end;
- Plan still knows some contributor model shapes;
- route overlap proof is exact-pattern based;
- some frontend modules can be split internally as they grow.

## API — GOOD Beta foundation

Versioned `/api/v1` module routes and public contracts are appropriate.

Private-Beta reliability gaps that should remain tracked, not mixed into the UI rebuild:

- stable machine-readable error codes;
- mutation idempotency;
- optimistic concurrency for independent/multi-device clients.

## Security / identity — SAFE FOR CURRENT OWNER-ONLY BETA, NOT PUBLIC

Cloudflare Access remains the perimeter for both stable URLs. Application-level principal → profile authorization is still required before unrelated users are onboarded.

Do not interpret the good current private-Beta posture as public readiness.

## CI / Preview / Production separation — STRONG

The validated pipeline already proves:

- exact tested SHA;
- unit/domain/contract/modularity gate;
- real Worker + isolated D1 integration;
- Chromium + WebKit desktop/mobile acceptance;
- guarded Preview-only deployment;
- no automatic D1 migration application;
- Cloudflare Access boundary + UI + D1 smoke test.

The visual failure demonstrated that these engineering gates need a separate human/product visual gate; it did **not** make the engineering gates unnecessary.

## Product-map alignment by page

| Page / workflow | Backend support | Judgment |
|---|---|---|
| Today | Today composition + Daily Plan + Capacity + Progress + Wellbeing | Strong |
| Plan | Goals + Plans + Capacity + Areas | Strong |
| Add / Logger | Activities + Daily Plan + Progress | Strong mechanics; Activity creation too Goal-dependent |
| Goals | Goals + Areas + plan values | Strong |
| Life Areas | Areas | Strong |
| Goal time budgets | plan versions + goal plan values | Strong |
| Time & Capacity | capacity commitments | Strong |
| Daily Plan | daily_plan_items | Strong |
| Recovery | Daily Plan statuses/dates | Supported; UX is the larger gap |
| Progress | progress_records | Strong |
| Insights | Progress + Wellbeing public contracts | Appropriate Beta basis |
| Journal | journal_entries | Strong separation |
| Wellness | independent module | Strong modular boundary |
| Energy check-in | Wellbeing | Strong |
| Settings | profile/runtime preferences | Adequate owner Beta; future account scope deferred |
| Activity Library | Activities CRUD exists | Management supported; universal standalone Activity semantics unresolved |

## Final decision

1. **No backend rewrite.**
2. **No Production touch during this rebuild.**
3. Rebuild the interface around the page/workflow contracts.
4. Keep intention/fact/reflection/wellbeing boundaries unchanged.
5. Treat optional Goal linkage for Activities as the main domain decision revealed by the product reset.
6. Keep public/multi-user identity and database defense-in-depth work separate from this owner-Beta UX recovery.
