# Engineering audit — Phase 7: Frontend quality and accessibility

Status: **COMPLETE — SHARED FRAMEWORK HARDENED; HUMAN/BROWSER CONCERNS RECORDED**

Audit context: Growth Compass — Version 1 Beta, responsive native HTML/CSS/JavaScript application with a shared cross-app experience framework.

## Overall assessment

The frontend has a stronger accessibility foundation than a typical early Beta: native controls are used heavily, the application has a canonical design-token layer, a final cross-cutting accessibility stylesheet, visible keyboard focus, reduced-motion support, 44px house touch targets for major controls, semantic navigation state, a shared modal controller with focus trapping/background isolation/focus return, explicit non-color equivalents for threshold graphics, and module-owned presentation rather than one central business UI.

This phase found several **framework-level** issues rather than isolated page bugs. The muted-text token and one Wellness tone did not meet the project's normal-text contrast requirement on their intended backgrounds; the SPA had no keyboard bypass link; inactive views were hidden only by CSS rather than semantic state; loading state and document titles were not expressed across view transitions; and two error messages inserted runtime text into HTML without escaping it.

Those shared issues are now fixed and protected by release-blocking tests. The main remaining gap is evidence: source/contract tests cannot prove actual browser keyboard, screen-reader, zoom/reflow and custom-widget behavior. A real browser E2E/accessibility layer remains required before public release.

The user's previously observed visual problem — duplicated/heavy upper-page hierarchy, especially on mobile — is real and should be solved in the **shared experience framework**, not by redesigning Wellness Boost independently.

---

## F1 — Canonical muted text was below normal-text contrast on common surfaces

**Status:** PASS after remediation  
**Severity before remediation:** HIGH accessibility issue

Observed issue:

The canonical muted token was `#6c7c84`. Its contrast was below the 4.5:1 normal-text threshold on both the white surface and the pale application background used throughout Growth Compass.

Because `--gc-text-muted` is aliased into the legacy/current token systems, this was a cross-app concern affecting many modules at once.

Remediation:

- canonical `--gc-text-muted` changed to `#5f7078`;
- compatibility aliases continue to inherit the canonical value;
- release-blocking tests now calculate relative luminance/contrast instead of merely checking that a token exists;
- tests require the muted token to maintain at least 4.5:1 against both `--gc-surface` and `--gc-bg`.

This is the correct framework-level fix: individual modules should not locally choose darker one-off grays.

## F2 — Shared category-tone text had one contrast exception

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

The shared Reset, Calm and Focus tone pairs met the normal-text threshold, but the Restore tone ink was slightly too light on its warm background.

Remediation:

- `--gc-tone-restore-ink` is now `#786149`;
- tests calculate the contrast of Reset, Calm, Focus and Restore tone inks against their own backgrounds and require at least 4.5:1.

This preserves the quiet category palette while keeping category text readable.

## F3 — Repeated SPA navigation had no explicit keyboard bypass mechanism

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

Growth Compass has repeated desktop/mobile navigation and top-bar controls. Keyboard users previously had no explicit way to bypass those controls and jump to the current workspace.

Remediation:

- the first focusable body element is now `Skip to main content`;
- it targets the shared `#mainContent` workspace;
- the target is programmatically focusable with `tabindex=-1` without entering the normal tab sequence;
- the skip control is visually hidden until focused and uses canonical focus/touch/surface tokens;
- the rule lives in the final accessibility layer so every first-class view receives the same behavior.

## F4 — Inactive SPA views relied only on CSS presentation

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

Previously, view switching toggled only the `.active` CSS class. Although `display:none` removed inactive content visually, semantic state depended on CSS remaining correct.

Remediation:

- inactive view sections now start with the HTML `hidden` attribute;
- `showView()` updates both `.active` and `view.hidden` for every transition;
- only the active view remains exposed/rendered as active application content;
- static tests protect the initial and runtime contract.

## F5 — SPA loading/title state was incomplete

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

