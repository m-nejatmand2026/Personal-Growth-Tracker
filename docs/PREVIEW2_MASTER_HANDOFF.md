# Growth Compass — Preview 2 Master Handoff

Handoff date: 2026-08-16

Purpose: hand complete ownership of the new Growth Compass experience to a fresh specialist chat without losing the current recovered application.

## 1. Operating model

There are now three separate lanes:

1. **Production / `main` runtime** — protected release baseline. Do not deploy Production or mutate Production D1 without explicit user authorization.
2. **Preview 1 / `feature/experience-refinement`** — the current recovered experience. Preserve it as the behavioral/regression baseline.
3. **Preview 2 / `feature/experience-v2`** — the new design/experience lane. All Figma-driven redesign work goes here.

Preview 2 starts from exact Preview 1 checkpoint:

`3cf2a65b5918f73e4f182abfdce8589c98d85277`

That exact commit passed Quality and was deployed successfully to Preview 1 before Preview 2 was branched.

## 2. Repository

Repository:

`https://github.com/m-nejatmand2026/Personal-Growth-Tracker.git`

Preview 2 branch:

`feature/experience-v2`

Do not use `feature/experience-refinement` for new-design changes.

Do not push redesign work directly to `main`.

## 3. Current architecture authority

Preserve the modular monolith.

Read before structural changes:

- `docs/MODULARITY_STANDARD.md`
- `docs/ARCHITECTURE.md`
- `docs/EXPERIENCE_ARCHITECTURE.md`
- `docs/UX_UI_MASTER_SPEC.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- relevant module specs/runbooks

Architecture/product contracts outrank mockups.

The current application uses a Cloudflare Worker + D1 modular monolith with native HTML/CSS/JavaScript frontend modules.

Do **not** rewrite the application into Figma Make's generated React architecture.

## 4. Current product semantics that must survive the redesign

- Goal = long-term direction.
- Daily Plan = dated intention.
- Progress = factual historical evidence.
- Planned work never becomes Progress automatically.
- Unfinished intentions do not silently become debt.
- Capacity is concrete time arithmetic, not a productivity/moral score.
- Insights do not claim causation without evidence.
- Wellbeing observations remain separate from Wellness Boost practices.
- Today and Plan are composition surfaces, not owners of every business domain.

## 5. Current Preview 1 capabilities to preserve

The new experience must not regress these validated flows:

- Today loads with direct Start / Done / Plans changed actions.
- Tomorrow is one tap away.
- Progress, Wellbeing/Energy and Journal remain discoverable.
- Global Add distinguishes Done / Plan / Start now and defaults according to the approved product contract.
- Start now creates a persistent active session from real server `started_at`.
- Done creates factual completion through the real completion path.
- Activities can be created, edited and archived.
- Goals remain real planning objects.
- recurring commitments and Capacity remain real.
- Progress remains factual.
- Insights remain evidence-gated.
- Journal remains functional.
- Wellness Boost remains an independent practice/player capability.
- breathing interaction and its browser visual acceptance must not be casually removed.
- accessibility focus/keyboard/mobile safeguards remain release-blocking.

## 6. New experience goal

Preview 2 is not a small reskin.

It is allowed to create a substantially new visual and interaction experience while keeping the validated product/domain foundation.

Target experience:

**Ambient Luxury + Living UI**

Characteristics:

- neutral architectural surfaces;
- premium light and dark themes;
- restrained contextual indigo/cyan/emerald illumination;
- contextual Life Area color;
- Living Surfaces only for important changing state;
- stronger hierarchy than repeated equal cards;
- subtle purposeful motion;
- no gamification, guilt, fake scores or decorative fake intelligence.

## 7. Figma authority

Current Figma Make source:

`https://www.figma.com/make/CWcG1y922g7XTslPrfBZrU/Personal-Planning-Application-Design?p=f&t=fYughkbfBBJLkxJ0-0`

Use Figma Make as:

- interactive prototype reference;
- visual direction;
- state/motion reference;
- design exploration source.

Do not copy its generated React code blindly into production.

Recommended next step is to create/use a normal Figma Design file for stable visual specification, components, variables and exact screen states.

## 8. Figma MCP workflow

The new design chat should connect Figma MCP and use it actively.

For each implementation family:

1. inspect the current GitHub implementation;
2. inspect the Figma Make behavior through MCP;
3. inspect the exact Figma Design node through MCP when available;
4. classify differences as visual-only / interaction / domain / data;
5. preserve production semantics;
6. implement on `feature/experience-v2`;
7. run Quality;
8. inspect browser screenshots/evidence;
9. compare against Figma;
10. iterate.

Figma is visual/interaction authority only where it does not conflict with real domain/product contracts.

## 9. Code Connect

Code Connect is optional and must not block Preview 2.

Use it later if/when it is available on the user's Figma plan and when stable production components exist.

High-value future mappings include:

- LivingSurface
- StaticSurface
- Button
- FloatingDock / navigation
- Timeline/Day item
- CapacitySurface
- Goal surfaces
- progress/chart primitives

MCP alone is sufficient to begin.

## 10. Design-system implementation strategy

Do **not** add one more permanent override stylesheet on top of every historical layer.

First task on Preview 2:

### Design baseline audit/reset

Inventory current presentation layers and classify them as:

- foundation;
- module-owned;
- accessibility-critical;
- transitional;
- obsolete.

Known layers include historical/recovery/Figma-era CSS. Some are necessary; some should be consolidated or removed.

Preserve recent high-value improvements:

- shared motion infrastructure;
- View Transition/fallback behavior;
- Reduced Motion behavior;
- breathing interaction;
- direct Energy access;
- current functional browser acceptance.

Remove visual debt surgically, not blindly.

## 11. Recommended implementation order

