# Growth Compass — Experience 2 Growth UX Blueprint

Status: **Design and interaction authority for the current Experience 2 redesign program**  
Date: 2026-08-22  
Scope: Preview 2 / Experience 2 only. Production and Preview 1 remain untouched.

This blueprint converts the existing Growth Compass product semantics into a simpler user-facing operating model. It does not change the core domain contracts: Daily Plan remains intention; Progress remains fact; Capacity remains time arithmetic; Insights remain evidence-gated; Wellness remains separate from Wellbeing observation.

## 1. Product definition

Growth Compass is a **personal growth feedback system** that connects the life a person wants with the way they actually live, then helps them learn and adjust.

Primary loop:

`Direction -> Reality -> Action -> Evidence -> Reflection -> Adjustment -> Direction`

The product is not primarily a task manager, habit tracker, journal, mood tracker, wellness library, or analytics dashboard. Those capabilities serve the loop.

### North-star questions

A person should be able to answer, with minimal navigation:

1. What matters now?
2. Where am I going, and what am I focusing on?
3. What is my life actually showing me?
4. What have I learned, and what should change?

## 2. Information architecture

### Primary destinations

- **Today** — What matters now?
- **Compass** — Where am I going, and what am I focusing on?
- **Patterns** — What is my life actually showing me?
- **Reflect** — What have I learned, and what should change?
- **Add** — global capture/action entry point

Mobile navigation:

`Today — Compass — + — Patterns — Reflect`

Desktop uses the same mental model in the primary rail.

### Capability placement

| Existing capability | User-facing home |
|---|---|
| Goals / Direction | Compass |
| Plan | Compass + Today |
| Schedule | Compass planning layer |
| Capacity | Compass planning reality check |
| Activities | Add + secondary library |
| Progress | Patterns |
| Insights | Patterns |
| Energy / Wellbeing | Today + Patterns |
| Journal | Reflect |
| Wellness Boost | contextual utility + secondary library |
| Settings / account | secondary navigation |

The system can retain separate modules and APIs internally. The user should not have to manage the architecture.

## 3. Interaction architecture

### Planning is an action, not a department

Planning appears where it becomes useful:

- Direction -> **Plan next step**
- Today -> **Move / reduce / adjust**
- Weekly review -> **Choose next week**
- Pattern -> **Try one adjustment**
- Routine -> **Place in week**

Schedule is the time layer. Capacity is the reality check. Activities are reusable building blocks. These remain modular but should not compete as first-level concepts.

### Progressive disclosure

Common actions are visible immediately. Advanced tracking, targeting, metadata, schedule editing, analytics methods, and management functions remain available but subordinate.

The interface must teach through use. It should not require memorizing product terminology before the first useful action.

## 4. Visual direction — Warm Editorial Instrument

Growth Compass should feel like a combination of a **beautiful personal journal** and a **serious analytical instrument**.

### Principles

- matte, quiet, durable surfaces
- hierarchy through typography, whitespace, alignment and rules
- very limited elevation
- no glassmorphism or backdrop blur as a core language
- no glow-driven hierarchy
- no card around every section
- no neon dark mode
- no decorative charting
- no gamified pressure

### Light mode

- warm off-white / paper-like canvas, not literal paper texture
- deep charcoal text
- restrained ink/forest/indigo accent
- fine neutral rules
- soft semantic fills used sparingly
- shadows only where elevation is semantically useful

### Dark mode

- deep ink canvas
- warm off-white text
- quiet neutral rules
- same semantic hierarchy as light mode
- no luminous purple/blue atmospheric glow

### Typography

- readable humanist sans for interface and data
- optional restrained serif only for reflective or directional statements
- strong distinction between display statements, section labels, body copy and factual data

### Surface budget

Target composition:

- ~70% open canvas
- ~20% quietly grouped regions
- ~10% elevated/focused surfaces

### Brand motif — Compass Line

Use a restrained continuous line to connect horizons and evidence:

`Long-term direction -> year -> current season -> week -> today -> what happened`

The line is structural, not magical. It can simplify or disappear when it would add clutter.

## 5. Landing experience

Core message:

**Make your days point somewhere.**

Supporting idea:

Connect what matters to what you do today, then learn from what actually happens.

Primary action: **Build my compass**  
Secondary action: **Explore an example**

The hero should demonstrate the relationship among horizons rather than show a generic dashboard.

Only three primary propositions are needed below the hero:

- **Clarity** — Know what matters.
- **Reality** — Plan around the life and time you actually have.
- **Learning** — Learn from actions, routines, energy, mood and reflection.

Avoid a long SaaS feature grid.

## 6. First-run onboarding

The onboarding creates the user's first real system. It is not a tutorial.

### Step 1 — Choose an area

Question: **What would make the next year meaningfully better?**

Choices: Career, Health, Relationships, Finances, Learning, Personal growth, Something else, plus **I'm not sure — help me choose**.

### Step 2 — Create direction

Question: **What would you like to be different?**

Optional follow-up: **Why does this matter to you?**

Do not force tracking details or long-horizon plans.

### Step 3 — First move

Question: **What's one small move you could make this week?**

Use contextual examples while keeping natural-language creation primary.

### Step 4 — Make it realistic

Question: **When could this actually happen?**

Only here should routine/capacity conflicts become relevant.

### Step 5 — Optional baseline

Question: **Would you like to learn what affects your energy and mood?**

Choices: **Start my baseline** / **Not now**.

Completion transitions directly into Today with the first action already present.

### Long-term horizon rule

Do not force 1/5/10-year planning during onboarding. Longer horizons emerge progressively after the user has established trust and useful current direction.

## 7. Today

Primary question: **What matters now?**

The first viewport should make the next action understandable within seconds.

Recommended hierarchy:

1. date / quiet context
2. one primary Next action or active action
3. Start / Done / Plans changed
4. Later today
5. fast wellbeing check-in
6. at most one earned factual observation

Tomorrow remains one deliberate action away.

Today is finite and resettable. Unfinished intentions are recoverable without shame or automatic debt.

## 8. Compass

Primary question: **Where am I going, and what am I focusing on now?**

Compass progressively exposes:

- long-term direction
- this year
- current season
- this week
- today

Not every horizon needs data.

The current focus should dominate; other active areas remain quieter.

Within Compass the user can:

- create/review Direction
- plan the next useful step
- see whether planned attention fits real capacity
- maintain recurring commitments/routine
- place planned actions in time
- manage reusable activities only when useful

No universal productivity score.

## 9. Patterns

Primary question: **What is my life actually showing me?**

Patterns is question-led rather than dashboard-led.

Entry questions:

- Where is my time going?
- When is my energy strongest?
- How has my mood changed?
- Are my routines becoming easier?
- Am I making time for what I said matters?
- What changed this month?

Only show a chart when it makes an answer easier to understand.

### Evidence ladder

- 0–6 tracked days: collecting
- 7–20 days: descriptive summaries
- 21–41 days: early associations where paired evidence exists
- 42+ days: stronger associations, still explicitly non-causal

This retains the current evidence-honesty contract.

## 10. Energy and mood model

Energy and positivity are not the same variable.

Use the existing Wellbeing energy model as a valence/activation map while making everyday capture simple.

### Fast check-in

Two dimensions:

- **Energy:** Drained / Low / Okay / Good / Strong
- **Mood:** Very negative / Negative / Neutral / Positive / Very positive

The interaction should take seconds. Notes and context are optional.

### Analysis

After sufficient history, Patterns can show:

- typical energy level
- typical range
- 30-day trend
- energy by day/time where evidence supports it
- mood alongside energy
- Energy × Mood map
- paired observations with visible sample size

Wording stays observational. Never state that a factor caused energy or mood to change without appropriate evidence.

## 11. Adjustment experiments

Patterns should not end with passive statistics.

When evidence suggests a useful question, offer:

**Try one adjustment**

The user chooses an experiment. Growth Compass records the chosen change and later helps the user compare their experience without claiming causal certainty.

Examples:

- protect morning deep work for one week
- move exercise earlier
- reduce an overfull evening routine

No command language and no fake optimization oracle.

## 12. Routines

Routine design is not streak design.

A useful routine can include:

- why it supports a Direction
- cue / context
- normal version
- minimum version
- recovery option
- factual evidence of what happened

Missed days should not create punishment, red failure states, or artificial debt.

## 13. Reflect

Primary question: **What have I learned, and what should change?**

Reflect combines:

- quick reflection
- journal
- weekly review
- monthly review

Reflective writing can use a warmer editorial treatment than analytical areas.

### Weekly review

1. What actually happened?
2. How was your energy and mood?
3. What changed?
4. What seemed to help?
5. What should change next week?
6. What deserves time next week?

The review should end in a small number of deliberate planning changes.

### Monthly review

Questions:

