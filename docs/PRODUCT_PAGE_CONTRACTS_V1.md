# Growth Compass — Product Page Contracts V1

Status: **product-definition reset after rejected Figma Current implementation**

This document defines what each page must accomplish independently of the rejected/current visual design. It is the product contract for the next UI rebuild. Architecture and domain ownership still follow `MODULARITY_STANDARD.md` and `ARCHITECTURE.md`.

## Product-wide rule

Every screen must answer three questions quickly:

1. **Where am I?**
2. **What matters here?**
3. **What can I do next?**

The UI may be sophisticated underneath, but the normal path must not require knowledge of internal data models.

## Primary navigation

Mobile primary destinations:

`Today | Plan | Add | Progress | Wellness`

Secondary destinations:

`Insights | Journal | Settings`

Desktop uses a persistent rail. Add remains a first-class action, not a hidden utility.

---

## 1. Today — daily command center

### Job
Help the person understand the day in seconds and act without navigating through the system.

### Must answer
- What am I doing now?
- What is next?
- What have I intentionally planned for today?
- How much realistic time remains?
- How do I add/start/finish something quickly?

### First viewport
- Today + civil date
- brief greeting/state line
- **Now** state: active item or clear `Start an activity` action
- **Your day**: ordered daily-plan items
- explicit `Add activity` action
- compact capacity summary

### Daily item actions
For Activity-linked items:
- `Start`
- `Done`
- `•••` for move/edit/drop

For generic Daily Plan items:
- `Start` where meaningful
- `Done` marks the intention complete but does **not** fabricate Progress
- `•••` for move/edit/drop

### Secondary content
- Progress direction
- recent factual activity
- Energy / wellbeing check-in
- short Journal entry point

### Does not own
Goals, Progress persistence, Capacity calculation, Journal entries, Wellbeing observations.

---

## 2. Add / Activity Capture — universal action sheet

### Job
Make planning, starting, or recording an Activity understandable in under ten seconds.

### Entry
The center Add action must be labeled or otherwise unmistakable. The person should never have to infer what a symbol means.

### Opening state
Headline: `Add activity`

Primary intent choices:
- **Plan** — put something on a day
- **Start now** — begin an Activity today
- **Done** — record something that actually happened

### Activity picker
- search/type field
- recent Activities
- frequent Activities
- matching existing Activities while typing
- if missing: `Create “…”`

### Activity creation
Normal path:
- name
- optional Goal relationship when the contract permits it

Advanced path:
- description
- Goal relationship/change
- ordering/archive

### Required consequence clarity
- Plan creates a Daily Plan intention only
- Start now creates an in-progress Daily Plan intention only
- Done creates factual Progress

### Fast path target
Existing Activity + common duration should require only a few taps.

---

## 3. Plan — direction + time fit

### Job
Answer: **What am I trying to do, and does it fit my real life?**

### First viewport
- current planning horizon, default week
- available time
- planned time
- still-flexible time
- top priorities / Goals needing attention
- clear `Plan activity` / `Adjust week` actions

### Core sections
- Goals
- Life Areas
- Goal time budgets
- Time & Capacity
- Schedule / Daily Plan bridge
- Compass / long-range direction

### Design rule
Numbers must show relationships. Four giant cards with one number each are not an acceptable Plan experience.

---

## 4. Goals — long-term direction

### Job
Keep meaningful directions visible and editable without turning Goals into project administration.

### List
Each Goal shows:
- name
- Life Area
- progress method in plain language
- current target/minimum when set
- planned attention when available

Primary actions:
- open Goal
- `Add goal`

Secondary actions:
- edit
- pause/archive

### Editor
Easy path:
- goal name
- Life Area
- `How will you know you are making progress?`

Supported measurement concepts:
- time spent
- quantity
- completed / yes-no
- milestones

Advanced:
- target/minimum
- period
- why
- dates
- priority/status

---

## 5. Life Areas — personal organization

### Job
Let the person define their own life structure.

Must support:
- create
- rename
- reorder
- archive
- choose icon/color when useful

Starter suggestions are optional examples, not product ontology.

---

## 6. Goal Time Budgets — planned attention

### Job
Translate long-term intention into realistic planned time without turning the target into debt.