The top `h1` changed on navigation, but the browser/document title stayed `Growth Compass`, and asynchronous view rendering had no shared semantic busy state.

Remediation:

- every view render sets `aria-busy=true` on the active view root and removes it in `finally`;
- every navigation sets `document.title` to `<View> — Growth Compass`;
- the initial HTML title is `Today — Growth Compass`.

This provides a shared state contract without forcing focus to jump after every pointer/touch navigation.

## F6 — Runtime error strings were inserted into HTML without escaping in two composition paths

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM security/accessibility robustness issue

`public/js/app.js` inserted `error.message` into Today Daily Plan fallback HTML and Journal fallback HTML. Current API errors are controlled, but runtime error strings should never be treated as markup by a composition surface.

Remediation:

Both paths now pass the chosen message through the platform `escapeHtml()` helper before insertion.

The individual business modules remain responsible for their own presentation; this fix belongs in the app composition layer because the fallback markup is composed there.

## F7 — Modal foundation is strong

**Status:** PASS

`public/js/platform/modal.js` centrally provides:

- dialog discovery and `aria-modal`;
- programmatic focusability;
- initial focus selection;
- keyboard Tab/Shift+Tab containment;
- Escape close;
- background isolation with `inert`;
- focus restoration to the invoking control;
- nested modal-count body state.

Logger, install help and reviewed recovery/modal flows consume this platform primitive instead of implementing independent focus traps.

Keep modal mechanics in platform; modules should provide their owned content/actions only.

## F8 — Focus, motion, forced-colors and touch foundations are strong

**Status:** PASS for source contracts; browser validation still required

The canonical design system includes:

- visible `:focus-visible` treatment;
- a 44px Growth Compass major-control target primitive;
- reduced-motion overrides for animation/transition duration;
- forced-colors focus/graphic behavior;
- responsive overflow/reflow safeguards at 375px and below.

The navigation shell, Logger, module sheets and frequent controls have additional regression tests for phone-first target sizing.

This source evidence is strong but does not replace real browser keyboard/zoom/touch testing.

## F9 — Data visualizations expose equivalent text/state

**Status:** PASS

Reviewed threshold/Insight/Wellbeing presentation does not rely on color alone:

- threshold graphics include equivalent Actual / Minimum / Target summaries;
- visual chart elements are secondary/hidden from accessibility APIs where equivalent text exists;
- Insight readiness exposes stage/current-step and observation counts semantically;
- Wellbeing Energy buttons use visible labels plus `aria-pressed` selected state.

Retain this rule for future charts: every meaningful visual value must have an equivalent textual/semantic representation.

## F10 — Logger activity suggestions advertise an autocomplete pattern without a complete combobox/listbox model

**Status:** CONCERN  
**Severity:** MEDIUM  
**Release impact:** resolve before public accessibility acceptance

The Logger activity text input currently declares `aria-autocomplete=list` and controls suggestion/create regions, while the suggestions themselves are normal focusable buttons rather than a formal `listbox`/`option` composite with arrow-key/active-descendant behavior.

This is not automatically unusable — keyboard users can Tab to the suggestion buttons — but the semantic promise is stronger than the implemented interaction model.

Do not add ARIA roles merely to satisfy a source scanner. Resolve this with browser keyboard/screen-reader testing and choose one coherent design:

1. **simple input + ordinary suggestion buttons/group**, removing autocomplete semantics; or
2. a complete combobox/listbox keyboard and announcement pattern.

For Growth Compass's easy/default UX, the simpler button-suggestion model is likely preferable unless browser testing demonstrates a strong reason for a full combobox.

## F11 — Toast status channel does not distinguish informational success from urgent errors

**Status:** CONCERN  
**Severity:** LOW current Beta; MEDIUM for broader/public use

The global toast uses `role=status` with polite live announcement for all messages. This is appropriate for routine confirmations such as saved/updated state, but the same channel is also used for some actionable failures.

Before broader accessibility acceptance, define a small platform status contract rather than having modules invent live-region behavior:

