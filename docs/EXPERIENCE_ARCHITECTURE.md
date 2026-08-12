# Growth Compass — Version 1 experience architecture

Status: active UX redesign contract. This document complements `MODULARITY_STANDARD.md`; the Modularity Standard wins if they ever conflict.

## Design source and naming

The second experience iteration is deliberately informed by the supplied Growth Compass platform presentation and accompanying platform specification dated 12 August 2026. Those references are used for product/visual direction: personal operating-system framing, Today as a command center, the universal logger as the core interaction, clear Life Capacity, Actual/Minimum/Target progress, evidence-gated Insights and AI proposals that require approval.

Repository/product naming remains **Growth Compass — Version 1 Beta**. The supplied reference files do not create a second product/version line in this repository.

## North star

The visible product should feel like a personal-development operating system rather than a habit list or configuration console.

A normal user should be able to answer these questions quickly:

- What is my state today?
- How much time reality do I have?
- What matters today?
- What have I already logged?
- What is the fastest useful next action?

The user should understand Today in about five seconds and be able to log a common action in under ten seconds.

## Primary navigation

```text
Today | Plan | + | Progress | Insights
```

Settings is secondary. On narrow screens it lives in the header; on wide screens it lives in the application rail.

Desktop may use a persistent left rail. Mobile uses the bottom navigation. They are two responsive presentations of the same navigation contract, not separate applications.

## Visual language

The experience uses:

- deep teal as the operating-system/navigation accent;
- dark navy for strong analytical surfaces;
- white/off-white content surfaces;
- restrained mint, sky, lavender and warm accent tints for state categories;
- compact information cards with clear hierarchy;
- stronger dashboard composition on desktop and focused vertical flows on mobile.

Avoid decorative card overload. Every surface should communicate a state, action, comparison or explanation.

## Today — daily command center

Today is a composition surface, not a spreadsheet.

Required presentation order:

1. compact command/header area with the primary `Log progress` action;
2. Daily State summary (Energy, actual Sleep, Day Context as those modules become available);
3. Time Reality / Capacity summary;
4. today-relevant Goals showing Actual / Minimum / Target;
5. recent activity with repeat access;
6. detailed Energy map progressively disclosed.

A missing optional module must degrade locally. For example, until actual Sleep logging exists, Today may show an explicit “not logged / coming next” state; it must not fabricate sleep values.

## Universal Logger

The center `+` opens the logger directly. It is not a generic menu that makes the user choose “log progress” again.

Current beta logger responsibilities:

- Activity selection from available data;
- optional subtype/focus while the dedicated Activity model is still transitional;
- exact integer duration 1–1440 minutes;
- preset durations as accelerators only;
- selected date, editable;
- optional note, maximum 500 characters;
- up to three recent unique activity + subtype + duration combinations;
- recent repeat prefills but never auto-saves;
- explicit `Save progress` action.

The logger talks only to public API/core boundaries. Today may request the logger with a prefill; it must not write logger form DOM or persistence directly.

When the Version 1 Progress Records API replaces legacy session persistence, the logger UI contract should remain stable while its internal persistence adapter changes.

## Plan

Plan answers: **What am I trying to do, and does it fit my real life?**

The Plan overview should summarize active Goals, flexible time, Plan Load and current plan state before exposing management forms.

The target mental model remains:

```text
Goals | Capacity | Schedule | Compass
```

During the beta transition, existing registered Plan modules remain independent and are composed under this overview. Normal UI must not expose terms such as module registry, public contract, persistence adapter or failure boundary.

## Progress

Progress is built around **Actual vs Minimum vs Target**.

The primary weekly surface should show:

- overall target progress;
- how many goal minimums are reached;
- actual and target time totals;
- week status;
- per-goal Actual, Minimum and Target values with a visible minimum marker;
- recent history with explicit deletion confirmation.

No streak pressure and no catch-up debt language is allowed.

## Insights

Insights follows the canonical evidence thresholds:

- 0–6 tracked/paired observations: readiness only;
- 7–20: descriptive summaries;
- 21–41: early association signals when genuinely paired data exists;
- 42+: stronger association summaries, still non-causal.

Never fabricate an association because one side of the relationship is missing. Until actual Sleep and Day Context records are connected, the UI should explicitly say relationship cards are waiting for paired data.

Every future relationship card shows N and uses language such as `associated with` or `tends to coincide with`, never causal wording.

## Progressive disclosure

Easy and advanced views use one domain model, one API contract, one validation path and one calculation model.

```text
same domain + same API + same validation
                  |
          presentation depth
           /              \
       Easy              Detailed
```

Normal screens show the minimum useful information. Detailed measurement settings, effective dates, advanced recurrence and historical controls appear only when requested.

## Recursive modularity

The car-parts rule applies to every experience component:

- replacing the Logger must not change Capacity calculations;
- changing Today layout must not change Progress persistence;
- replacing the Energy editor must not change Sleep or Context;
- restyling Progress must not change weekly formulas;
- replacing desktop navigation must not require changing mobile navigation domain behavior;
- changing a module’s internal visual component must not require editing unrelated modules.

Composition roots may know installed capabilities. Private feature implementations may not read another module’s private tables or manipulate another module’s private DOM.

## Iteration history

### Iteration 1 — rejected prototype

The first shell redesign introduced the correct primary navigation and progressive disclosure but still felt too generic, card-heavy and insufficiently interactive. It is not the visual target.

### Iteration 2 — platform-reference direction

This iteration changes the visible experience more substantially while preserving the same backend/domain foundation:

- responsive operating-system shell with desktop rail and mobile bottom navigation;
- Today rebuilt as a command center;
- Life Capacity surfaced directly on Today;
- center `+` opens a real Universal Logger;
- recent repeats prefill the logger without invisible saves;
- Progress rebuilt around Actual / Minimum / Target;
- Insights uses explicit evidence readiness and refuses fake relationship cards;
- Plan gains an at-a-glance operating summary before its independent management modules.

## Acceptance principle

A visual redesign is successful only if it materially improves comprehension and speed **without** weakening historical integrity, calculations, privacy or module isolation.
