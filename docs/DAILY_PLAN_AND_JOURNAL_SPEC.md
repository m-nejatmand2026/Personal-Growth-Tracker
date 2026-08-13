# Growth Compass — Daily Plan and Journal contract

Status: active Version 1 Beta product/engineering contract for the short-horizon planning and private-reflection slice.

This document complements the canonical Version 1 Beta product specification and `MODULARITY_STANDARD.md`. If this document conflicts with the Modularity Standard, the Modularity Standard wins.

## Why these are separate capabilities

Growth Compass already has long-horizon **Goals** and factual **Progress Records**. Two additional needs are different enough that they must not be squeezed into those models:

1. **Daily Plan** answers: “What do I intend to do today or tomorrow?”
2. **Journal** answers: “What do I want to remember, reflect on, or write down?”

A Daily Plan item is not a Goal and is not completed Progress. A Journal entry is not a score, task, or analytics input.

This separation protects meaning and makes both capabilities removable without changing Goals, Progress, Capacity, Insights or each other.

## Daily Plan

### Mental model

```text
Goal                long-term direction / outcome
Daily Plan item     dated short-horizon intention
Progress Record     what actually happened
```

Typical use:

```text
Tonight:
Tomorrow → Back workout → 60 min expected

Tomorrow:
Planned → Doing now → Done
                     |
                     └─ if linked to an Activity, confirm actual minutes in Logger
```

The user may also add a generic item such as `Call Mum` or `Prepare documents` without attaching an Activity or duration.

### Rules

- title is required, maximum 160 characters;
- date is required;
- Today and Tomorrow are first-class shortcuts, but any explicit civil date is valid;
- optional planned time;
- optional expected duration, 1–1440 minutes;
- optional note, maximum 500 characters;
- optional Activity link and focus/subtype when created through Logger;
- statuses: `planned`, `in_progress`, `completed`, `dismissed`;
- `Doing now` is valid only for the current day in the normal logger flow;
- an Activity-linked item opens Logger when completed so actual duration can be confirmed;
- a generic item can be marked complete without manufacturing a Progress Record;
- Daily Plan never contributes to Actual progress until a real Progress Record is explicitly saved;
- Daily Plan never rewrites Goal target history or Capacity commitments.

### No automatic debt

An unfinished item stays on the date where it was planned. It does **not** silently appear on the next day and does not reduce the next day's score.

Moving/copying an old item is an explicit future action, never an automatic catch-up mechanism.

### Easy / detailed

Default entry:

```text
What do you want to do?
[______________________]

Today | Tomorrow

[ Add to plan ]
```

Optional details are progressively disclosed: exact date, planned time, expected duration and note. The same record and validation are used in both views.

## Journal

### Purpose

Journal is private free-form reflection inside Growth Compass. It should be quick enough for one sentence and deep enough for a long entry. It deliberately avoids turning reflection into another performance system.

### Entry model

Each entry has date; optional title (maximum 120 characters); required body (maximum 20,000 characters); mode `free`, `morning`, `evening` or `reflection`; up to 8 optional tags (maximum 30 characters each); and created/updated timestamps. Multiple entries on one date are allowed.

### Writing modes

**Free write** — no prompt required.

**Morning**
- What matters most today?
- How do I want to show up?
- What can wait?

**Evening**
- What went well?
- What was difficult?
- What did I learn?
- What matters tomorrow?

**Reflection**
- What happened?
- What did I notice in myself?
- What do I want to remember or do differently?

Prompts are optional writing aids. Choosing a mode must never force a questionnaire.

### Review

The Journal surface supports newest-first entries, text search across title/body, exact-date filtering, edit, delete with confirmation, and tags for lightweight organization.

Rich text, media, audio, multiple named journals and biometric locking are intentionally **not** part of this first slice. Those are extension points, not reasons to make the first interaction heavy.

### Privacy boundary

For Version 1 Beta:

- Journal text is excluded from Progress calculations;
- Journal text is excluded from Insights;
- Journal text is excluded from AI Planner inputs;
- Journal text is included in user export because it belongs to the user;
- future AI/reflection analysis requires a separate explicit permission contract;
- observability must never log entry bodies or notes.

Journal privacy is a product boundary, not merely visual copy.

## Mobile interaction standard

Phone use is the primary acceptance surface for this slice.

- primary actions target approximately 44×44 CSS px where practical;
- no required drag gesture;
- modal/sheet flows keep keyboard focus inside while open;
- Escape closes on keyboard-capable devices;
- focus returns to the invoking control after close;
- sheet content can scroll independently on a small viewport;
- destructive actions require explicit confirmation;
- Today/Tomorrow can be reached without navigating through long-term Goal management.

## Modular ownership

### Daily Plan module owns
- schema/migration;
- validation and status transitions;
- API/data access;
- Today/Tomorrow presentation;
- editor;
- module tests;
- export contribution until module-owned export contracts replace the transitional central export.

### Journal module owns
- schema/migration;
- validation;
- API/data access;
- prompts;
- Journal view and editor;
- Today preview contribution;
- module tests;
- export contribution until module-owned export contracts replace the transitional central export.

### Platform owns
- generic modal focus behavior;
- generic navigation/composition primitives;
- generic transport and styling primitives.

Neither Daily Plan nor Journal may read another module's private table or private DOM.

## Deliberately deferred depth

“Sophisticated” does not mean exposing every possible control on day one. The following are intentionally deferred until the core flows pass phone acceptance:

- Daily Plan subtasks, priorities, recurring items, reminder notifications and drag reordering;
- Journal rich text, media/audio, bookmarks, multiple journals, biometric/app lock and AI-assisted reflection.

The data/module boundaries leave room for these features, but adding them before the simple Today/Tomorrow and write/review flows are proven would increase friction and coupling. Reminder notifications will also be a separate capability from an active Focus Timer.

## Release-blocking acceptance

### Daily Plan
- add a generic item for Today with only a title;
- add a generic item for Tomorrow;
- add an Activity-linked Tomorrow item through Logger;
- planned item does not increase Progress;
- Start changes only Daily Plan status;
- Activity-linked Done opens prefilled Logger;
- changing planned 60m to actual 52m saves 52m Progress;
- generic Done closes the plan item without creating fake Progress;
- moving/editing date is explicit;
- unfinished yesterday does not appear automatically Today;
- deleting/removing Daily Plan leaves historical Progress untouched.

### Journal
- create one-sentence free entry;
- create long entry;
- use each optional prompt mode without forced answers;
- multiple entries on one date;
- edit title/body/date/tags;
- search by title/body;
- filter exact date;
- delete with confirmation;
- no Journal body appears in Insights or Progress;
- export contains Journal entries.

### Mobile/accessibility
- 375px viewport has no horizontal scroll in the core flows;
- Today/Tomorrow plan controls are finger-sized;
- logger, plan editor and journal editor remain usable with onscreen keyboard;
- focus is trapped in modal/sheet while open and restored after close;
- primary bottom navigation remains `Today | Plan | + | Progress | Insights`.