- normal success/info → polite status;
- blocking validation should preferably be associated with the relevant field/control;
- unexpected actionable errors may need a more immediate accessible error surface.

Avoid turning every failure into an aggressive `alert`; urgency should match user impact.

## F12 — Shared experience framework is real, but top-of-page hierarchy still needs human refinement

**Status:** CONCERN / PRODUCT EXPERIENCE ACCEPTANCE  
**Severity:** MEDIUM

Positive architectural evidence:

- `experience-framework.css` is a real shared cross-app layer;
- it owns reading width, page rhythm, header hierarchy, stat surfaces, featured-choice surfaces and restrained category tones;
- it loads after module-owned business presentation and before final accessibility safeguards;
- Today, Plan, Progress, Insights, Journal and Wellness Boost opt into common header/presentation rules;
- tests prevent regression back to unrelated page-specific hero systems.

Remaining UX issue:

The persistent shell already identifies the current first-class destination, while some module pages immediately add another eyebrow/title/lede hierarchy. On smaller screens this can make the upper viewport feel text-heavy and repetitive. The Wellness Boost screenshots exposed the issue clearly, but it is a **framework hierarchy problem**, not a Wellness-specific bug.

Required next UX design rule:

Choose one cross-app contract for the relationship between:

- shell destination title;
- module/page eyebrow;
- page title/lede;
- first featured action/content.

The goal should be a quieter first viewport with one dominant heading and earlier access to the useful content/action. Apply that rule across first-class views, not page-by-page.

Do not implement a large visual change during the engineering audit without human preview acceptance.

## F13 — Real browser/accessibility E2E coverage is missing

**Status:** CONCERN  
**Severity:** HIGH  
**Release impact:** public-launch blocker

Current tests are excellent at source contracts, pure logic and selected Worker runtime behavior, but they cannot prove:

- actual tab/focus order;
- skip-link behavior in Chromium/WebKit;
- modal focus trapping with a browser DOM;
- 200%/400% zoom and reflow;
- screen-reader naming/announcement behavior;
- mobile virtual keyboard behavior;
- Logger suggestion semantics;
- CSP compatibility of all browser-only features;
- Meditation speech/audio behavior across browsers;
- rendered color contrast after all cascade/state combinations;
- touch interactions on real/automated mobile viewports.

This reinforces Phase 3's browser-E2E finding. Before public release, add a small high-value browser suite using a Workers-compatible test environment rather than trying to encode every behavior as regex/source assertions.

## F14 — Empty/error/loading states are not yet governed by one complete platform presentation contract

**Status:** CONCERN  
**Severity:** MEDIUM

The application has calm empty states and many good module-owned fallback messages, but implementation remains mixed across `.empty`, module-specific placeholders, toast messages and composed fallback sections.

Do not centralize business wording. Instead define shared **presentation primitives/states** for:

- loading;
- empty/no-data;
- unavailable/degraded module;
- inline validation;
- retryable server/network failure.

Business modules should continue to own the actual user-facing meaning/copy.

## Verification checkpoint

After the framework-level accessibility remediations:

- feature SHA: `dbffdd4ad06ab4b07400690cbfe38208af27de32`
- Quality run #320
- **273 / 273 passing**
- exact tested feature head confirmed by the Quality checkout log.

Documentation commits after this checkpoint must also pass the full Quality gate before Phase 7 is frozen.

## Phase 7 decision

**Frontend/accessibility direction: continue.** There is no reason to replace native HTML/CSS/JS or introduce a frontend framework for accessibility.

The correct path is to keep strengthening the existing shared platform/design/experience layers while business presentation remains module-owned.

Before public release:

- add real browser accessibility/E2E validation (F13);
- resolve Logger suggestion semantics based on browser evidence (F10);
- improve the shared status/error-state contract (F11/F14);
- perform framework-level human UX refinement of the duplicated top-of-page hierarchy (F12), applying the accepted rule across the app rather than page-by-page.

Production Worker code and production D1 were not changed by this phase.
