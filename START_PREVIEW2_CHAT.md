# START HERE — Growth Compass Preview 2

You are taking over the **Growth Compass Preview 2 new-experience program**.

Do not restart strategy from scratch.

## Required first actions

1. Read `docs/PREVIEW2_MASTER_HANDOFF.md` completely.
2. Read `docs/PREVIEW2_FIGMA_MCP_CODEX_FULL_HANDOFF.md` completely. This is the latest authority for the dual-experience Preview 2 architecture.
3. Read `docs/PREVIEW2_BOOTSTRAP.md`.
4. Read `docs/MODULARITY_STANDARD.md`, `docs/ARCHITECTURE.md`, and `docs/EXPERIENCE_ARCHITECTURE.md` before structural code changes.
5. Inspect draft PR #7 and verify the live head of `feature/experience-v2` before modifying code.
6. Confirm Preview 1 remains untouched.
7. Connect/use Figma MCP and inspect the current Figma Make source:
   `https://www.figma.com/make/CWcG1y922g7XTslPrfBZrU/Personal-Planning-Application-Design?p=f&t=fYughkbfBBJLkxJ0-0`

## Branch authority

Work only on:

`feature/experience-v2`

Do not use `feature/experience-refinement` for Preview 2 changes.

Do not deploy Production.

## Preview 1 protection

Do not modify:

- `feature/experience-refinement`;
- Preview 1 Worker `personal-growth-tracker-preview`;
- Preview 1 D1 `personal-growth-tracker-preview`;
- Preview 1 deployment workflow.

Frozen recovered reference:

`baseline/preview1-recovered-2026-08-16`

at SHA:

`3cf2a65b5918f73e4f182abfdce8589c98d85277`

## Preview 2 dual-experience requirement

Preview 2 must expose one base entry URL.

Opening `/` must show:

- **Experience 1 — Current/Recovered**
- **Experience 2 — New/Ambient Luxury**

Recommended routes:

```text
/                 → Experience Selector
/experience/1/     → frozen current experience
/experience/2/     → new Figma-driven experience
/api/*             → shared Preview 2 backend
```

Experience 1 and Experience 2 must be separate frontend implementations, not one app with a theme class or giant conditional stylesheet.

They require separate HTML/CSS/JS entrypoints, service-worker/PWA scopes, cache namespaces and client preference namespaces.

Both may use the same Preview 2 backend/D1 so the founder can compare both using the same real data.

Neither may use Preview 1 D1 or Production D1.

Experience 1 must be protected with an automated file-hash/freeze test.

Quality must also include an experience-boundary test rejecting frontend imports across Experience 1 and Experience 2.

## Mission

Create a **substantially new premium Experience 2**, not merely a recolor, while preserving the validated modular/product foundation.

The visual direction is Ambient Luxury + Living UI:

- neutral architectural surfaces;
- premium light/dark themes;
- restrained contextual indigo/cyan/emerald light;
- contextual Life Area accents;
- Living Surfaces for genuinely changing/high-value state;
- calm purposeful motion;
- simpler hierarchy and fewer equal-weight cards;
- no gamification, guilt, fake data or fake AI.

## Authority split

- GitHub/current product contracts = architecture, business behavior and real data authority.
- Frozen recovered baseline = behavioral/regression reference.
- Figma Make = interaction/visual exploration reference.
- Figma Design = exact visual/component specification.
- Figma MCP = design-context bridge.
- Codex = implementation engine.
- Code Connect = optional later optimization; do not block work on it.

Never copy Figma Make's generated React architecture blindly into the native HTML/CSS/JS modular application.

## First implementation phase

Before redesigning screens:

1. implement the Preview 2 selector;
2. mount frozen Experience 1 at `/experience/1/`;
3. create clean Experience 2 shell at `/experience/2/`;
4. add Experience 1 freeze validation;
5. add cross-experience boundary validation;
6. isolate service workers/PWA caches;
7. extend browser tests to selector + both experience roots;
8. then audit Experience 2 CSS/design layers;
9. preserve recovered behavior and motion/breathing/accessibility improvements;
10. establish canonical Experience 2 tokens/themes/shared surface primitives;
11. rebuild Experience 2 Today;
12. then real Capacity/Plan;
13. then remaining screen families.

Do not add another permanent late override stylesheet as the solution.

## Product rules that must remain true

- Daily Plan is intention.
- Progress is fact.
- Capacity is real time arithmetic.
- unfinished work does not become shame/debt automatically.
- Insights do not invent causation.
- Wellness Boost remains independent from Wellbeing observations.
- Today and Plan remain composition surfaces.
- unsupported forecasts/scheduling/AI/health claims must not be fabricated.

## Automation

Quality runs automatically for PR #7.

A guarded `Deploy Preview 2` workflow is installed on `main` and listens for successful Quality runs from exactly `feature/experience-v2`.

It remains disabled until the one-time isolated Preview 2 Cloudflare bootstrap in `docs/PREVIEW2_BOOTSTRAP.md` is complete and repository variable `GC_PREVIEW2_ENABLED=true`.

After bootstrap, normal operating mode is:

```text
inspect → implement → Quality → automatic exact-SHA Preview 2 deploy → smoke test → inspect evidence → fix → continue
```

Do not repeatedly ask the user for normal engineering approvals.

Stop only for genuine major product/domain choices, explicit environment/schema operations, Production changes, Preview 1 impact, external authorization, or when the user must personally compare/test UX.
