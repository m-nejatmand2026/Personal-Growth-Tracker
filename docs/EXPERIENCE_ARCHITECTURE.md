# Growth Compass — Version 1 Beta experience architecture

Status: **Revision B - Simplicity / Human-Language UX is the active experience contract as of 14 August 2026.**

This document complements `MODULARITY_STANDARD.md`. If they conflict, the Modularity Standard wins.

## Why Revision B exists

Revision A successfully established the responsive shell, Today hierarchy, Universal Logger, Plan, Progress, Insights, design tokens, accessibility primitives and module-owned presentation. It passed the automated acceptance suite and reached 192/192 tests.

The first real preview walkthrough then failed the human usability gate. The application was technically coherent but still required the person to understand internal product concepts before using it. Examples observed in the preview walkthrough:

- the center `+` / Log action was not optically centered;
- the global focus treatment was visually too vivid for the interface;
- `More details` looked too much like an input rather than an expandable disclosure;
- Logger did not make it obvious how to create a new Activity in context;
- `Your weekly direction` was too rigid and did not expose day/week/month/year perspectives;
- Capacity language such as `Spacious` and `How full?` was unclear;
- Life Areas felt like fixed product categories rather than personal user-owned structure;
- Goal measurement language such as `milestone`, `target value`, and `unit` exposed implementation concepts instead of human questions.

Revision B therefore does not replace the architecture. It replaces the interaction language and easy-path design.

## North star

A new user should not need to understand Growth Compass before using Growth Compass.

The product may be sophisticated underneath, but the surface should expose only the next useful decision.

```text
More capability underneath.
Less complexity on the surface.
```

The normal user should be able to answer quickly:

- What is my state today?
- What time do I realistically have?
- What do I want to do next?
- What matters longer term?
- What actually happened?
- What should I move, reduce, keep, or drop when plans change?
- What patterns are supported by enough evidence?

Targets remain:

- understand Today in about five seconds;
- capture or plan a common action in under ten seconds;
- create a missing Activity or Life Area without leaving the context where it is needed;
- avoid requiring domain terminology for the normal path.

## Primary navigation

```text
Today | Plan | + | Progress | Insights
```

The center `+` opens Logger directly and must be optically centered, visually distinct and reachable with a comfortable touch target.

Journal and Settings remain secondary. Mobile uses bottom navigation; desktop may use a persistent rail. They are responsive presentations of the same navigation contract.

## Human-language rule

Normal screens must not require the user to understand implementation-shaped terms.

Avoid on the easy path when a plain-language question is possible:

- measurement type;
- target value;
- unit;
- subtype;
- plan load;
- milestone as an unexplained data type;
- compatibility or architecture terminology.

Prefer questions and examples:

```text
What did you do?
How long did it take?
When do you want to do it?
How will you know you are making progress?
Aim for [3] [hours] per [week].
```

Technical terms may exist in advanced configuration when they are explained in context.

## Progressive disclosure contract

Every normal user-facing capability has two presentation depths over the same domain contract:

```text
same records + same API + same validation
                 |
          presentation depth
          /                \
      Easy                 Detailed
```

Easy path:

- minimum decisions;
- sensible defaults;
- examples instead of jargon;
- contextual creation;
- one primary action;
- optional information stays out of the way.

Detailed path:

- advanced measurement configuration;
- dates and times;
- scheduling details;
- minimum/target tuning;
- descriptions, notes and metadata;
- expert controls.

The detailed path must never become a second incompatible implementation.

## Universal Logger - Revision B

The center `+` opens Logger directly.

Primary meaning selector:

```text
Plan | Start now | Done
```

Selected-mode helper text explains the consequence:

- `Plan` - schedule this for later;
- `Start now` - put this into today without recording completed Progress;
- `Done` - record what actually happened.

### Easy path

The first field is conceptually:

**What did you do?**

Existing Activities appear as suggestions. If the typed Activity does not exist, Logger offers an explicit contextual action such as:

```text
+ Create "Guitar practice" as a new Activity
```

The person must not leave Logger and navigate to an Activity-management screen merely to continue logging.

The easy path contains:

1. meaning: Plan / Start now / Done;
2. Activity or new Activity creation;
3. duration where relevant;
4. one primary save/start/plan action.

Recent repeats become compact one-tap accelerators, not the dominant first section.

### More details

The disclosure must visibly communicate that it expands, for example:

```text
More details - focus, date, time, note  >
```

When expanded it may expose:

- focus / variation / subtask;
- date;
- start time;
- note.

The UI may use the internal concept `subtype`, but the normal person-facing label should be something like `Focus / variation` rather than `Subtype`.

Plan and Start now hand off to Daily Plan. Done creates factual Progress only after explicit confirmation. Logger does not own Daily Plan persistence.

The runtime Logger is registry-owned. Activity choices come from
`/api/v1/activities`, completed facts go to `/api/v1/progress`, and Plan or
Start now intentions go to `/api/v1/daily-plan`. There is no runtime fallback
to legacy session writes or founder-specific activity seeds.

