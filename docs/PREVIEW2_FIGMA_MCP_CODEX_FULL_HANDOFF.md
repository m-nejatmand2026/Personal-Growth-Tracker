# GROWTH COMPASS — PREVIEW 2 FULL TAKEOVER HANDOFF
## Figma Make + Figma Design + Figma MCP + GitHub + Codex
### Two completely separate experiences behind one Preview 2 entry link

**Handoff date:** 2026-08-16  
**Repository:** `m-nejatmand2026/Personal-Growth-Tracker`  
**Preview 2 integration branch:** `feature/experience-v2`  
**Preview 2 draft PR:** `#7 — Build Growth Compass Preview 2 experience`  
**Frozen recovered baseline branch:** `baseline/preview1-recovered-2026-08-16`  
**Frozen recovered baseline SHA:** `3cf2a65b5918f73e4f182abfdce8589c98d85277`

---

# 1. YOUR ROLE

You are taking over the **Growth Compass Preview 2 new-experience program**.

You are responsible for Figma Make → product-design interpretation; creation/maintenance of the normal Figma Design file; Figma MCP → design context inside Codex; GitHub → source-control and implementation authority; Codex → engineering implementation; Preview 2 → automated validation/deployment; maintaining strict isolation from Preview 1 and Production; and building/preserving two independently implemented user experiences inside Preview 2.

Do not restart product strategy from scratch. Do not reinterpret Growth Compass as a generic task manager. Do not casually rewrite the existing architecture. The current modular application is the foundation.

# 2. ABSOLUTE ENVIRONMENT RULES

There are four distinct things. Do not confuse them.

## Production

Branch/runtime baseline: `main`.

Production D1 and Production Worker are protected.

**DO NOT DEPLOY OR MIGRATE PRODUCTION.**

No Preview 2 work authorizes Production Worker deployment, Production D1 migration, Production data mutation, or merging the new experience to Production.

## Preview 1

Active recovered-experience development branch: `feature/experience-refinement`.

Current Preview 1 Worker: `personal-growth-tracker-preview`.

Current Preview 1 D1: `personal-growth-tracker-preview`.

**DO NOT MODIFY PREVIEW 1 FOR PREVIEW 2 WORK.**

Specifically do not commit Preview 2 code to `feature/experience-refinement`, change Preview 1 Worker configuration, change Preview 1 D1, change Preview 1 deployment behavior, delete/restructure Preview 1 assets, or use Preview 1 as a scratch environment.

Preview 1 is an independent working application.

## Frozen Preview 1 reference

Permanent comparison branch: `baseline/preview1-recovered-2026-08-16`.

Frozen SHA: `3cf2a65b5918f73e4f182abfdce8589c98d85277`.

This is the canonical recovered-experience snapshot used to seed Experience 1 inside Preview 2. Do not move this branch.

## Preview 2

Branch: `feature/experience-v2`.

Draft PR: `#7`.

Target Worker: `personal-growth-tracker-preview2`.

Target D1: `personal-growth-tracker-preview2`.

All new-design work belongs here.

# 3. THE MOST IMPORTANT NEW REQUIREMENT

Preview 2 must expose **one entry link**. Opening that link must present an experience chooser.

Conceptually:

```text
Growth Compass

Choose your experience

┌──────────────────────────┐
│ Experience 1             │
│ Current / Recovered      │
│ Stable familiar version  │
│                  Open →  │
└──────────────────────────┘

┌──────────────────────────┐
│ Experience 2             │
│ New / Ambient Luxury     │
│ New Figma-driven system  │
│                  Open →  │
└──────────────────────────┘
```

Use the product term **Experience**, not merely Theme, because Experience 2 may change layout, hierarchy, navigation presentation, interaction, motion, screen composition and surface behavior. It is not just a color theme.

UI labels may be:

- **Experience 1 — Current**
- **Experience 2 — New**

