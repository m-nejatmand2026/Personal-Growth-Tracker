# Growth Compass — Preview 2 Master Handoff

Handoff date: 2026-08-16

Purpose: hand complete ownership of the new Growth Compass experience to a fresh specialist chat without losing the current recovered application.

## Latest authority

For the complete Figma Make + Figma Design + Figma MCP + GitHub + Codex workflow and the two-experience selector architecture, read:

`docs/PREVIEW2_FIGMA_MCP_CODEX_FULL_HANDOFF.md`

That file is the latest authority for Preview 2 frontend separation.

## 1. Operating model

There are now four protected references/lanes:

1. **Production / `main` runtime** — protected release baseline. Do not deploy Production or mutate Production D1 without explicit user authorization.
2. **Preview 1 / `feature/experience-refinement`** — the current recovered experience. Preserve it as an independent behavioral/regression baseline.
3. **Frozen recovered baseline / `baseline/preview1-recovered-2026-08-16`** — immutable reference at SHA `3cf2a65b5918f73e4f182abfdce8589c98d85277`.
4. **Preview 2 / `feature/experience-v2`** — the new design/experience lane. All Figma-driven redesign work goes here.

Preview 2 started from exact validated Preview 1 checkpoint:

`3cf2a65b5918f73e4f182abfdce8589c98d85277`

That exact commit passed Quality and was deployed successfully to Preview 1 before Preview 2 was branched.

## 2. Repository

Repository:

`https://github.com/m-nejatmand2026/Personal-Growth-Tracker.git`

Preview 2 branch:

`feature/experience-v2`

Do not use `feature/experience-refinement` for new-design changes.

Do not push redesign work directly to `main`.

## 3. Preview 2 must contain two separate experiences

The Preview 2 base URL must open a neutral selector:

- **Experience 1 — Current/Recovered**
- **Experience 2 — New/Ambient Luxury**

Recommended routes:

```text
/                 → Experience Selector
/experience/1/     → frozen current/recovered experience
/experience/2/     → new Figma-driven experience
/api/*             → shared Preview 2 backend
```

Experience 1 and Experience 2 must be separate frontend implementations, not one app with a theme class or giant conditional stylesheet.

They require separate HTML/CSS/JS entrypoints, PWA/service-worker scopes, cache namespaces and browser preference namespaces.

Both may share the same Preview 2 backend and Preview 2 D1 so the founder can compare both with the same data.

Neither may use Preview 1 D1 or Production D1.

Experience 1 is a frozen frontend copy based on `baseline/preview1-recovered-2026-08-16` and should be guarded by an automated hash/manifest test.

Quality should also reject direct frontend imports across Experience 1 and Experience 2.

The independent live Preview 1 branch/Worker/D1 remain untouched.

## 4. Current architecture authority

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

## 5. Current product semantics that must survive the redesign

- Goal = long-term direction.
- Daily Plan = dated intention.
- Progress = factual historical evidence.
- Planned work never becomes Progress automatically.
- Unfinished intentions do not silently become debt.
- Capacity is concrete time arithmetic, not a productivity/moral score.
- Insights do not claim causation without evidence.
- Wellbeing observations remain separate from Wellness Boost practices.
- Today and Plan are composition surfaces, not owners of every business domain.

## 6. Current recovered capabilities to preserve

Experience 2 must not regress:

- Today with direct Start / Done / Plans changed actions;
- Tomorrow one tap away;
- Progress, Wellbeing/Energy and Journal discoverability;
- Add distinguishing Done / Plan / Start now;
- persistent active session from real server `started_at`;
- factual completion path;
- Activity create/edit/archive;
- Goal planning objects;
- recurring commitments and Capacity;
- factual Progress;
- evidence-gated Insights;
- Journal;
- Wellness Boost;
- breathing interaction and visual acceptance;
- accessibility focus/keyboard/mobile safeguards.

## 7. New experience goal

Preview 2 Experience 2 is not a small reskin.

It may create a substantially new visual and interaction experience while keeping the validated product/domain foundation.

Target:

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

## 8. Figma authority

Current Figma Make source:

`https://www.figma.com/make/CWcG1y922g7XTslPrfBZrU/Personal-Planning-Application-Design?p=f&t=fYughkbfBBJLkxJ0-0`

Use Figma Make as interactive prototype reference, visual direction, state/motion reference and design exploration source.

Do not copy its generated React code blindly into production.

Create/use a normal Figma Design file for stable visual specification, components, variables and exact screen states.

## 9. Figma MCP workflow

The new design chat should connect Figma MCP and use it actively.

For each implementation family:

1. inspect the current GitHub implementation;
2. inspect Figma Make behavior through MCP;
3. inspect the exact Figma Design node through MCP when available;
4. classify differences as visual-only / interaction / domain / data;
5. preserve production semantics;
6. implement on `feature/experience-v2`;
7. run Quality;
8. inspect browser screenshots/evidence;
9. compare against Figma;
10. iterate.