- Where did my time go?
- How did I feel?
- Did my routines support my current direction?
- What should I change?

The software presents facts and observations; the user interprets unusual circumstances.

## 14. Wellness

Wellness Boost remains separate from Wellbeing evidence and Progress.

It should normally surface contextually rather than occupy primary navigation:

- Today: optional reset
- after a difficult check-in: optional pause
- Reflect: optional support
- secondary library: full access

Using Wellness is never required for a growth score or streak.

## 15. Add

The global Add interaction must remain the fastest capture surface.

Primary choices:

- Do something now
- Plan something
- Record something already done
- Energy / mood check-in
- Write a note

Secondary detail appears only after the user selects intent.

## 16. Rhythms

The product should operate at multiple rhythms without turning them into mandatory navigation sections:

| Rhythm | Job |
|---|---|
| Moment | capture / Start / Done / check-in |
| Day | decide what matters now |
| Week | adjust commitments and routine |
| Month | learn from patterns |
| Season | reconsider active priorities |
| Year | assess meaningful direction |
| 5–10 years | maintain broad life direction |

## 17. AI posture

AI is an assistant, not the interface.

Good future uses:

- explain a capacity conflict
- summarize evidence with sample sizes
- help formulate one experiment
- help reduce an unrealistic plan
- help reflect on a review

AI must not invent data, schedule unsupported work, produce health diagnoses, or state unsupported causal claims.

## 18. Accessibility and interaction quality

Experience 2 targets WCAG 2.2 AA and preserves keyboard/touch equivalence.

Requirements include:

- visible focus that is not obscured
- no drag-only essential operation
- robust pointer targets; target 44px-class primary touch controls even though WCAG minimum can be smaller under conditions
- 320 CSS px reflow support
- 200% text resize without loss of function
- reduced motion support
- contrast parity in light and dark modes
- chart summaries and accessible values, not color-only meaning
- clear errors and recovery

## 19. Usability acceptance targets

A credible 90+ experience requires human evidence, not just CI.

Target gates:

- >=95% unassisted completion across primary Beta tasks
- >=90% first-attempt success for first-time core tasks
- Today orientation median <=5 seconds; aspirational <=3 seconds
- common Logger completion <=8 seconds; repeat <=4 seconds
- destination reachable in <=2 deliberate navigation actions
- SUS >=85 or equivalent validated benchmark
- SEQ median >=6/7
- no critical recurring usability issue in >5% of participants
- responsive, keyboard and screen-reader acceptance across representative devices

## 20. Prototype task set

Before calling the experience release-ready, test without explaining the interface:

1. Set up a meaningful health or career direction.
2. Create one useful action for this week.
3. Change tonight's plan because real life changed.
4. Record something that already happened.
5. Record energy and mood.
6. Find when energy has generally been strongest.
7. Determine whether time is going toward the stated focus.
8. Write a reflection.
9. Make one change for next week.

Observe hesitation, wrong turns, terminology confusion and recovery behavior.

## 21. Explicit anti-patterns

Do not:

- reskin the current architecture with paper textures
- expose ten equal top-level destinations
- make every section a card
- show a universal Life Score
- punish missed routines
- make streaks central
- force 1/5/10-year plans during setup
- show associations without adequate paired evidence
- make AI causal/medical claims
- use neon dark mode
- fill empty states with fake analytics
- expand functionality before the main mental model is clear

## 22. Research basis

Design decisions are informed by:

- Apple HIG onboarding: teach through interaction, keep prerequisite onboarding brief, postpone nonessential setup.
- Apple HIG disclosure controls: keep common functionality visible and hide advanced details until relevant.
- Apple HIG charts: use charts to answer meaningful questions, summarize the message, reveal detail progressively, preserve accessibility.
- WCAG 2.2: focus visibility, predictable interaction, target sizing, non-drag alternatives and input assistance.
- Li, Dey & Forlizzi (2010), stage-based personal informatics: collection, integration, reflection and action are a linked process rather than separate dashboards.
- Williams et al. (2021) mEMA systematic review: repeated self-report can work, but burden and protocol design matter.
- Russell (1980), circumplex model of affect: valence and arousal/activation are distinct dimensions.
- Lally et al. (2010), habit formation: automaticity develops with large individual variation; missing one opportunity did not materially derail formation.

## 23. Implementation rule

This redesign is a **composition/presentation program** first.

Preserve module ownership and API contracts. New composition views may read from existing public capabilities but must not move domain business logic into the shell.

Preview 1 and Production remain untouched.