The entry page may say: **Choose your Growth Compass experience**.

# 4. SAME LINK, SEPARATE EXPERIENCES

The base Preview 2 hostname is the single link the user opens.

Expected host after bootstrap:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev`

Recommended routing:

```text
/                       → neutral Experience Selector
/experience/1/           → Experience 1
/experience/2/           → Experience 2
/api/*                   → shared Preview 2 backend/domain API
```

The user can bookmark the root link. The root link should always allow the choice. Do not silently force the last-selected experience. It is acceptable to visually mark the last choice as “Last used,” but the root chooser should remain available.

Both experiences must provide a simple `Switch experience` action that returns to `/`.

QA and automated tests must also be able to enter `/experience/1/` and `/experience/2/` directly.

# 5. WHAT “COMPLETELY SEPARATE” MEANS

Experience 1 and Experience 2 are **separate frontend products** living in the same Preview 2 deployment.

They must not be implemented as one DOM plus `theme-1/theme-2` body classes and a giant CSS override file. That is explicitly rejected.

They must not become one app with conditionals everywhere such as `if experience === 2`. That will become unmaintainable.

Instead use separate frontend entrypoints.

Recommended conceptual structure:

```text
public/
├── selector/
│   ├── index.html
│   ├── selector.css
│   └── selector.js
├── experience-1/
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── manifest.webmanifest
│   └── sw.js
├── experience-2/
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── manifest.webmanifest
│   └── sw.js
└── shared-static/
    └── only genuinely neutral assets if justified
```

Adapt names to existing repo conventions when necessary.

## Hard frontend isolation

Experience 1 must not import Experience 2 CSS, components, page modules, motion files, service worker or manifest.

Experience 2 must not import Experience 1 CSS, page modules, interaction code, service worker or manifest.

Do not “temporarily” cross-import and promise to clean it later.

## Allowed sharing

Both experiences may share the same Preview 2 backend, the same Preview 2 D1, stable public API/domain contracts, server-side modular business logic, the same Access boundary, and genuinely neutral static assets such as logo/icon files if useful.

At the beginning, avoid sharing frontend presentation primitives unless there is a strong reason. The goal is to let Experience 2 evolve without destabilizing Experience 1.

# 6. WHY BOTH PREVIEW 2 EXPERIENCES SHOULD SHARE PREVIEW 2 DATA

Experience 1 and Experience 2 should normally use the same Preview 2 D1. That gives the founder a real A/B comparison with the same goals, daily plan, capacity, progress, journal, wellbeing and activity data rendered through two different user experiences.

Neither experience may use Preview 1 D1 or Production D1.

If Experience 2 needs a new schema capability, migrations must be additive where possible; Experience 1 must continue to function; old API contracts must not be broken casually; and new behavior should normally be introduced through additive fields/routes/contracts.

# 7. EXPERIENCE 1 DEFINITION

Experience 1 inside Preview 2 is **not** the live Preview 1 Worker. Do not proxy the live Preview 1 site. Do not make Experience 1 depend on `feature/experience-refinement`.

Experience 1 is a **frozen frontend copy/snapshot** based on `baseline/preview1-recovered-2026-08-16` at `3cf2a65b5918f73e4f182abfdce8589c98d85277`.

This gives Preview 2 a stable internal baseline even if the separate Preview 1 team continues working.

Experience 1 should preserve the recovered design/UX and behavior as closely as possible while pointing at the Preview 2 backend. Any compatibility adjustments required to mount it under `/experience/1/` must be minimal and documented.

# 8. FREEZE EXPERIENCE 1 AUTOMATICALLY

After Experience 1 is copied into the Preview 2 tree, create an automated freeze mechanism.

Recommended: `experience1-manifest.json` containing SHA-256 hashes of all Experience 1 frontend files.

Add a Quality check such as `npm run test:experience1-frozen`.

It should fail if Experience 1 frontend files change unexpectedly. If an intentional Experience 1 fix is ever approved, update the manifest in the same explicit commit with a clear reason.

Do not allow normal Experience 2 work to mutate Experience 1 accidentally.

# 9. ADD A CROSS-EXPERIENCE BOUNDARY TEST

Add an automated static test, for example `npm run test:experience-boundaries`.

It must fail when Experience 1 HTML/CSS/JS imports a file from Experience 2; Experience 2 imports a file from Experience 1; one service-worker scope controls the other experience; one experience references the other’s manifest; or a shared stylesheet reaches into both experience DOM trees.

This is as important as normal module-boundary tests.

# 10. PWA / SERVICE-WORKER ISOLATION

Do not allow browser caches to contaminate the experiences.

Use separate scopes and cache names:

```text
Experience 1
scope: /experience/1/
cache: gc-exp1-<version>

Experience 2
scope: /experience/2/
cache: gc-exp2-<version>
```

Each experience should have its own manifest, service worker and cache namespace. The neutral selector should not accidentally become the service-worker controller for both experiences. Test install/update behavior.

# 11. LOCAL STORAGE / CLIENT PREFERENCE ISOLATION

Namespace experience-specific browser data, for example:

```text
gc.exp1.*
gc.exp2.*
gc.selector.*
```

Do not use generic client keys such as `theme`, `view`, or `settings` when both experiences can collide.

Domain/user records belong in the backend/D1. Client-only presentation preferences may remain experience-specific.

# 12. CURRENT ARCHITECTURE IS A PROTECTED ASSET

Growth Compass is currently a Cloudflare Worker + D1 modular monolith with a native HTML/CSS/JavaScript frontend.

Read:

- `docs/MODULARITY_STANDARD.md`
- `docs/ARCHITECTURE.md`
- `docs/EXPERIENCE_ARCHITECTURE.md`
- `docs/UX_UI_MASTER_SPEC.md`
- `docs/DEVELOPMENT_WORKFLOW.md`

Do not rewrite the app into Figma Make’s React architecture. Figma Make code is a prototype implementation reference, not production architecture authority.

Hard rules remain: no private cross-module imports; no reading another module’s private tables; platform/core does not absorb business logic; CSS/DOM reach-through is not a cross-module integration mechanism; presentation primitives do not calculate business state; domain events describe facts; business behavior belongs to owning modules.

# 13. PRODUCT SEMANTICS THAT MUST SURVIVE BOTH EXPERIENCES

- **Goal:** long-term direction and measurable intent.
- **Daily Plan:** dated intention.
- **Progress:** factual historical evidence. Planned time does not become Progress automatically.
- **Capacity:** concrete time arithmetic, not a moral/productivity score.
- **Unfinished plans:** do not silently become debt; no guilt-based catch-up model.
- **Insights:** do not invent causation; respect data/evidence thresholds.
- **Wellbeing:** optional observations such as energy/context/sleep; not a productivity score.
- **Wellness Boost:** independent practice capability; do not silently write unrelated Wellbeing/Progress data.
- **Today and Plan:** composition surfaces; they do not own every module’s business state.

# 14. CURRENT RECOVERED CAPABILITIES THAT EXPERIENCE 2 MUST NOT REGRESS

Experience 2 may look radically different but must preserve or improve Today, direct Start, direct Done, Plans changed, Tomorrow, real Daily Plan, persistent active session from server `started_at`, Goal CRUD, Activity create/edit/archive, recurring commitments, Capacity, factual Progress, evidence-gated Insights, Wellbeing/Energy, Journal, Wellness Boost, breathing experience, accessibility, reduced-motion handling, mobile interaction safeguards, Preview Access boundary and Preview D1 isolation.

Do not hide working features merely because a Figma frame omitted them.

# 15. DESIGN AUTHORITY MODEL

Use this precedence:

- Architecture/business/data authority: **GitHub production-domain contracts and live code**.
- Behavioral regression authority: **Frozen recovered Preview 1 baseline**.
- Interaction exploration authority: **Figma Make**.
- Exact visual specification authority: **Figma Design**.
- Context bridge: **Figma MCP**.
- Implementation engine: **Codex**.
- Source control/code truth: **GitHub**.

When they disagree:

```text
real domain truth
>
validated behavioral contract
>
approved product decision
>
exact Figma Design visual spec
>
Figma Make exploration
>
generated prototype code
```

# 16. FIGMA MAKE ROLE

Keep the current Figma Make file:

`https://www.figma.com/make/CWcG1y922g7XTslPrfBZrU/Personal-Planning-Application-Design?p=f&t=fYughkbfBBJLkxJ0-0`

Use it for interaction ideas, Living Surface behavior, state transitions, motion, screen composition, hierarchy, light/dark experimentation and new concepts.

Do not copy the generated React app into the repository.

Use MCP to inspect Make resources when useful.

When a Make idea stabilizes: formalize it in Figma Design; implement it against real product contracts; compare Preview 2 evidence to the Design frame.

# 17. FIGMA DESIGN ROLE

Create one normal Figma Design file. Suggested name: **Growth Compass — Experience 2 Design System**.

Suggested pages:

```text
00 Foundations
01 Variables
02 Components
03 Patterns
10 Today
20 Plan
30 Goals
40 Progress
50 Insights
60 Wellness
70 Journal
80 Settings
90 System States
95 Desktop Tablet
99 Prototype Reference
```

Recommended early definitive frames include Today / Next / Light, Today / Now / Light, Today / Free / Light, Today / Conflict / Light, Today / Next / Dark, Plan / Balanced, Plan / Overloaded, Goal / Featured, Goal Detail / Current, Progress / Overview, Insights / Simple, Insights / Detailed, Wellness / Home, Wellness / Breathing, Focus / Active concept and Settings / Main.

Do not design eighty screens before the component foundation stabilizes.

# 18. FIGMA DESIGN COMPONENTS

Create real Figma components/variants for stable primitives such as StaticSurface, RaisedSurface, LivingSurface, Button, IconButton, FloatingDock/Navigation, Input, Select, SegmentedControl, StatusBadge, LiveNumber, LiveProgress, CapacitySurface, DayItem/TimelineItem, GoalSurface, BottomSheet, Toast, Dialog, EmptyState and Skeleton. MentorSurface and ForecastPath are future-only until real capabilities exist.

Use Auto Layout, variables/tokens and meaningful variant names. Avoid detached duplicated frames.

# 19. EXPERIENCE 2 VISUAL DIRECTION

Target: **Ambient Luxury + Living UI**.

Not black/gold luxury, neon, rainbow, glass everywhere, oversized shadows, gamification, XP, confetti, streak flames, fake AI sparkles or giant universal life scores.

Desired feeling: premium, calm, precise, intelligent, mature, spatial, understated, human, responsive and alive only where information is actually changing.

Suggested starting palette:

Light: Canvas `#F3F4F7`, Surface `#FFFFFF`, Text `#101218`.

Dark: Canvas `#080A0F`, Surface `#11141B`, Raised `#171B24`, Text `#F7F8FA`.

Context: Indigo `#6D63FF`, Cyan `#48C7E8`, Emerald `#4DCF8A`, Coral `#FF806B`, Amber `#F1B45A`.

Validate exact values for accessibility before treating them as final.

# 20. LIVING SURFACE RULE

LivingSurface is a visual primitive, not a business module.

Use Living Surfaces sparingly for genuinely important changing state: Now, Next, Free window, real Capacity, real overload, active session, weekly review when real, future forecast when real, future AI recommendation when real.

LivingSurface must never calculate Capacity, determine Goal risk, fabricate forecast data, write Progress, schedule work or call AI by itself.

# 21. FIGMA MCP + CODEX SETUP

Use the **remote Figma MCP server** unless a specific reason requires desktop MCP.

In Codex: open Plugins; install/connect Figma; authenticate; confirm the Figma plugin is connected.

For Figma Make, pass the entire Make file URL.

For Figma Design, select the exact frame/component, copy link to selection and give that URL to Codex.

Codex should not implement a screen solely from a screenshot if structured Figma context is available.

# 22. CODEX OPERATING CONTRACT

Codex works only on Preview 2.

Repository: `m-nejatmand2026/Personal-Growth-Tracker`.

Integration branch: `feature/experience-v2`.

Do not checkout/edit `feature/experience-refinement` for Preview 2 work. Do not push new-experience code directly to `main`.

For every implementation task Codex should inspect the current branch head; read relevant architecture/module docs; inspect current real implementation; inspect Figma Make context; inspect exact Figma Design node if available; classify the change as visual-only / interaction / domain / data / operational; implement the smallest coherent slice; run tests; inspect browser screenshots; compare with Figma; fix discrepancies; commit clearly; and allow automatic Preview 2 deployment when green.

Do not repeatedly ask for routine implementation approval.

# 23. MULTI-AGENT CODEX SAFETY

If multiple Codex agents are used simultaneously, prefer isolated worktrees/branches rather than all mutating one working tree.

Conceptually:

```text
feature/experience-v2
├── v2/design-foundation
├── v2/today
├── v2/plan-capacity
└── v2/wellness
```

One integration owner merges/cherry-picks coherent changes into `feature/experience-v2`. Only the integration branch is the deployable Preview 2 lane. No agent may use Preview 1’s branch as its integration branch.

# 24. CODE CONNECT

Code Connect is useful later, not a prerequisite. Do not block Preview 2 on it.

First build stable real Experience 2 components. When stable production UI primitives exist and the account has Code Connect access, map high-value Figma components such as LivingSurface, StaticSurface, Button, Navigation/FloatingDock, CapacitySurface, GoalSurface, LiveNumber, LiveProgress, Input and Dialog/BottomSheet.

The purpose is to improve MCP implementation guidance, not replace source control.

# 25. CSS / PRESENTATION RESET

Do not add `figma-v2-final-final.css` on top of every historical layer.

First audit. Classify stylesheets as FOUNDATION, MODULE, ACCESSIBILITY, TRANSITIONAL or OBSOLETE.

Preserve functioning accessibility rules, Reduced Motion, recovered shared motion, breathing visual behavior, safe-area behavior, modal/focus mechanics and browser-test selectors where still appropriate.

Remove or replace duplicated token systems, screenshot-only overrides, CSS-generated business wording, hidden meaningful UI, giant `!important` chains when no longer necessary and old Figma visual layers once Experience 2 no longer depends on them.

Experience 1’s copied frontend is frozen and is not the place to do this cleanup. All cleanup applies to Experience 2.

# 26. EXPERIENCE 2 IMPLEMENTATION ORDER

## Phase A — infrastructure inside Preview 2

1. selector `/`;
2. frozen Experience 1 mounted at `/experience/1/`;
3. Experience 2 empty shell mounted at `/experience/2/`;
4. separate PWA/service-worker scopes;
5. automated boundary/freeze checks;
6. browser tests for selector and both roots.

## Phase B — Experience 2 design foundation

7. CSS architecture audit;
8. tokens;
9. themes;
10. typography;
11. Static/Raised/Living surfaces;
12. controls;
13. navigation shell;
14. motion.

## Phase C — core product

15. Today;
16. real Capacity / Plan;
17. Add / Logger;
18. Goals;
19. Progress;
20. Insights;
21. Wellness;
22. Journal;
23. Settings.

## Phase D — larger layouts

24. tablet;
25. desktop;
26. keyboard refinements;
27. responsive QA.

## Phase E — new domain capabilities only when approved

28. weekly scheduling engine;
29. goal forecasting;
30. Focus Timer;
31. AI Mentor;
32. calendar integration;
33. health-platform integration.

Do not fake Phase E concepts during Phase B/C.

# 27. TODAY EXPERIENCE 2

Today must answer **What should I do next?** within a few seconds.

Use real data only.

Possible Living Surface states: NOW, NEXT, FREE, CONFLICT and REVIEW READY when real.

Current active-session semantics are elapsed real time. Do not silently convert them into a countdown Focus Timer.

Keep Start, Done, Plans changed, Tomorrow, Capacity, Progress, Wellbeing/Energy and Journal. Visual hierarchy may change dramatically. Capability must not disappear.

# 28. PLAN EXPERIENCE 2

Use real Capacity immediately: Available, Planned, Flexible and Over by.

Do not hardcode demo hours or fake overload.

A full weekly calendar/auto-plan remains a future domain capability unless it genuinely exists in the live code when inspected. Figma may show future concepts. Do not present them as working intelligence before the engine exists.

# 29. GOALS / PROGRESS / INSIGHTS

## Goals
Improve visual hierarchy. Do not show unsupported forecast dates, confidence, trajectory, outcome percentage or milestone dependency state.

## Progress
Keep factual semantics. It is evidence of what happened.

## Insights
Keep evidence thresholds. Do not fill sparse data with attractive fabricated analytics. Use visual quality to make honest sparse information feel intentional.

# 30. WELLNESS

Preserve Wellbeing observations separately from Wellness Boost practices.

Experience 2 may dramatically improve Wellness atmosphere and motion. Keep breathing, accessibility, Reduced Motion and practice-player behavior. Do not create causal health claims.

# 31. AUTOMATION: QUALITY

PR #7 should continue using the existing `Quality` workflow.

Every coherent Preview 2 change should automatically run unit tests, API/contract tests, modularity tests, real Worker + isolated D1 integration tests, browser acceptance, Chromium, WebKit and screenshot/evidence artifact upload.

Extend browser acceptance to include `/`, `/experience/1/` and `/experience/2/` plus key states for each experience.

# 32. AUTOMATION: PREVIEW 2 DEPLOY

A guarded Preview 2 deployment workflow already exists. It must only deploy successful Quality results from `feature/experience-v2`, and must deploy the exact tested SHA.

It must remain fail-closed if Preview 2 is not enabled, D1 ID is missing, D1 equals Production, D1 equals Preview 1, migrations are pending, Access smoke fails, UI smoke fails or D1 health fails.

Do not weaken those checks for convenience.

# 33. ONE-TIME PREVIEW 2 CLOUDFLARE BOOTSTRAP

Before automatic Preview 2 deploy is enabled:

1. Create D1 `personal-growth-tracker-preview2`.
2. Record its UUID.
3. Add GitHub repository variable `GC_PREVIEW2_D1_ID=<UUID>`.
4. Keep `GC_PREVIEW2_ENABLED=false`.
5. Apply existing migrations explicitly to Preview 2 D1 only.
6. Verify D1 integrity.
7. Configure Cloudflare Access for `personal-growth-tracker-preview2.m-nejatmand.workers.dev`.
8. Allow CI service-token access.
9. Verify anonymous access is blocked.
10. Set `GC_PREVIEW2_ENABLED=true`.

Then ordinary development becomes edit → Quality → green exact SHA → auto-deploy Preview 2 → Access/UI/D1 smoke → evidence → continue.

# 34. PREVIEW 2 SELECTOR QA

The selector itself is release-blocking for Preview 2.

Automated tests should verify root shows exactly two primary experience choices; Experience 1 opens `/experience/1/`; Experience 2 opens `/experience/2/`; each contains Switch Experience; both return to `/`; browser back/forward behaves sensibly; keyboard navigation works; screen readers identify each choice; touch targets are large enough; direct deep links work; Access protects everything; and no experience assets leak across scopes.

# 35. VISUAL REGRESSION STRATEGY

Capture a golden evidence set for Experience 1 immediately after it is mounted. Keep screenshots for mobile Today, Plan, Progress, Insights, Wellness, breathing and key desktop views.

Experience 2 should have separate evidence. Artifact naming should distinguish `exp1-*`, `exp2-*` and `selector-*`.

Never overwrite one experience’s evidence with the other’s.

# 36. FIGMA-TO-CODE LOOP

For each Experience 2 screen family:

```text
Figma Make
      │ interaction / concept
      ▼
Figma Design
      │ exact frame / component / variables
      ▼
Figma MCP
      │ structured context
      ▼
Codex
      │ implementation on feature/experience-v2
      ▼
Quality
      │ tests + screenshots
      ▼
Preview 2
      │ real app
      ▼
Compare against Figma + Experience 1 behavior
      │
      └── fix and iterate
```

Do not implement the whole app in one giant pass.

# 37. REQUIRED DESIGN-CODE COMPARISON QUESTIONS

For every major screen ask:

1. Does Experience 2 preserve every real capability from Experience 1?
2. Is any displayed number fake?
3. Is any Figma-only behavior unsupported by the domain?
4. Is one action clearly primary?
5. Is there unnecessary card repetition?
6. Does the Living Surface actually represent changing information?
7. Is the UI usable at 375px?
8. Is dark mode correct?
9. Is Reduced Motion correct?
10. Can keyboard/screen-reader users accomplish the same task?
11. Did any Experience 1 file change?
12. Did any Preview 1 resource change?

If #11 or #12 is unexpectedly yes: stop and fix isolation.

# 38. DOCUMENTATION THAT THE NEW CHAT MUST KEEP CURRENT

Keep accurate: `START_PREVIEW2_CHAT.md`, `docs/PREVIEW2_MASTER_HANDOFF.md`, this handoff file, `docs/PREVIEW2_BOOTSTRAP.md`, design-system notes, Preview 2 testing/release notes, any Experience 1 freeze manifest, and any experience-boundary test documentation.

When architecture truth changes, update documentation in the same PR.

# 39. AUTONOMY RULE

The founder does not want routine engineering approval checkpoints.

For ordinary decisions: inspect → decide → implement → test → fix → automatic Preview 2 deploy when green → inspect evidence → continue.

Do not repeatedly ask whether to make routine CSS changes, run tests, deploy Preview 2 or fix failing tests.

Stop only when Preview 1 or Production would be affected; a major product/domain choice cannot reasonably be inferred; a migration/environment operation requires explicit review; external authentication/account authorization is required; the founder must personally choose between materially different UX directions; or the founder needs to test real-device behavior.

# 40. PRODUCTION RULE

No matter how good Experience 2 becomes: **DO NOT RELEASE TO PRODUCTION WITHOUT EXPLICIT AUTHORIZATION.**

Preview 2 being green is not authorization. Owner approval after real-device comparison is required.

# 41. FIRST TASKS FOR THE NEW CHAT

1. Read this entire handoff.
2. Inspect live head of `feature/experience-v2` and PR #7.
3. Confirm Preview 1 branch/Worker/D1 remain untouched.
4. Inspect the frozen baseline SHA/branch.
5. Connect Figma MCP in Codex.
6. Inspect the current Figma Make through MCP.
7. Create or inspect the normal Figma Design file.
8. Plan the selector + dual-entrypoint architecture against current static-asset/Worker routing.
9. Implement root selector.
10. Mount a frozen Experience 1 frontend copy under `/experience/1/`.
11. Create clean Experience 2 shell under `/experience/2/`.
12. Add experience-boundary and Experience-1-freeze tests.
13. Add separate PWA scopes.
14. Run full Quality.
15. Complete Preview 2 Cloudflare bootstrap if it still requires founder account action.
16. Once Preview 2 auto-deployment is active, inspect live selector and both experiences.
17. Begin Experience 2 design foundation.
18. Build Today first after foundation.
19. Continue screen-family by screen-family.

# 42. STARTUP PROMPT FOR THE NEW CHAT

Paste this as the first message:

> You are taking over the Growth Compass Preview 2 new-experience program.
>
> Repository: `m-nejatmand2026/Personal-Growth-Tracker`
>
> Work only on branch `feature/experience-v2` and draft PR #7.
>
> First read:
> - `START_PREVIEW2_CHAT.md`
> - `docs/PREVIEW2_MASTER_HANDOFF.md`
> - `docs/PREVIEW2_FIGMA_MCP_CODEX_FULL_HANDOFF.md`
> - `docs/PREVIEW2_BOOTSTRAP.md`
> - `docs/MODULARITY_STANDARD.md`
> - `docs/ARCHITECTURE.md`
> - `docs/EXPERIENCE_ARCHITECTURE.md`
>
> Do not restart strategy from scratch.
>
> Preview 1 is protected. Do not modify `feature/experience-refinement`, the `personal-growth-tracker-preview` Worker, the Preview 1 D1, or its deployment workflow.
>
> The frozen recovered reference is branch `baseline/preview1-recovered-2026-08-16` at SHA `3cf2a65b5918f73e4f182abfdce8589c98d85277`.
>
> Preview 2 must have one entry link. Opening `/` must show a neutral “Choose your experience” selector with Experience 1 — Current/Recovered and Experience 2 — New/Ambient Luxury.
>
> Inside Preview 2, Experience 1 and Experience 2 must be separate frontend implementations with separate HTML/CSS/JS entrypoints, PWA/service-worker scopes, cache namespaces and client preference namespaces. Do not implement this as one app with a theme class or giant conditional stylesheet.
>
> Experience 1 is a frozen frontend copy based on the recovered baseline and must be protected by an automated checksum/manifest test. Experience 2 is the Figma-driven new experience. Add CI checks that reject frontend imports across the two experiences.
>
> Both experiences may use the same Preview 2 backend and Preview 2 D1 so the founder can compare them using the same real data. Neither may use Preview 1 D1 or Production D1.
>
> Keep the current Figma Make as the interaction/exploration reference: `https://www.figma.com/make/CWcG1y922g7XTslPrfBZrU/Personal-Planning-Application-Design?p=f&t=fYughkbfBBJLkxJ0-0`
>
> Create/use a normal Figma Design file for stable components, variables and exact frame specifications. Connect the remote Figma MCP server to Codex and use structured Figma context before implementation. GitHub/domain contracts remain business/data authority. Do not copy Figma Make’s React architecture into the native HTML/CSS/JS modular application.
>
> Code Connect is optional later and must not block the work.
>
> Work autonomously: inspect → decide → implement → test → fix → allow automatic Preview 2 deployment when green → inspect evidence → continue.
>
> First implement the Preview 2 selector and hard experience isolation, then clean Experience 2’s design foundation, then build Experience 2 Today, real Capacity/Plan, Add/Logger, Goals, Progress, Insights, Wellness, Journal and Settings.
>
> Never fabricate forecasts, AI output, scheduling intelligence, health facts, progress or analytics that the domain does not support.
>
> Do not deploy Production.

# 43. SUCCESS CONDITION

The setup is successful when the founder has one protected Preview 2 link and sees:

```text
Choose your Growth Compass experience

Experience 1 — Current
Experience 2 — New
```

and can move between them while Preview 1 remains independently untouched; Experience 1 inside Preview 2 remains frozen; Experience 2 can evolve rapidly; both use the same Preview 2 test data; CSS/JS/PWA behavior cannot leak between experiences; Quality validates both; Preview 2 deploys the exact tested SHA automatically; Figma Make + Figma Design + MCP + Codex are part of the normal implementation loop; and Production remains protected.