Figma is visual/interaction authority only where it does not conflict with real domain/product contracts.

## 10. Code Connect

Code Connect is optional and must not block Preview 2.

Use it later if/when available on the user's Figma plan and when stable production components exist.

Potential mappings include LivingSurface, StaticSurface, Button, Navigation/FloatingDock, Timeline/Day item, CapacitySurface, Goal surfaces and progress/chart primitives.

MCP alone is sufficient to begin.

## 11. Design-system implementation strategy

Do not add one more permanent override stylesheet on top of every historical layer.

Experience 1 is frozen.

Experience 2 begins with a presentation audit/reset:

- foundation;
- module-owned;
- accessibility-critical;
- transitional;
- obsolete.

Preserve recent high-value improvements such as shared motion infrastructure, View Transition/fallback behavior, Reduced Motion, breathing interaction, direct Energy access and current browser acceptance.

Remove visual debt surgically, not blindly.

## 12. Recommended implementation order

1. Preview 2 selector.
2. Frozen Experience 1 under `/experience/1/`.
3. Clean Experience 2 shell under `/experience/2/`.
4. Experience 1 freeze/hash check.
5. Cross-experience boundary test.
6. Separate PWA/service-worker scopes.
7. CSS/design-system audit and cleanup for Experience 2.
8. canonical tokens/themes.
9. shared Static / Raised / Living surface primitives for Experience 2.
10. controls and navigation shell.
11. Today.
12. real Capacity / Plan summary.
13. Logger/Add.
14. Goals.
15. Progress.
16. Insights.
17. Wellness Boost.
18. Journal.
19. Settings.
20. tablet/desktop refinement.
21. only then consider new domain capabilities such as full week scheduling, forecasting, Focus Timer or AI Mentor.

## 13. Living Surface rule

LivingSurface is a shared presentation primitive, not a business owner.

It may visually render real states such as Now, Next, Free window, real Capacity conflict and active session.

It must not calculate Capacity, create forecasts, write Progress, schedule activities, call AI or invent state.

## 14. Important Figma concepts: adopt vs defer

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

## 15. Preview 2 deployment architecture

Preview 2 Worker target: `personal-growth-tracker-preview2`.

Expected URL: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev`.

Preview 2 must have its own D1: `personal-growth-tracker-preview2`.

Do not point Preview 2 at Production D1 or Preview 1 D1.

A guarded workflow exists on `main`: `.github/workflows/deploy-preview2.yml`.

It listens to Quality and only deploys when Quality succeeded; run came from a pull request; head branch is exactly `feature/experience-v2`; head repository is this repository; and `GC_PREVIEW2_ENABLED` is exactly `true`.

It checks out the exact tested SHA, uses an isolated Preview 2 Wrangler config, refuses pending migrations, deploys Preview 2 only, and verifies Cloudflare Access + root UI + D1 health.

## 16. One-time Preview 2 bootstrap still required

1. Create D1 `personal-growth-tracker-preview2`.
2. Record UUID.
3. Create GitHub variables `GC_PREVIEW2_D1_ID=<UUID>` and `GC_PREVIEW2_ENABLED=false`.
4. Apply existing migrations explicitly to Preview 2 only and verify integrity.
5. Configure Cloudflare Access for `personal-growth-tracker-preview2.m-nejatmand.workers.dev`.
6. Permit Preview CI service-token access or create dedicated credentials.
7. Verify anonymous requests are blocked.
8. Set `GC_PREVIEW2_ENABLED=true`.

After that, ordinary Preview 2 commits should require no manual deployment.

## 17. Pull-request workflow

Keep Preview 2 in long-lived draft PR #7 against `main` during redesign.

Normal loop:

```text
feature/experience-v2
        ↓
Quality
        ↓
exact tested SHA
        ↓
automatic Preview 2 deployment
        ↓
Access + UI + D1 smoke
        ↓
user compares Experience 1 vs Experience 2
        ↓
continue
```

Do not merge merely because Preview 2 is green.

## 18. Preview 1 preservation

Do not modify or delete:

- `feature/experience-refinement` for Preview 2 work;
- `personal-growth-tracker-preview` Worker;
- `personal-growth-tracker-preview` D1;
- the existing Preview 1 deployment workflow.

The frozen baseline branch gives Preview 2 its internal Experience 1 without coupling to the live Preview 1 lane.

## 19. Production rule

**DO NOT DEPLOY PREVIEW 2 TO PRODUCTION.**

No Preview 2 work authorizes merging to Production, Production Worker deployment, Production D1 migrations or Production data mutation.

## 20. Autonomous operating rule

For ordinary implementation decisions: inspect; decide; implement; test; fix; deploy to Preview 2 automatically when green; inspect evidence; continue.

Do not repeatedly stop for approval on normal engineering choices.

Stop only when a major product/domain decision genuinely cannot be inferred; schema/data operation needs explicit environment review; Production or Preview 1 would be affected; external authorization is required; or the user must personally test/choose a substantially different UX direction.
