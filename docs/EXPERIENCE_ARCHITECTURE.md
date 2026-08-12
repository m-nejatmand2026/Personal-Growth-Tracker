# Growth Compass — Version 1 experience architecture

Status: active UX redesign contract. This document complements `MODULARITY_STANDARD.md`; the Modularity Standard wins if they ever conflict.

## Goal
Growth Compass should feel like a calm daily companion rather than a configuration console. The visible product must stay easy for a casual user while preserving deep control for users who want it.

The experience layer is allowed to change aggressively without destabilizing the domain model, persistence, calculations, or unrelated capabilities.

## Primary navigation
The Version 1 mobile navigation target is:

```text
Today | Plan | + | Progress | Insights
```

Settings is secondary and lives behind the header/profile control.

## Page responsibilities

### Today
Answer: **What matters today, and what have I done?**

Today is a composition surface. It should prefer summaries and one-tap actions. Detailed editors open only when requested.

Target contributions include:
- daily state summary;
- goal/activity focus;
- quick logging;
- recent progress;
- optional focus timer entry.

### Plan
Answer: **What am I trying to do, and does it fit my life?**

The mature Plan workspace is segmented:

```text
Goals | Capacity | Schedule | Compass
```

The first experience-shell slice keeps existing Plan modules intact and improves wording. Segmentation is the next Plan-specific slice so the shell redesign does not couple itself to Capacity/Goals internals.

### + / Quick Add
Answer: **What do I want to record or start right now?**

Quick Add is an isolated interaction component. It must not contain business persistence. It routes user intent to capabilities through the composition root or public contracts.

The future Universal Logger and Focus Timer may contribute actions without requiring Quick Add to know their private implementation.

### Progress
Answer: **How am I doing over time?**

Progress owns user-facing progress/history composition. Legacy Week and History views are transitional inputs and should disappear from primary navigation.

### Insights
Answer: **What patterns are appearing in my data?**

Insights must never invent conclusions. It follows the canonical observation thresholds and uses association-only language.

## Progressive disclosure
Every capability follows one data model and one set of rules:

```text
same domain + same API + same validation
                  |
          presentation depth
           /              \
       Easy              Detailed
```

Easy mode shows the minimum fields needed for the common action. Detailed mode reveals advanced scheduling, measurement, effective dates and other controls.

Do not create separate easy-mode and advanced-mode business implementations.

## Recursive modularity
The car-parts rule applies to the experience layer as strongly as to backend modules.

Examples:
- replacing the Focus Timer must not change Logger persistence;
- changing the Energy editor must not change Sleep or Goals;
- redesigning Capacity cards must not change Capacity calculations;
- changing the Quick Add sheet must not require changing Today, Progress or Plan internals;
- replacing a page shell should affect only the shell and explicit public contributors.

A composition root may wire capabilities together. Private feature files may not reach into one another's DOM or persistence.

## Human-facing language
Implementation terminology stays out of normal UI. Avoid phrases such as:
- module registry;
- public contract;
- failure boundary;
- effective-dated plan version;
- persistence adapter.

Translate concepts into user language such as:
- `Start this change on…`;
- `How full is your plan?`;
- `Fixed & recurring time`;
- `Time for your goals`.

Technical terms remain valid in architecture docs, developer diagnostics and advanced help when genuinely useful.

## Current staged redesign

Slice 1 — Experience shell:
- canonical primary navigation;
- Settings moved out of primary navigation;
- isolated Quick Add sheet;
- Today uses progressive disclosure for Energy;
- Week + History become one Progress surface;
- Insights gets an evidence-aware empty/data-collection state;
- Plan removes developer-facing architecture copy.

Slice 2 — Plan workspace:
- Goals / Capacity / Schedule / Compass segmentation;
- Capacity summary separated from recurring Schedule editor;
- advanced controls progressively disclosed.

Slice 3 — Universal Logger:
- exact editable logging;
- recent repeat;
- measurement-aware fields;
- historical edit/delete.

Slice 4 — optional Focus Timer module:
- independent countdown state;
- notification adapter;
- optional public handoff to Logger;
- removal does not break any other capability.

## Acceptance principle
A redesign is successful only if it improves comprehension and interaction without weakening module isolation or changing historical/product semantics accidentally.
