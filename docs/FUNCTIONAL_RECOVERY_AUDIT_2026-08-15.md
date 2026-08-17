# Growth Compass — Functional Recovery Audit

Date: 2026-08-15
Status: **recovery authority for the rejected Product Rebuild functionality**
Production: **DO NOT DEPLOY** until the functional acceptance gates in this document are met.

## 1. Why this audit exists

The current Preview improved visual consistency but materially reduced usability. User evaluation:

- earlier usable baseline (`38bb96e0c84f94d02b437ef1b28c3617671fda70`): roughly 50/100 overall experience
- current Product Rebuild: roughly 70–75/100 visual appearance after polish
- current Product Rebuild: roughly 30/100 functionality/ease of use

The goal is not to roll the entire repository back. The earlier baseline is an ancestor of the current branch, and later work includes valuable modularity, backend, security, CI, accessibility and deployment safeguards. We recover **useful product behavior** selectively while keeping those engineering improvements.

## 2. Core finding

The main regression is not missing backend capability. It is **interaction compression**: useful actions and information were removed from the normal path, hidden behind disclosure, or given a different default meaning.

The recovery rule is:

> Restore functional depth first. Keep the better current visual shell only where it does not make actions harder to discover or complete.

## 3. Engineering preservation rule

Keep current backend/module contracts unless a product requirement proves they are insufficient.

The comparison from the earlier baseline to the current branch shows that the core Goal, Area, Plan-budget and Capacity module implementation files were not rewritten in the Product Rebuild. Their functionality largely still exists; the current Plan composition makes it harder to discover and use.

Do not undo:

- Worker module boundaries
- D1 ownership rules
- Version 1 API contracts
- Progress factual-write separation
- Daily Plan versus Progress separation
- Journal privacy boundary
- Insights non-causal/evidence rules
- Cloudflare Access Preview perimeter
- exact-SHA Quality → Preview deployment gate
- accessibility safeguards

## 4. Product-wide regressions

### R1 — Global Add changed meaning

Earlier behavior:
- global Add/Logger defaulted to `Done`
- central Add therefore naturally meant “record what happened”
- Plan and Start-now were still available as explicit alternate modes

Current behavior:
- global Add defaults to `Plan`
- the same primary action silently changed semantic meaning

Recovery:
- global Today/nav Add must default to factual `Done` **or** open a truly neutral intent chooser without silently selecting Plan
- Plan-specific entry points open `Plan`
- Start buttons open/start `Start now`
- completion entry points open `Done`

### R2 — Direct completion was buried

Earlier Today/Daily Plan rows exposed:
- check/done
- Start
- Plans changed?
- Edit

Current Product Today row exposes:
- Start
- `•••` / Plans changed

Recovery:
- Activity-linked daily items must expose `Start` and `Done` directly
- secondary menu holds Move/Edit/Reduce/Drop
- generic one-off items can complete without creating factual Progress

### R3 — Tomorrow disappeared from the normal Today planning surface

Earlier:
- Today & Tomorrow tabs
- counts for both days
- Add to Today / Add to Tomorrow

Current:
- first-class Today variant shows only today
- tomorrow is reachable only indirectly through Add/one-off flows

Recovery:
- keep Today focused, but expose Tomorrow as one obvious secondary tab/preview/action
- no need to return to a heavy two-page dashboard; planning tomorrow must be one tap away

### R4 — Useful context was hidden too aggressively

Earlier Today rendered:
- Daily Plan
- Wellbeing state
- Capacity
- Progress direction
- recent factual activity
- Journal preview
- deeper Wellbeing details

Current Today puts Progress, Wellbeing and Journal under `More today`.

Recovery:
- first viewport remains action-first
- immediately below the first viewport, show concise visible summaries for Progress and Wellbeing
- Journal can remain lower priority but should have a visible entry point
- disclosures are for detail, not for hiding entire product capabilities

### R5 — Plan became a directory instead of a working planning surface

Earlier Plan included direct navigation to:
- Goals
- Capacity
- Schedule / commitments
- Compass

and module panels beneath it.

Current Plan adds a better time-fit summary and `Plan activity`, but turns most working content into repeated disclosure blocks.

Recovery:
- keep current compact time-fit summary
- restore an actual working week-planning surface immediately below it
- surface active Goals/priorities with planned attention
- expose upcoming/planned activities and capacity conflicts
- retain deeper editors in disclosures

### R6 — Management capability exists but feels absent

Goals, Life Areas, Goal time budgets and Capacity modules were not removed by the Product Rebuild, but are nested inside Plan and visually secondary.

Recovery:
- Plan remains the parent destination
- each major planning capability gets a clearly named, obvious subview or section
- editors must be reachable without scrolling through unrelated modules
- preserve existing module ownership

### R7 — Visual simplification removed affordances

The current design frequently replaces explicit buttons/labels with symbols, ellipses, or large summary surfaces.

Recovery:
- frequent actions use text labels
- icons reinforce labels rather than replace them until the pattern is unquestionably learned
- `•••` is only for genuinely secondary actions

## 5. Page-by-page best-of-both contract

## Today

### Keep from current
- clear `Today` heading/date/greeting
- `Now` concept
- compact `Your day`
- compact capacity bar
- calmer visual hierarchy

### Restore from earlier baseline
- direct Done on every applicable daily item
- direct Tomorrow access
- visible Progress summary below daily work
- visible Wellbeing/Energy entry point
- visible Journal entry point
- ability to add a generic one-off item

### Target normal flow
1. See what is running now.
2. Start or finish an item directly.
3. See remaining planned items.
4. Add an Activity or one-off item.
5. Switch/peek Tomorrow.
6. See concise time fit, Progress and Energy without opening a generic More disclosure.

