# Growth Compass Presentation Architecture

## Purpose

Growth Compass presentation code must remain replaceable without turning the cascade into an override chain. Visual changes belong to the narrowest owner that understands them. A later stylesheet is not a valid substitute for fixing the correct owner.

## Runtime layers

The runtime cascade has five responsibilities:

1. **Foundation and canonical design system** — base reset/experience compatibility plus `design-system.css`. The design system is the only authority for Growth Compass theme tokens, focus primitives, touch-size primitives and shared visual constants.
2. **Application shell** — `navigation-shell.css` owns responsive shell geometry, primary navigation, the desktop rail, mobile bottom navigation and the Explore control.
3. **Module presentation** — files under `public/css/modules/` and their module-specific companion sheets own business-module UI. A module must not style another module's private internals.
4. **Current product composition** — `product-rebuild.css` and `product-rebuild-pages.css` compose the current Beta experience across module surfaces. They may arrange public module surfaces but must not absorb module business logic.
5. **Cross-cutting safeguards** — motion behavior and the final accessibility regression sheet enforce interaction/accessibility invariants. Accessibility CSS must not become a second product-layout system.

## Prohibited patterns

- Do not create another global `reset`, `recovery`, `current`, `v2`, `final`, `fix`, or `override` stylesheet to win the cascade.
- Do not restore the deleted Figma Current/Living Canvas presentation generations.
- Do not use `!important` to compensate for an incorrect owner. Fix or delete the competing declaration first.
- Do not generate visible product copy with CSS pseudo-elements when semantic HTML/JavaScript can own it.
- Do not hide a canonical control in one global layer and reveal it in a later layer.
- Do not copy module styling into a global sheet merely to make two screens look similar; extract a shared primitive only when the semantics are genuinely shared.

## `!important` policy

`!important` is exceptional. It is acceptable for narrowly-scoped accessibility/reduced-motion invariants, modal/state isolation where third-party or historical declarations cannot safely win, and temporary compatibility rules with an explicit removal path. New shell and module styling should normally require none.

If a change appears to require several new `!important` declarations, treat that as evidence of incorrect ownership or dead CSS and investigate the cascade first.

## Change procedure

For presentation work:

1. Identify the semantic owner: design system, shell, one module, product composition, motion, or accessibility.
2. Remove obsolete/conflicting rules before adding replacements.
3. Keep mobile and desktop behavior explicit at the owning layer.
4. Preserve 44px minimum interactive targets, visible focus, safe-area handling and reduced-motion behavior.
5. Run unit/contract/modularity tests, real Worker+D1 integration, Chromium and WebKit desktop acceptance, and Chromium and WebKit 375px acceptance.
6. Deploy only the exact Quality-tested Preview commit through the guarded Preview workflow.

## Regression contract

`tests/presentation-architecture.test.js` protects the current boundaries. It rejects the deleted presentation generations, requires the canonical load order, limits runtime stylesheet growth, ensures the shell owns desktop Explore geometry, and prevents shell specificity from escalating.

When that test blocks a change, do not loosen it merely to land another override layer. Change the presentation structure unless the architecture itself has been deliberately revised and documented.
