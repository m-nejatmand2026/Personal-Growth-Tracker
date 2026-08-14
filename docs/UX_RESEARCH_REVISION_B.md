# Growth Compass - Revision B UX research notes

Date: 14 August 2026

Status: supporting research for the active `EXPERIENCE_ARCHITECTURE.md` Revision B contract.

This document records product patterns that informed the Growth Compass simplicity / human-language UX direction. It is not a feature-copying specification. Growth Compass keeps its own product model, privacy rules, factual-history semantics and modular architecture.

## Research question

How can Growth Compass provide more capability than a conventional planner while feeling easier to understand and operate?

The answer is not to place more functionality on screen. The strongest pattern across the reviewed products is to keep capture and daily orientation simple while making deeper controls available only when needed.

## Structured

Official sources reviewed:

- Getting Started With Structured: https://help.structured.app/en/articles/380546
- Tasks & Timeline help category: https://help.structured.app/en/categories/1823490
- Structured product/get-started material: https://structured.app/blog/getstarted

Observed useful patterns:

1. The daily timeline is the first thing the user sees.
2. Unscheduled thoughts can go to an Inbox instead of requiring immediate organization.
3. The Timeline can switch between daily, weekly and monthly views.
4. Drag/drop and replan concepts make changing plans normal rather than exceptional.
5. Visual icons and color support fast recognition.
6. The product frames planning as flexible rather than as compliance with a rigid plan.

Growth Compass implication:

- Today should orient the person before exposing management controls.
- Capture should be possible before complete categorization where domain integrity allows it.
- Day/week/month/year perspectives should feel like normal views of the same facts.
- Unfinished intentions should support explicit review choices rather than automatic catch-up debt.

## Todoist

Official sources reviewed:

- Today view: https://www.todoist.com/help/articles/plan-your-day-with-the-today-view-UVUXaiSs
- Getting started: https://www.todoist.com/help/articles/get-started-with-todoist-OgNNJR
- Cleaner, simpler Quick Add update: https://www.todoist.com/de/help/articles/a-cleaner-simpler-quick-add-june-29-PuIpiLmLh

Observed useful patterns:

1. The Today view gathers today's work across projects so the user does not have to navigate project structure first.
2. Inbox capture allows a person to get something out of their head before deciding where it belongs.
3. Quick Add is intentionally kept visually focused while secondary task details remain available.
4. Natural-language-oriented capture reduces form-like interaction.
5. Today/Upcoming support different time horizons without changing the underlying task concept.
6. Rescheduling is presented as normal flexibility rather than failure.

Growth Compass implication:

- Logger should optimize for capture speed, not module/data-model education.
- Existing Activities should autocomplete; missing Activities should be creatable in context.
- Advanced details should not dominate the first interaction.
- Time-perspective changes should reuse the same underlying facts.

## Tiimo

Official sources reviewed:

- Product overview: https://www.tiimoapp.com/product
- Visual planning: https://www.tiimoapp.com/product/visual-planning

Observed useful patterns:

1. Visual planning is designed to reduce executive-function load.
2. Big tasks can be broken into smaller steps.
3. Flexible scheduling and drag/drop are core rather than edge cases.
4. Review Today supports recovery when plans change.
5. Visual timers help make time concrete.
6. The product explicitly presents planning as adaptable and no-pressure.

Growth Compass implication:

- Capacity should make time concrete in hours/minutes rather than abstract labels.
- Revision B should minimize simultaneous decisions.
- A future Guide/Replan experience should ask whether to keep, move, reduce or drop unfinished plans.
- Changed plans should not produce guilt or automatic debt.
- Future focus/timer features must remain separate modules and must not silently write Progress.

## Inflow

Official source reviewed:

- How it works: https://www.getinflow.io/how-it-works

Observed useful patterns:

1. The product uses focused, small learning modules rather than one large configuration surface.
2. Topics such as anxiety, procrastination, impulsivity and avoidance are presented as guided units.
3. The product is based on CBT principles, but the important interaction lesson for Growth Compass is the size and sequencing of decisions.

Growth Compass implication:

- Growth Compass Version 1 Beta is not a therapy product and should not make medical/CBT claims.
- It can still adopt the general UX principle of one small guided decision at a time.
- Future Guide functionality should be modular, transparent and non-diagnostic.

## To-Do List - Schedule Planner

Public App Store source reviewed:

- https://apps.apple.com/de/app/to-do-list-schedule-planner/id6742735085

Observed useful patterns:

1. Daily, weekly, monthly and future planning perspectives are advertised directly.
2. Categories and tags are customizable.
3. Recurring schedules and reminders use familiar task-planner language.

Growth Compass implication:

- Life Areas must look user-owned, not hard-coded.
- Period switching should be obvious rather than hidden behind internal terminology.

## What Growth Compass should not copy

Growth Compass should not become a conventional task manager with more charts.

Do not copy:

- streak pressure;
- generic productivity scoring;
- automatic conversion of plans into completed Progress;
- unsupported wellbeing/productivity causal claims;
- founder-specific categories as a global ontology;
- automatic wearable-to-goal Progress conversion;
- a monolithic AI assistant that owns business data.

## Growth Compass differentiation

The intended product chain is:

```text
Capture
  -> realistic Capacity
  -> Goals
  -> Daily Plan
  -> explicit factual Progress
  -> Wellbeing context
  -> evidence-gated Insights
  -> optional user-approved guidance
```

The differentiator is not the number of features. It is the integrity of the relationships among these capabilities while keeping each interaction simple.

## Revision B design principles derived from research

1. Capture first; organize deeper details later when safe.
2. One primary question/action per interaction stage.
3. Human questions before data-model terms.
4. Contextual creation for missing Activities and Life Areas.
5. Visible time reality instead of productivity judgments.
6. Multiple time perspectives over the same facts.
7. Explicit recovery when plans change.
8. Calm visual hierarchy and accessible but brand-aligned focus states.
9. Advanced capability remains one tap away but off the easy path.
10. Never trade factual integrity, privacy or module isolation for apparent simplicity.

## Evidence status

This research informs design decisions but does not prove that a specific pattern will work for Growth Compass users. Real preview testing remains mandatory. The 14 August 2026 walkthrough demonstrated that automated correctness is insufficient for UX acceptance, so future UX slices require both automated gates and real rendered walkthroughs.