For each time-based Goal show:
- minimum guidance
- target guidance
- currently planned time
- actual factual time for context, clearly separated

Actions:
- adjust minimum
- adjust target
- jump to week planning

---

## 7. Time & Capacity — physical time reality

### Job
Answer: **How much time is actually available after life commitments?**

Show:
- weekly available time
- protected commitments such as sleep/work/commute/recovery
- planned Growth Compass time
- still-flexible time

Actions:
- add/edit commitment
- choose weekdays
- change duration/effective period

No moral score, guilt language, or unexplained labels like `Balanced`/`Spacious`.

---

## 8. Compass — long-range orientation

### Job
Keep long-horizon direction visible without forcing daily interaction with a ten-year document.

Show:
- major horizons / themes
- active Goals that serve them
- upcoming checkpoints
- reflection prompts when useful

Actions:
- edit direction
- connect/create Goal

The Compass informs Plan; it does not write Progress.

---

## 9. Daily Plan Editor — short-horizon intentions

### Job
Build or adjust Today/Tomorrow without conflating intention with completion.

Must support:
- generic item or Activity-linked item
- date
- optional time
- planned duration
- reorder
- edit
- remove/drop

Lifecycle:
`Planned → Doing now → Done`

---

## 10. Daily Plan Recovery — changed plans without guilt

### Job
Handle unfinished intentions explicitly rather than silently creating debt.

For each unfinished item offer:
- keep today
- move to tomorrow/date
- reduce
- mark complete where truthful
- drop

No automatic rollover without a visible decision.

---

## 11. Progress — factual history

### Job
Answer: **What actually happened?**

Show:
- recent factual timeline first
- actual totals for selected period
- per-Goal / per-Activity facts
- legitimate minimum/target context
- mixed measurements when supported

Actions:
- open record
- correct/delete factual record
- change period/filter

Does not show planned intentions as actual progress.

---

## 12. Insights — interpretation of enough evidence

### Job
Answer: **What patterns might the data support?**

Show:
- evidence/readiness state
- sample size
- descriptive summaries
- paired associations only when enough paired observations exist
- clear non-causal language

Thresholds:
- 0–6 days: readiness only
- 7–20: descriptive summaries
- 21–41: early associations where valid
- 42+: stronger association summaries, still non-causal

No fabricated insights. Journal content remains excluded in Beta.

---

## 13. Journal — private reflection

### Job
Make writing easy and reading history calm.

History:
- `New entry`
- recent entries
- search/filter

Editor:
- writing field first
- optional title/type/tags/date
- save

No streak mechanics. Journal remains separate from Progress/Insights/AI in Beta.

---

## 14. Wellness — practice library

### Job
Offer optional restorative practices without turning them into performance obligations.

Library:
- featured practice
- categories/purposes
- duration
- clear `Start` action

Player:
- practice title
- progress/time
- play/pause
- stop/close
- accessible audio controls

Wellness practice completion does not automatically become Progress.

---

## 15. Wellbeing / Energy Check-in — observation

### Job
Capture current state quickly as optional context.

Show:
- simple energy selection
- optional note/context
- saved state for today

No score of worth/productivity. Insights may use observations only through the declared Wellbeing contract.

---

## 16. Settings — preferences and control

### Job
Put configuration, privacy/export and install/account-adjacent controls somewhere predictable without polluting daily pages.

Current Beta:
- profile display preferences
- timezone/locale where supported
- install guidance
- export
- module/preferences that actually exist

Future multi-user/account settings stay out until identity exists.

---

## 17. Activity Library — secondary management view

### Job
Manage reusable Activities without making this page necessary for everyday capture.

Show:
- active Activities
- associated Goal
- recent use
- archive state

Actions:
- add
- edit
- archive
- move relationship when supported

**Important:** the everyday Add flow must create/select Activities contextually; the user should not be sent here to complete a normal log.

---

## Screen acceptance gates

A page is not accepted until all four pass:

1. **Product:** a person can state what this page is for after seeing it.
2. **Usability:** top 2–3 actions are discoverable without instruction.
3. **Visual:** the rendered real-device screenshot is strong enough to represent Growth Compass publicly.
4. **Engineering:** accessibility, responsive, modularity, API and browser gates remain green.

A green automated test suite alone is never proof of visual/product acceptance.