1. CSS/design-system audit and cleanup.
2. canonical tokens/themes.
3. shared Static / Raised / Living surface primitives.
4. controls and navigation shell.
5. Today.
6. real Capacity / Plan summary.
7. Logger/Add.
8. Progress.
9. Insights.
10. Wellness Boost.
11. Journal.
12. Settings.
13. deeper Goal experience.
14. tablet/desktop refinement.
15. only then consider new domain capabilities such as full week scheduling, forecasting, Focus Timer or AI Mentor.

## 12. Living Surface rule

LivingSurface is a shared presentation primitive, not a business owner.

It may visually render real states such as:

- Now;
- Next;
- Free window;
- real Capacity conflict;
- active session;
- future real forecast;
- future real Mentor recommendation.

It must not itself:

- calculate Capacity;
- create forecasts;
- write Progress;
- schedule activities;
- call AI;
- invent state.

## 13. Important Figma concepts: adopt vs defer

### Safe to adopt now

- Ambient Luxury visual system;
- Living Surfaces using real data;
- contextual color/light;
- stronger Now/Next presentation;
- real Capacity visualization;
- richer motion;
- improved Goal/Progress/Insights visual hierarchy;
- immersive Wellness atmosphere.

### Defer until real domain support exists

- full weekly constraint auto-scheduling;
- drag/resizable calendar engine;
- Goal forecast completion dates;
- confidence scores;
- milestone dependency engine;
- production AI Mentor;
- countdown Focus Timer with Pause/+15 semantics;
- health-platform synchronization.

Never ship hardcoded demo data as real product intelligence.

## 14. Preview 2 deployment architecture

Preview 2 Worker target:

`personal-growth-tracker-preview2`

Expected URL:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev`

Preview 2 must have its own D1 database:

`personal-growth-tracker-preview2`

Do not point Preview 2 at Production D1 or Preview 1 D1.

A guarded workflow exists on `main`:

`.github/workflows/deploy-preview2.yml`

It listens to the existing `Quality` workflow and only deploys when:

- Quality succeeded;
- the run came from a pull request;
- head branch is exactly `feature/experience-v2`;
- head repository is this repository;
- repository variable `GC_PREVIEW2_ENABLED` is exactly `true`.

It then checks out the exact tested SHA, builds an isolated Preview 2 Wrangler config, refuses pending migrations, deploys Preview 2 only, and verifies Cloudflare Access + root UI + D1 health.

## 15. One-time Preview 2 bootstrap still required

Before automatic Preview 2 deployment can run, perform these explicit environment steps:

1. Create Cloudflare D1 database named `personal-growth-tracker-preview2`.
2. Record its D1 UUID.
3. In GitHub repository variables create:
   - `GC_PREVIEW2_D1_ID` = the new Preview 2 D1 UUID
   - `GC_PREVIEW2_ENABLED` = `false` initially
4. Apply the existing migrations explicitly to **Preview 2 only** and verify D1 integrity.
5. Configure Cloudflare Access for `personal-growth-tracker-preview2.m-nejatmand.workers.dev` before enabling automatic deployment.
6. Permit the existing Preview CI service token for the Preview 2 Access application, or create dedicated Preview 2 CI credentials if preferred.
7. Verify anonymous requests are blocked.
8. Set `GC_PREVIEW2_ENABLED=true`.

After that, ordinary Preview 2 commits should require no manual deployment.

## 16. Pull-request workflow

Keep Preview 2 in a long-lived draft PR against `main` during redesign.

Normal loop:

```text
New design chat edits feature/experience-v2
        ↓
Quality runs automatically
        ↓
Quality green
        ↓
Deploy Preview 2 workflow checks exact SHA
        ↓
Preview 2 deploys automatically
        ↓
Access + UI + D1 smoke
        ↓
user tests Preview 2
        ↓
continue
```

Do not merge merely because Preview 2 is green.

## 17. Preview 1 preservation

The existing Preview 1 branch and Worker remain independent.

Do not modify or delete:

- `feature/experience-refinement` for Preview 2 work;
- `personal-growth-tracker-preview` Worker;
- `personal-growth-tracker-preview` D1;
- the existing Preview 1 deployment workflow.

This allows side-by-side comparison of old/current vs new experience.

## 18. Production rule

**DO NOT DEPLOY PREVIEW 2 TO PRODUCTION.**

No Preview 2 work authorizes:

- merging to Production;
- Production Worker deployment;
- Production D1 migrations;
- Production data mutation.

Production remains an explicit later decision.

## 19. New-chat startup instruction

Use the following as the first message in the new design/development chat:

> You are taking over the Growth Compass Preview 2 experience rebuild. Read `docs/PREVIEW2_MASTER_HANDOFF.md` completely before making changes. Work only on `feature/experience-v2`. Preserve Preview 1 and Production. Use the current application as the functional/domain baseline and the current Figma Make/Figma Design as the visual/interaction reference. Connect and use Figma MCP. Do not copy Figma Make React code into production blindly. Begin by auditing/consolidating the current presentation layers and establishing the clean design-system foundation, then implement the new experience screen family by screen family. Run Quality after every coherent change and rely on the automatic Preview 2 deployment only after its environment bootstrap is enabled. Never invent forecasts, AI output, scheduling intelligence, health facts or progress data that the real domain does not support.

## 20. Autonomous operating rule

For ordinary implementation decisions:

- inspect;
- decide;
- implement;
- test;
- fix;
- deploy to Preview 2 automatically when green;
- continue.

Do not repeatedly stop for approval on normal engineering choices.

Stop only when:

- a major product/domain decision genuinely cannot be inferred;
- a schema/data operation needs explicit environment review;
- Production would be affected;
- the user needs to personally test/choose between substantially different UX directions.