## Add / Activity Capture

### Keep from current
- Plan / Start now / Done language
- searchable Activity picker
- inline Activity creation
- recent Activities
- Today/Tomorrow/Pick date for Plan
- clear consequence text

### Restore/improve from earlier baseline
- global Add must not silently mean Plan
- quick repeats must preserve useful duration/subtype combinations
- frequent/recent choices should be tappable before typing
- duration should preserve a fast common default and presets
- advanced fields remain optional and out of the fast path

### Target entry semantics
- global Add: `Done` by default for fast factual capture, with Plan/Start now equally visible
- Plan page `Plan activity`: Plan preselected
- Today `Start`: Start now preselected with Activity filled
- Today `Done`: Done preselected with Activity/duration filled

## Plan

### Keep from current
- weekly Time fit
- available / planned / flexible relationship
- `Plan activity`
- cleaner typography and visual grouping

### Restore/improve
- active Goals visible as planning objects, not just a count
- show planned attention by Goal
- show planned Activities for the week
- show time conflicts/gaps
- direct Schedule/commitment access
- direct Goal/Capacity operations

### Target first working section
`This week` → Time fit → Priorities/Goals → Planned activities → adjustments.

## Goals

### Existing capability to preserve
- create/edit/archive
- Life Area relationship
- progress method
- minimum/target guidance
- advanced metadata

### Recovery need
- make Goal list and Add Goal obvious inside Plan
- show human-readable measurement method
- show planned attention and actual context without turning guidance into debt

## Life Areas

### Existing capability to preserve
- create/rename/reorder/archive

### Recovery need
- reachable as a named Plan subview/section
- not buried behind generic disclosures

## Goal Time Budgets

### Existing capability to preserve
- minimum/target planned guidance

### Recovery need
- show alongside real weekly time fit
- distinguish planned guidance, actual Progress, and available capacity visually

## Time & Capacity

### Existing capability to preserve
- recurring commitments
- weekday-specific durations
- effective dates
- real available/planned/flexible calculations

### Recovery need
- direct `Adjust time` should open this editor, not merely scroll into a long page
- show commitments as editable rows

## Compass

### Keep
- long-range direction remains separate from Progress

### Recovery need
- make it a recognizable long-range planning section, not a legacy-looking appendix

## Daily Plan Editor / Recovery

### Keep from current engineering
- no automatic rollover
- Keep / Move / Reduce / Complete / Drop
- generic items separated from factual Progress

### Restore
- direct Edit from daily item secondary actions
- direct Done from daily row
- Tomorrow planning access

## Progress

### Keep from current/earlier shared semantics
- factual history
- deletion/correction
- Actual / Minimum / Target separation
- no planned work counted as Progress

### Restore/improve
- useful period switching/filtering
- recent factual history first
- per-Goal context available without excessive disclosure
- preserve mixed time/quantity/yes-no facts

## Insights

### Keep
- evidence readiness
- sample counts
- 0–6 / 7–20 / 21–41 / 42+ stages
- no fabricated causation

### Recovery need
- descriptive summaries should appear as soon as evidence allows
- do not make the page feel empty merely because association analysis is unavailable

## Journal

### Keep from earlier baseline
- New entry
- search
- date filter
- edit/delete
- writing-first editor
- optional prompts/templates/title/tags
- explicit privacy boundary

### Current risk
- simplification must not hide search/filter/prompt depth

### Recovery
- retain all earlier behaviors while applying current visual shell

## Wellness

### Keep from earlier baseline/current player
- featured practice
- more practices
- duration/category
- Guided / Ambient / Both
- Start / Pause / Resume / End
- remaining time/progress
- read guidance
- local-only audio/privacy behavior

### Recovery need
- use current calmer visual identity without replacing concrete practice choices with decorative sanctuary content
- practice library is the product; decorative breathing visuals are secondary

## Wellbeing / Energy

### Keep
- fast Energy selection
- optional deeper context
- module-owned observations

### Recovery
- visible entry point on Today without requiring `More today`

## Settings

### Keep
- export/data ownership
- planning points back to Plan

### Add only when genuinely supported
- install guidance
- real display/locale/timezone preferences

Do not invent account/subscription/theme controls.

## Activity Library

Current gap:
- Activities exist as a capability and can be created contextually, but there is no strong secondary management surface in the everyday navigation model.

Recovery:
- add a secondary Activity management view under Plan or More
- edit/archive/manage Goal relationship
- everyday logging must never require visiting this page

## 6. Recovery priority

### P0 — everyday use
1. Global Add semantics
2. Today direct Start / Done / More
3. Tomorrow access
4. Add fast path / recent repeat
5. eliminate transient navigation/loading flashes

### P1 — planning usefulness
6. Plan: Goals + planned activities + time fit in one working surface
7. direct Goal, Capacity, Schedule access
8. Activity management surface

### P2 — evidence/reflection
9. Progress period/filter usability
10. visible Today Energy/Progress summary
11. Journal full depth
12. Insights descriptive evidence

### P3 — optional support
13. Wellness library/player polish without capability loss
14. Settings/install/preferences cleanup

## 7. Acceptance scores

No page moves toward Production until it reaches at least:

- Functionality: 80/100
- Ease of use: 80/100
- Information clarity: 80/100
- Visual quality: 75/100

The user, not automated tests, is the final product/usability judge. Automated tests remain release-blocking engineering evidence only.

## 8. Production rule

The current Product Rebuild must not be promoted to Production.

Preview remains the recovery sandbox. Production stays unchanged until:

1. P0 and P1 recovery are accepted on a real phone;
2. all engineering gates pass;
3. the user explicitly approves Production promotion.
