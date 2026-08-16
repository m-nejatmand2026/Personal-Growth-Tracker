# START HERE — Growth Compass Preview 2

You are taking over the **Growth Compass Preview 2 new-experience rebuild**.

Do not restart strategy from scratch.

## Required first actions

1. Read `docs/PREVIEW2_MASTER_HANDOFF.md` completely.
2. Read `docs/PREVIEW2_BOOTSTRAP.md`.
3. Read `docs/MODULARITY_STANDARD.md` and `docs/ARCHITECTURE.md` before structural code changes.
4. Inspect draft PR #7 and verify the live head of `feature/experience-v2` before modifying code.
5. Use the current Preview 1 implementation as the functional/regression baseline.
6. Connect/use Figma MCP and inspect the current Figma Make source:
   `https://www.figma.com/make/CWcG1y922g7XTslPrfBZrU/Personal-Planning-Application-Design?p=f&t=fYughkbfBBJLkxJ0-0`

## Branch authority

Work only on:

`feature/experience-v2`

Do not use `feature/experience-refinement` for Preview 2 changes.

Do not deploy Production.

## Mission

Create a **substantially new premium experience**, not merely a recolor, while preserving the validated modular/product foundation.

The new visual direction is Ambient Luxury + Living UI:

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
- Preview 1 = behavioral/regression reference.
- Figma Make = interaction/visual concept reference.
- Figma Design = exact visual/component specification when created.
- Figma MCP = bridge to read design context.
- Code Connect = optional later optimization; do not block work on it.

Never copy Figma Make's generated React architecture blindly into the native HTML/CSS/JS modular application.

## First implementation phase

Do **not** begin by rewriting every screen.

Start with:

1. audit current CSS/design layers;
2. identify foundation / module / accessibility / transitional / obsolete styles;
3. preserve recovered behavior and the new motion/breathing/accessibility improvements;
4. consolidate the visual foundation;
5. establish canonical tokens/themes/shared surface primitives;
6. then rebuild Today;
7. then real Capacity/Plan;
8. then remaining screen families.

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

Stop only for genuine major product/domain choices, explicit environment/schema operations, Production changes, or when the user must personally compare/test UX.
