# Growth Compass — Preview 2 Master Handoff

Handoff date: 2026-08-16

Purpose: preserve the architecture/product history for the Growth Compass Preview 2 program.

> **Current-operations notice (2026-08-20):** infrastructure, migration and authentication rollout details in this historical handoff are superseded by `START_PREVIEW2_CHAT.md`, `docs/PREVIEW2_BOOTSTRAP.md`, `docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md`, and the actual workflows under `.github/workflows/`. The canonical Preview 2 origin is `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev`. Do not use older `GC_PREVIEW2_ENABLED` or manual-migration-only bootstrap instructions as current operational authority.

## Latest design authority

For the complete Figma Make + Figma Design + Figma MCP + GitHub + Codex workflow and the two-experience selector architecture, read:

`docs/PREVIEW2_FIGMA_MCP_CODEX_FULL_HANDOFF.md`

That file remains design/architecture history. Current deployment/auth operations are governed by the runbooks named above.

## 1. Operating model

There are four protected references/lanes:

1. **Production / `main` runtime** — protected release baseline. Do not deploy Production or mutate Production D1 without explicit user authorization.
2. **Preview 1 / `feature/experience-refinement`** — the current recovered experience. Preserve it as an independent behavioral/regression baseline.
3. **Frozen recovered baseline / `baseline/preview1-recovered-2026-08-16`** — immutable reference at SHA `3cf2a65b5918f73e4f182abfdce8589c98d85277`.
4. **Preview 2 / `feature/experience-v2`** — the new design/experience lane. All Experience 2 work goes here.

Preview 2 started from exact validated Preview 1 checkpoint:

`3cf2a65b5918f73e4f182abfdce8589c98d85277`

## 2. Repository and branch

Repository:

`https://github.com/m-nejatmand2026/Personal-Growth-Tracker.git`

Preview 2 branch:

`feature/experience-v2`

Draft PR:

`#7 — Build Growth Compass Preview 2 experience`

Do not use `feature/experience-refinement` for new-design changes.

Do not push Preview 2 work directly to `main`.

## 3. Preview 2 contains two separate experiences

The Preview 2 base URL opens a neutral selector:

- **Experience 1 — Current/Recovered**
- **Experience 2 — New**

Routes:

```text
/                 → Experience Selector
/experience/1/     → frozen current/recovered experience
/experience/2/     → Experience 2
/api/*             → shared Preview 2 backend
```

Experience 1 and Experience 2 are separate frontend implementations, not one app with a theme class or giant conditional stylesheet.

They require separate HTML/CSS/JS entrypoints, PWA/service-worker scopes, cache namespaces and browser preference namespaces.

Both may share the same Preview 2 backend and Preview 2 D1. Neither may use Preview 1 D1 or Production D1.

Experience 1 is a frozen frontend copy based on `baseline/preview1-recovered-2026-08-16` and is guarded by automated freeze checks. Quality also rejects direct frontend imports across Experience 1 and Experience 2.

## 4. Architecture authority

Preserve the modular monolith.

Read before structural changes:

- `docs/MODULARITY_STANDARD.md`
- `docs/ARCHITECTURE.md`
- `docs/EXPERIENCE_ARCHITECTURE.md`
- `docs/UX_UI_MASTER_SPEC.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- relevant module specs/runbooks

Architecture/product contracts outrank mockups.

The application uses a Cloudflare Worker + D1 modular monolith with native HTML/CSS/JavaScript frontend modules.

Do **not** rewrite the application into Figma Make's generated React architecture.

## 5. Product semantics that must survive

- Goal = long-term direction.
- Daily Plan = dated intention.
- Progress = factual historical evidence.
- Planned work never becomes Progress automatically.
- Unfinished intentions do not silently become debt.
- Capacity is concrete time arithmetic, not a productivity/moral score.
- Insights do not claim causation without evidence.
- Wellbeing observations remain separate from Wellness Boost practices.
- Today and Plan are composition surfaces, not owners of every business domain.

## 6. Recovered capabilities to preserve

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

## 7. Experience 2 design goal

Preview 2 Experience 2 is not a small reskin.

It may create a substantially new visual and interaction experience while keeping the validated product/domain foundation.

Current direction is modern, calm, watery/glassy and disciplined, with strong hierarchy, restrained motion, accessible behavior and no fabricated intelligence.

## 8. Figma authority

Current Figma Make source remains documented in `docs/PREVIEW2_FIGMA_MCP_CODEX_FULL_HANDOFF.md`.

Use Figma Make as interaction/visual exploration reference, not production architecture authority.

Use normal Figma Design for stable visual specification, components, variables and exact screen states where available.

## 9. Figma MCP workflow

For design implementation families:

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

## 10. Code Connect

Code Connect is optional and must not block Preview 2.

## 11. Design-system implementation strategy

Do not add permanent override stylesheet layers as the default solution.

Experience 1 is frozen.

Experience 2 should preserve high-value shared platform behavior while keeping presentation ownership isolated.

## 12. Experience implementation principle

Use shared presentation primitives only when they are genuinely neutral. Business state belongs to the owning domain/module.

Living/watery presentation must never calculate Capacity, create forecasts, write Progress, schedule activities, call AI or invent state.

## 13. Defer unsupported capabilities

Do not fabricate:

- full weekly auto-scheduling;
- Goal forecast completion dates;
- confidence scores;
- milestone dependency engines;
- production AI Mentor output;
- unsupported Focus Timer semantics;
- health-platform synchronization.

## 14. Current Preview 2 deployment architecture

Canonical Worker:

`personal-growth-tracker-preview2`

Canonical origin:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev`

Canonical D1:

`personal-growth-tracker-preview2`

Current branch deployment workflow:

`.github/workflows/deploy-preview2-branch.yml`

Current PR remote-smoke workflow:

`.github/workflows/preview2-remote-smoke.yml`

The branch workflow runs on pushes to exactly `feature/experience-v2`, validates the exact branch/repository, runs the test gates, resolves the isolated Preview 2 D1, verifies the exact authorized migration set, invokes the guarded idempotent Preview 2 migration script, requires zero pending migrations, deploys only the Preview 2 Worker and verifies the staged auth/D1 boundary.

Cloudflare Access remains in front until real Growth Compass owner/tester acceptance succeeds.

Authentication activation is governed by `docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md`.

## 15. Pull-request workflow

Keep Preview 2 in long-lived draft PR #7 against `main` until owner acceptance explicitly authorizes a later release decision.

Normal loop:

```text
feature/experience-v2
        ↓
Quality + branch validation
        ↓
guarded authorized Preview 2 migration check/apply
        ↓
Preview 2 deployment
        ↓
remote smoke/evidence
        ↓
user acceptance
        ↓
continue
```

Do not merge merely because Preview 2 is green.

## 16. Preview 1 preservation

Do not modify or delete:

- `feature/experience-refinement` for Preview 2 work;
- `personal-growth-tracker-preview` Worker;
- `personal-growth-tracker-preview` D1;
- the existing Preview 1 deployment workflow.

The frozen baseline branch gives Preview 2 its internal Experience 1 without coupling to the live Preview 1 lane.

## 17. Production rule

**DO NOT DEPLOY PREVIEW 2 TO PRODUCTION.**

No Preview 2 work authorizes merging to Production, Production Worker deployment, Production D1 migrations or Production data mutation.

## 18. Autonomous operating rule

For ordinary implementation decisions: inspect; decide; implement; test; fix; deploy to Preview 2 through the guarded branch path; inspect evidence; continue.

Stop only when a major product/domain decision genuinely cannot be inferred; Production or Preview 1 would be affected; destructive data operations are proposed; external authorization is required; or the user must personally test/choose real-account or substantially different UX behavior.
