# Growth Compass - Revision B UX/UI implementation backlog

Date: 14 August 2026

Status: active implementation backlog. `MODULARITY_STANDARD.md` remains mandatory. `EXPERIENCE_ARCHITECTURE.md` Revision B is the UX authority.

## Current checkpoint before Revision B implementation

- Branch: `feature/experience-refinement`
- Revision A runtime/accessibility checkpoint before documentation update: `efe8475548ee98187d59f7d57df16b9c440846a9`
- Automated suite at that runtime checkpoint: 192/192 passing
- PR #6: open, draft, unmerged, base `main`
- Production Worker: unchanged during architecture/UX branch work
- Production D1: migrations 0006/0007 not applied
- Preview D1: migrations 0006 and 0007 applied successfully on 14 August 2026
- Preview D1 `PRAGMA quick_check`: `ok`
- Preview D1 pre-migration Time Travel bookmark: `00000023-00000000-000050c7-055ab3f27120b9f499932563e3efaf26`
- Preview deployment: user reported completed; visual walkthrough performed on preview
- Revision A human visual acceptance: **not accepted**

Documentation-only commits after the runtime checkpoint may advance the branch SHA without changing runtime behavior.

## Revision B priority order

Implement in small validated slices. Do not combine unrelated business/module changes into UX work.

### B1 - Logger simplicity and contextual Activity creation

Goal: make the center `+` interaction understandable without knowing the Activity model.

Required:

- fix optical centering of the center `+` / Log navigation action;
- change person-facing modes to `Plan | Start now | Done` while preserving domain semantics;
- make the primary Activity control conceptually answer `What did you do?`;
- add autocomplete/typeahead over existing Activities;
- if no existing Activity matches, offer `+ Create "..." as a new Activity` in the same flow;
- preserve Activities public contract and ownership;
- if new Activity creation needs a Goal/Life Area association, request only the minimum necessary information and do not expose unrelated advanced configuration;
- reduce Recent repeats to a compact accelerator;
- change `Subtype` wording to `Focus / variation` or equivalent human language;
- make `More details` unmistakably expandable with chevron/state change and a short description of what it contains;
- preserve date/time/note under disclosure;
- preserve exact factual consequence: only Done writes completed Progress;
- preserve Daily Plan handoff for Plan/Start now;
- no `/api/session` regression.

Acceptance:

- common existing-Activity Done flow <= 10 seconds in preview walkthrough;
- missing-Activity flow does not require leaving Logger;
- no duplicated Activities private logic inside Logger;
- keyboard/modal/touch tests remain green.

### B2 - visual interaction calming

Goal: make accessibility states visually belong to Growth Compass.

Required:

- replace vivid electric-blue global focus treatment with a calmer brand-aligned visible focus style;
- maintain sufficient contrast and clear keyboard visibility;
- audit input focus, select focus, buttons, disclosure summary, navigation and modal controls;
- preserve `:focus-visible` rather than hiding focus;
- keep reduced-motion behavior;
- validate at 375px and desktop.

Acceptance:

- focus remains unmistakable by keyboard but no longer visually dominates the interface;
- no accessibility regression.

### B3 - Today period perspective

Goal: replace rigid weekly-only direction with understandable period views.

Required:

- replace `Your weekly direction` with a period control such as `Day | Week | Month | Year`;
- aggregate factual Actual Progress over the selected period;
- preserve historical records unchanged;
- define explicit target semantics per period;
- never derive a daily/monthly/yearly Minimum/Target by naive division/multiplication unless the domain contract explicitly supports that conversion;
- when no legitimate target exists, show `No target set for this period`;
- preserve Today as composition surface;
- period state should not create hidden cross-module dependencies.

Acceptance:

- switching period changes view only, not facts;
- denominator/target tests cover each supported period;
- targetless views never imply zero-target success.

### B4 - Capacity plain-language redesign

Goal: make Capacity understandable without explaining `plan load`.

Required normal presentation:

- available time;
- planned time;
- still-flexible time;
- optional percentage explanation in a full sentence.

Example:

```text
35 h available this week
9 h planned
26 h still flexible
Your current plan uses 26% of your flexible time.
```

Remove or demote unexplained labels such as `Spacious` and `How full?`.

Preserve:

- exact calendar math;
- civil-day calculations;
- effective-dated commitments;
- Capacity -> Plans public-contract dependency only;
- no moral/productivity scoring.

### B5 - Life Areas become visibly user-owned

Goal: remove the impression that Health/Language/Music/Reading are product-defined categories.

Required:

- selector supports `+ New life area` in context;
- Life Areas can be renamed/reordered/archived;
- removal/archive rules preserve historical references;
- optional starter suggestions are templates, not ontology;
- generic user can create a completely different structure;
- founder/default seed must not leak back into runtime assumptions.

Acceptance:

- new user can create a Goal in a new custom Life Area without leaving the Goal flow;
- Areas remains root capability and Goals still reaches it only through public contract.

### B6 - Goal editor human-language redesign

Goal: make Goal creation understandable to a normal person.

Easy path:

1. Goal name;
2. Life Area;
3. human question: `How will you know you are making progress?`

Measurement choices with examples:

- Time spent - `3 hours of guitar`;
- Quantity - `50 pages`;
- Completed - `submit the application`;
- Milestones - `finish Level 1`.

Target sentence pattern where applicable:

```text
Aim for [3] [hours] per [week]
```

Advanced disclosure may contain minimum, status, priority, descriptions and detailed measurement settings.

Acceptance:

- no unexplained `target value`, `unit`, or bare `milestone` term on the easy path;
- same Goals domain/API/validation as advanced mode;
- archived historical references remain intact.

### B7 - Daily Plan / changed-plan recovery language

Goal: make unfinished plans recoverable without debt/guilt.

Required:

- no automatic rollover;
- add/review a future explicit replan interaction: Keep / Move / Reduce / Complete / Drop;
- do not call unfinished plans failures;
- no Progress record unless completion is explicitly confirmed according to existing contracts;
- keep generic Daily Plan items independent of Activities/Progress dependencies.

This slice may be deferred until after B1-B6 if the current Daily Plan UX is acceptable.

### B8 - Progress and Insights plain-language review

Goal: keep analytical integrity while removing unnecessary technical language.

Progress:

- factual history first;
- Actual/Minimum/Target remains when meaningful;
- mixed time/quantity/yes-no facts remain readable;
- Beta compatibility rows remain clearly distinguished and read-only where applicable.

Insights:

- sample size visible;
- evidence stage understandable;
- association-only language;
- no invented relationships;
- Journal excluded.

### B9 - final Revision B visual acceptance

Automated gate:

- full `npm test` green;
- architecture/modularity boundary gates green;
- 375px no-overflow gate;
- touch target gate;
- reduced motion;
- chart text equivalents;
- modal focus trap/Escape/restore/background isolation;
- PWA/iPhone install regression.

Real preview gate:

Test at minimum:

- iPhone Safari;
- Android browser/PWA-capable browser when available;
- Windows desktop browser;
- phone portrait and one landscape/rotation check.

Walkthrough:

1. open Today and understand it without explanation;
2. create a missing Activity from Logger;
3. Plan an Activity;
4. Start now;
5. save Done factual Progress;
6. change Today period perspective;
7. create a custom Life Area;
8. create/edit a Goal using human-language measurement choices;
9. understand Capacity figures;
10. inspect Progress and Insights;
11. verify install guidance and modal behavior.

Revision B is not accepted until the person using the preview says the common paths are clear and pleasant.

## Production guardrails

Do not merge/deploy production merely because Revision B preview is green.

Before any production change:

1. explicit user acceptance;
2. PR #6 reviewed and intentionally merged or otherwise reconciled;
3. production D1 backup / Time Travel restore point;
4. production pending migration inspection;
5. production migrations 0006/0007 applied only after explicit approval;
6. production integrity checks;
7. production Worker deploy;
8. smoke test;
9. preserve rollback information.

Never apply preview commands without `--env preview` during Revision B validation.

## Architectural non-negotiables during Revision B

- no private cross-module imports;
- no cross-module private-table reads;
- no module DOM reach-through;
- Today/Plan remain composition surfaces;
- contextual creation must call the owning module's public API/contract rather than duplicating persistence;
- no founder ontology in generic runtime;
- no planned item silently becoming Progress;
- no Journal leakage into Insights/AI;
- no causal wellbeing claims;
- no direct wearable -> Progress coupling;
- compatibility remains explicit and sunset-bound;
- boundary tests are release-blocking.