## Today - Revision B

Today remains a composition surface, not a business monolith.

Its table-free Worker contract, `GET /api/v1/today`, combines weekly direction
and recent facts only through the public Activities, Plans and Progress
contracts. The frontend then combines those facts with module-owned Capacity,
Wellbeing, Daily Plan and Journal contributions. Primary runtime does not
consume the legacy bootstrap, week, history, session or energy endpoints.

Required conceptual order:

1. date / state and immediate command action;
2. Daily State / Wellbeing;
3. Time Reality / Capacity;
4. next action and Daily Plan for Today/Tomorrow;
5. Progress direction;
6. recent factual activity;
7. compact Journal entry point;
8. Energy detail progressively disclosed;
9. future Guide slot only when a Guide module actually exists.

### Progress direction period switcher

Replace the fixed `Your weekly direction` concept with a clear perspective control:

```text
Day | Week | Month | Year
```

Actual Progress can aggregate over the selected period.

Minimum/Target must never be fabricated by naive division or multiplication. Show them only when the selected period has a legitimate target or an explicitly supported conversion. Otherwise show plain language such as:

`No target set for this period.`

Historical facts remain unchanged when the view changes.

## Wellbeing observations

Wellbeing independently owns profile-scoped Energy, Sleep and Day Context
observations. Canonical writes use `/api/v1/wellbeing/energy`,
`/api/v1/wellbeing/sleep` and `/api/v1/wellbeing/context`. These remain optional
observations, not performance scores or evidence of causation.

## Capacity - ordinary language

Capacity is physical time reality, not a score of personal worth or productivity.

Prefer concrete statements:

```text
35 h available this week
9 h planned
26 h still flexible
Your current plan uses 26% of your flexible time.
```

Avoid unexplained labels such as `Spacious` or `How full?` on the primary path. A qualitative interpretation may appear secondarily only when its meaning is obvious.

No guilt, failure, catch-up debt or moral framing.

## Daily Plan

Daily Plan remains distinct from Goals and Progress:

```text
Goal                long-term direction
Daily Plan item     dated intention
Progress Record     historical fact
```

Lifecycle:

```text
Planned -> Doing now -> Done
```

Today and Tomorrow are first-class. Generic items require only title + date. Activity-linked items may carry focus and expected duration.

Unfinished work does not silently roll forward. A future review/replan interaction should ask what the person wants to do with it: keep, move, reduce, complete, or drop. No catch-up debt is created.

Only explicit completed Logger confirmation creates factual Progress for Activity-linked work.

## Plan

Plan answers:

**What am I trying to do, and does it fit my real life?**

Conceptual sections remain:

```text
Goals | Capacity | Schedule | Compass
```

The normal flow starts with Goals and time reality. Daily Plan remains close to Today rather than being buried inside long-term Plan.

## Life Areas - personal, not product ontology

Life Areas are user-owned organization.

The product may offer optional starter suggestions, but must not present founder/default categories as the ontology.

The user can:

- create a Life Area in context;
- rename it;
- reorder it;
- archive it;
- remove it when allowed without destroying historical facts.

Example starter suggestions may include Health & wellbeing, Learning, Relationships, Career, Creativity, Home, Finance or other common areas, but the person is free to ignore all of them.

When a Life Area selector is shown, `+ New life area` must be available in the same context.

## Goal editor - human questions first

The easy path should start with:

- Goal name;
- Life Area.

Then ask:

**How will you know you are making progress?**

Choices should explain themselves with examples, such as:

- `Time spent` - e.g. 3 hours of guitar;
- `Quantity` - e.g. 50 pages;
- `Completed` - e.g. submit the application;
- `Milestones` - e.g. finish Level 1.

Where a numeric target is used, prefer sentence construction:

```text
Aim for [3] [hours] per [week]
```

Minimum, priority, status, descriptions and advanced measurement options remain progressively disclosed.

## Progress

Progress is factual historical evidence.

It supports mixed measurements, including time, quantity and yes/no/completion facts as allowed by the canonical contract.

Actual / Minimum / Target remain explicit where they are legitimate. Planned items and Journal entries never become Actual.

No streak pressure. No catch-up debt. Preserve historical facts.

## Insights

Evidence thresholds remain:

- 0-6 tracked days: readiness only;
- 7-20: descriptive summaries;
- 21-41: early associations when genuinely paired observations exist;
- 42+: stronger association summaries, still non-causal.

Sample size must be visible. Journal content remains excluded in Version 1 Beta. Never fabricate an association.

Insights reads canonical Progress and Wellbeing contracts only. If either is
unavailable, it shows an evidence-unavailable state rather than falling back
to legacy bootstrap data or inventing observations.

## Journal

Journal remains optional and private.

Easy path: write and save.

Optional depth: Free write, Morning, Evening, Reflection, title, tags, date, search, edit and delete.

Journal text is excluded from Progress, Insights and AI in Version 1 Beta unless a future contract explicitly changes that with permission.

