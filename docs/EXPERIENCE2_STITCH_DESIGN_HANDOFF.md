# Growth Compass — Google Stitch Design Handoff

Status: design exploration / prototype handoff for the locked Experience 2 growth UX.  
Date: 2026-08-22.

The production Preview 2 implementation remains native HTML/CSS/JS and the existing modular monolith. Stitch is used to explore and validate presentation/interaction, not to replace architecture.

## Locked product model

Primary navigation:

`Today — Compass — + Add — Patterns — Reflect`

Core loop:

`Direction -> Reality -> Action -> Evidence -> Reflection -> Adjustment`

Visual direction:

**Warm Editorial Instrument** — a quiet combination of a beautiful personal journal and a serious analytical instrument.

Avoid glassmorphism, neon gradients, floating dashboard cards, streak mechanics, productivity scoring, fake AI, or decorative charting.

## Prompt A — visual system and four primary destinations

Design a premium responsive web/PWA called **Growth Compass**.

Growth Compass is a personal-growth feedback system, not primarily a task manager, habit tracker, mood tracker, journal or analytics dashboard. It connects what a person wants from life with what they actually do, then helps them learn and adjust.

Primary navigation must be exactly:

**Today — Compass — [Add] — Patterns — Reflect**

Use the design territory **Warm Editorial Instrument**: warm matte off-white light canvas, deep charcoal type, one restrained ink-blue/forest/deep-indigo accent, fine rules, very few elevated surfaces, almost no shadows, true deep-ink dark mode, highly legible charts and generous whitespace. Use a readable humanist sans for UI and a restrained editorial serif only for important reflective or directional statements.

Create a recurring structural motif called the **Compass Line**, a restrained continuous line that can connect Direction -> season -> week -> Today -> factual evidence. It must feel like information architecture, not decoration.

Do not use:
- glassmorphism or backdrop blur
- glowing surfaces
- neon dark mode
- a card around every section
- excessive pills
- generic SaaS dashboards
- streaks, points, life scores, confetti or gamified pressure
- fake AI insights or causal claims

Design mobile 390px, tablet and 1440px desktop plus equivalent light/dark states.

### Today
Question: **What matters now?**
Show one dominant next/active action with Start / Done / Plans changed, a short Later Today list, optional Tomorrow, and a two-tap Energy + Mood observation. Avoid a dashboard first viewport.

### Compass
Question: **Where are you going?**
Connect current Direction to this week and Today using the Compass Line. Include realistic weekly capacity/routine as a quiet reality check. Planning, schedule and routine are interactions within Compass, not primary destinations.

### Patterns
Question: **What is your life actually showing you?**
Use question-led analytics: energy trend, Energy x Mood map, factual time, evidence readiness. Low-data states must explicitly stay quiet. Never imply causation.

### Reflect
Question: **What have you learned?**
Combine private journal, weekly review and monthly review. Let reflective writing feel warmer/more editorial than analytical views. Reviews should move from facts to user interpretation to one deliberate adjustment.

### Add
Create an intent-first sheet:
- Do something now
- Plan something
- Record something already done
- Energy & mood check-in
- Write a note

Keep advanced details hidden until an intent is chosen.

Output an interactive connected prototype, not isolated screenshots.

## Prompt B — first-run onboarding

Using the same Growth Compass design system, create an interactive first-run flow that teaches through doing rather than a product tutorial.

The user should create their first real system with the minimum setup necessary.

1. Ask: **What would make the next year meaningfully better?**
   Options: Career, Health, Relationships, Finances, Learning, Personal growth, Something else, plus **I'm not sure — help me choose**.
2. Ask: **What would you like to be different?**
   Optional: **Why does this matter to you?**
3. Ask: **What's one small move you could make this week?**
4. Ask: **When could this actually happen?** Show routine/capacity conflict only if one genuinely exists.
5. Ask optionally: **Would you like to learn what affects your energy and mood?** with **Start my baseline** and **Not now**.
6. Transition directly into Today with the first action already present and visibly connected to Direction.

Do not force 1-year/5-year/10-year planning, tracking configuration, routines, analytics settings or a feature tour during onboarding.

Every screen should have one dominant question and one dominant action.

## Prompt C — evidence and reflection stress states

Create alternative states for the same Patterns and Reflect designs:

- zero wellbeing data
- 3 tracked days
- 12 tracked days
- 30 tracked days
- 60 tracked days
- plan changed unexpectedly
- overfull week
- no Progress this week
- several factual Progress records but no journal entries
- dark mode
- 200% text zoom / large text

Patterns must become richer only as evidence becomes sufficient. Use language such as **Building your baseline**, **Descriptive summaries**, **Early patterns**, and **Stronger evidence**. Even at the strongest stage, label associations as non-causal.

Reflect should never turn absence or changed plans into failure language.

## DESIGN.md constraints

If Stitch supports project design rules, preserve the following in DESIGN.md:

- user-facing IA: Today / Compass / Patterns / Reflect / Add
- planning is an action, not a department
- Today = current action
- Compass = direction + realistic planning
- Patterns = factual evidence + cautious associations
- Reflect = interpretation + deliberate adjustment
- warm matte editorial visual system
- minimal elevation and borders
- no glass / glow
- true dark parity
- 44px-class primary touch targets
- WCAG 2.2 AA target
- no color-only state
- reduced-motion support
- no gamified pressure
- no causal or medical claims from observational data

## Evaluation

Do not choose a Stitch direction because it looks impressive in one screenshot. Choose it only if it improves the task protocol in `docs/EXPERIENCE2_USABILITY_PROTOCOL.md` and can be implemented without violating the modular/domain contracts.
