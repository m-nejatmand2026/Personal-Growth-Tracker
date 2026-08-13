# Growth Compass — Version 1 experience architecture

Status: active UX redesign contract. This document complements `MODULARITY_STANDARD.md`; the Modularity Standard wins if they conflict.

## Design source and naming

The experience is informed by the supplied Growth Compass platform presentation and accompanying platform specification dated 12 August 2026: personal operating-system framing, Today as a command center, the Universal Logger as the core interaction, Life Capacity, Actual/Minimum/Target progress, evidence-gated Insights and AI proposals that require approval.

Repository/product naming remains **Growth Compass — Version 1 Beta**.

## North star

A normal user should quickly answer: What is my state today? How much time reality do I have? What do I intend to do today or tomorrow? What matters in my longer-term goals? What have I logged? What is the fastest useful next action? What do I want to remember or reflect on?

The user should understand Today in about five seconds and log or plan a common action in under ten seconds.

## Primary navigation

```text
Today | Plan | + | Progress | Insights
```

Settings and Journal are secondary capabilities. Desktop may use a persistent rail; mobile uses bottom navigation. They are responsive presentations of the same contract, not separate applications.

## Today — daily command center

Required order:
1. command/header with Logger action;
2. Daily State;
3. Time Reality / Capacity;
4. **Daily Plan** with Today and Tomorrow;
5. weekly Goal direction with Actual / Minimum / Target;
6. recent completed activity;
7. compact Journal entry point/preview;
8. Energy map progressively disclosed.

A missing optional module must degrade locally rather than blanking Today or fabricating values.

## Daily Plan — short-horizon intentions

Daily Plan is deliberately not the same object as a long-term Goal.

```text
Goal                long-term direction
Daily Plan item     dated intention
Progress Record     historical fact
```

A person can plan tonight for tomorrow, plan something for Today, or mark an item Doing now.

```text
Planned → Doing now → Done
```

Generic items require only title + date. Activity-linked items may carry a focus/subtype and expected duration. Today and Tomorrow are first-class. An unfinished item remains on its original date; nothing automatically rolls forward as catch-up debt. Activity-linked Done opens Logger to confirm actual minutes. Only explicit completed Logger save creates factual Progress. Generic items may complete without creating Progress.

See `DAILY_PLAN_AND_JOURNAL_SPEC.md`.

## Universal Logger

The center `+` opens Logger directly. For an Activity, Logger supports:

```text
Plan | Doing now | Done
```

It owns Activity selection, optional subtype/focus, Activity-aware subtype hints, exact 1–1440 minute duration, presets as accelerators, date, note and recent repeats. Plan/Doing now hand off to Daily Plan. Done explicitly saves completed progress. Logger does not own Daily Plan persistence.

## Journal — private reflection

Journal is a separate optional module, not an extension of Progress. Easy path: open Journal, write, save. Optional depth: Free write, Morning, Evening or Reflection prompts; title; tags; date; search/review/edit/delete.

Version 1 Beta privacy boundary: Journal text is not consumed by Progress, Insights or AI Planner. Future AI use requires explicit permission. No streaks or journaling-pressure mechanics are added.

## Plan

Plan answers: **What am I trying to do, and does it fit my real life?**

```text
Goals | Capacity | Schedule | Compass
```

Daily Plan is intentionally not hidden inside long-term Plan management; short-horizon planning belongs close to Today.

## Progress

Progress is **Actual vs Minimum vs Target**. Planned Daily Plan items and Journal entries do not count as Actual. No streak pressure and no catch-up debt.

## Insights

Evidence thresholds remain 0–6 readiness only; 7–20 descriptive; 21–41 early associations; 42+ stronger non-causal association summaries. Journal content is excluded. Never fabricate an association.

## Progressive disclosure

```text
same domain + same API + same validation
                  |
          presentation depth
           /              \
       Easy              Detailed
```

Normal screens show the minimum useful information; details appear only when requested.

## Recursive modularity

The car-parts rule applies to every experience component: replacing Logger must not change Capacity; changing Today must not change Progress persistence; replacing Daily Plan must leave manual completed logging available; replacing Journal must not change Today, Progress, Insights or Goals beyond its explicit slot disappearing; replacing Energy must not change Sleep or Context. Private implementations may not read another module’s private tables or manipulate another module’s private DOM.

## Interaction accessibility

Modal/sheet experiences follow the platform modal contract: focus enters the dialog, Tab/Shift+Tab stay inside, Escape closes, and focus returns to the invoker. Mobile controls use comfortable touch targets, with approximately 44px targets for frequent actions where practical.

## Iteration history

### Iteration 1 — rejected prototype
Corrected navigation, but remained generic, card-heavy and insufficiently interactive.

### Iteration 2 — platform-reference direction
Introduced responsive OS shell, command-center Today, Life Capacity, direct Logger, stronger Progress and evidence-ready Insights.

### Iteration 2.1 — action lifecycle
Phone use exposed that a person may open Growth Compass before doing an Activity. Plan/Doing now/Done were separated from factual completion.

### Iteration 2.2 — Daily Plan + Journal
The short-horizon lifecycle is generalized beyond Activities into a true Today/Tomorrow Daily Plan, while Journal becomes an independent private-reflection module. Both keep easy first-use flows and deeper optional controls.

## Acceptance principle

A redesign is successful only if it materially improves comprehension and speed **without** weakening historical integrity, calculations, privacy or module isolation.