No journaling streaks or pressure mechanics.

## Neurodivergent / executive-function design principles

Growth Compass is not a medical or therapy product in Version 1 Beta, but it may adopt broadly useful interaction patterns from products designed for executive-function challenges.

Required principles:

1. Reduce decision count at the moment of action.
2. Make time visible and concrete.
3. Let users capture first and organize later when safe.
4. Break complex configuration into small guided decisions.
5. Make changed plans recoverable without guilt.
6. Prefer flexible rescheduling/review over automatic debt.
7. Keep visual hierarchy calm and avoid unnecessary vivid states.
8. Never hide factual consequences of an action.

## Visual accessibility

Accessibility is not optional, but accessibility styling must belong to the visual system.

Focus indicators remain clearly visible for keyboard users, but should use Growth Compass visual language rather than an unnecessarily vivid electric-blue treatment. A calmer brand-aligned border/halo is preferred if contrast and visibility remain sufficient.

Modal/sheet contract remains:

- focus enters the dialog;
- background is isolated/inert;
- Tab and Shift+Tab remain within the dialog;
- Escape closes;
- focus returns to the invoker;
- background scrolling is prevented while modal content is active.

Frequent mobile controls target approximately 44px or larger. Support reduced motion. No horizontal scrolling at 375px.

Charts remain supplementary to text and always expose equivalent readable values.

## PWA / install behavior

Preserve existing install behavior:

- Android may use the browser/platform install flow when available;
- iPhone provides explicit Safari Add to Home Screen guidance because iOS does not expose the same install prompt flow;
- installed standalone mode should not repeatedly show install guidance;
- safe-area behavior must remain correct around bottom navigation and install sheets.

## Recursive modularity

The car-parts rule remains mandatory for every experience component.

Changing Logger must not change Capacity. Changing Today must not change Progress persistence. Replacing Daily Plan must leave manual completed logging available. Replacing Journal must not change Goals, Progress or Insights beyond its explicit slot disappearing. Replacing one Wellbeing observation type must not mutate unrelated observation modules.

Private implementations may not read another module's private tables, import private implementation files, or reach into another module's DOM.

Cross-module frontend facts have one declared publisher, and the composition
root chooses reactions without turning facts into commands. Legacy Beta reads
remain isolated compatibility data for the original profile; new runtime writes
and profile-scoped exports use Version 1 module contracts.

## External product research - principles, not copying

Revision B is informed by current public product patterns observed in Structured, Todoist, Tiimo, Inflow and To-Do List - Schedule Planner.

The intent is not to reproduce another product. The useful principles are:

- Structured: timeline-first daily comprehension, inbox/capture, day/week/month perspective, drag/replan flexibility;
- Todoist: very low-friction capture, contextual detail, Today/Upcoming perspectives, natural-language-oriented task entry and recent simplification of Quick Add;
- Tiimo: visual planning, flexible schedule adjustment, reduced executive-function burden, task breakdown and no-pressure recovery when plans change;
- Inflow: small guided steps and focused learning modules rather than a giant configuration surface;
- To-Do List - Schedule Planner: immediately understandable daily/weekly/monthly/future perspectives and user-customizable categories.

Detailed references are recorded in `UX_RESEARCH_REVISION_B.md`.

## Iteration history

### Iteration 1 - rejected prototype
Corrected navigation but remained generic, card-heavy and insufficiently interactive.

### Iteration 2 - platform-reference direction
Introduced the responsive operating-system shell, command-center Today, Capacity, direct Logger, stronger Progress and evidence-ready Insights.

### Iteration 2.1 - action lifecycle
Separated Plan / Doing now / Done from factual completion.

### Iteration 2.2 - Daily Plan + Journal
Generalized short-horizon planning and established Journal as an independent private-reflection module.

### Revision A - architecture-safe experience implementation
Implemented design system, responsive shell, Today, Logger, Plan, Progress, Insights and final accessibility/regression hardening. Automated suite reached 192/192 passing.

### Revision B - simplicity / human-language UX
Triggered by real preview walkthrough on 14 August 2026. Revision A remains the architectural/presentation foundation, but its human interaction model is not accepted as final. Revision B is now the active UX/UI direction.

## Revision B acceptance gate

Revision B is successful only if a normal user can operate the product without learning its data model.

Release-blocking UX checks include:

- center `+` is optically centered and clearly primary;
- Logger supports contextual new-Activity creation;
- focus styling is accessible but visually calm;
- expandable controls look expandable;
- Today period switching is understandable and does not invent targets;
- Capacity uses concrete time language;
- Life Areas are visibly user-owned and creatable in context;
- Goal measurement setup uses plain language and examples;
- 375px layout has no horizontal overflow;
- keyboard/modal/reduced-motion/chart-text-equivalent/PWA behavior remains intact;
- architecture boundary tests remain green;
- real phone and desktop preview walkthrough is required before acceptance.

A UX revision is not accepted merely because automated tests pass.
