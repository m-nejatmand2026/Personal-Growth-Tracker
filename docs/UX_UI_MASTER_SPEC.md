# Growth Compass — UX/UI Master Specification

Status: **Normative design-direction contract for Revision C and subsequent UX work.**
Date: 15 August 2026.
Scope: private Beta UX/UI only. **No Production deployment or Production D1 change is authorized by this document.**

This specification consolidates the current Growth Compass product conversation, the exact-head Revision C visual evidence, current market/product research, platform guidance, accessibility standards, and behavioral evidence. It complements `MODULARITY_STANDARD.md` and `ARCHITECTURE.md`; if this document conflicts with either on ownership, contracts, persistence, security, or module boundaries, those architecture documents win.

## 1. Executive direction

Growth Compass should become a **calm, tap-first personal operating system**: sophisticated underneath, obvious on the surface.

The redesign is not a feature program. It is a presentation and interaction program with four hard constraints:

1. **No new product capability is required to make the experience excellent.**
2. **The current modular engineering foundation stays intact.**
3. **Common actions become dramatically easier before advanced power is expanded.**
4. **Human usability evidence, not green CI alone, decides whether the design is good.**

The north-star rule is:

> Show the thing. Let the person act on the thing. Explain only when the explanation is needed.

The target is not to visually imitate Apple, Microsoft, Todoist, Structured, Daylio, Bearable, Finch, or any other product. The target is to learn from the strongest interaction principles across those products while preserving Growth Compass's own purpose: connect life direction, realistic capacity, daily intention, factual progress, reflection, wellbeing, and evidence-backed insight without turning self-improvement into pressure.

---

## 2. Evidence vs. design judgment

Every major recommendation in this document is classified as one of:

- **Evidence** — supported by current platform standards, market behavior, research, or verified Growth Compass runtime evidence.
- **Design judgment** — a deliberate Growth Compass choice made from that evidence. It is testable and may be revised by usability evidence.
- **Hard product/engineering constraint** — already established by Growth Compass architecture/domain contracts and not open to visual redesign without a separate product decision.

Do not present a design judgment as scientific fact.

---

## 3. Market and competitor landscape

### 3.1 Structured

**Evidence.** Structured opens directly on a daily timeline, combines tasks/to-dos into one visual day, and emphasizes creating tasks in seconds across phone/computer/watch. Its help documentation describes the daily timeline as the first screen. [E1][E2]

**Design judgment for Growth Compass.**
- The daily surface must prioritize the day itself, not explanation of the product.
- Time and plan state should be concrete and glanceable.
- Growth Compass should not copy Structured's timeline unless the underlying Daily Plan data genuinely supports a useful timeline; visual chronology must not fabricate schedule precision.

### 3.2 Todoist

**Evidence.** Todoist's Today view concentrates scheduled work for the day, its 2026 Quick Add redesign explicitly keeps secondary detail out of the way until needed, and its mobile navigation can be configured around frequently used views. [E3][E4][E5]

**Design judgment.**
- Logger should be Growth Compass's strongest "capture at thought speed" interaction.
- Primary mobile navigation should remain deliberately small.
- Secondary views belong behind an obvious More/Browse surface, not in a crowded first-level bar.
- Detail should appear on demand rather than as permanent form chrome.

### 3.3 Daylio

**Evidence.** Daylio's core proposition is a two-tap mood/activity entry with writing optional; it then builds statistics, charts, correlations, themes and dark mode from those logs. [E6][E7]

**Design judgment.**
- Wellbeing check-ins must be possible in seconds.
- Journal writing remains optional; it must not be a tax required to create useful data.
- Rich analysis is earned after low-friction capture, not shown as an empty analytical dashboard before data exists.

### 3.4 Bearable

**Evidence.** Bearable emphasizes a few-tap customizable tracking flow and correlation reports. Its correlation guidance requires enough days with and without a factor and recommends longer tracking for less noisy results. [E8][E9]

**Design judgment.**
- Insights must preserve visible evidence thresholds and uncertainty.
- Growth Compass should keep Bearable's analytical seriousness but avoid reproducing its potential category/configuration burden on the everyday path.

### 3.5 Finch

**Evidence.** Finch deliberately frames self-care as small, approachable daily steps, provides starter goals, and puts deeper goal options behind "more options." It also uses strong gamified reward mechanics. [E10][E11]

**Design judgment.**
- Borrow the gentle onboarding and progressive disclosure.
- Do **not** make Growth Compass dependent on pets, currencies, streak loss, confetti, or variable-reward loops.
- Motivation should primarily reinforce the person's chosen life direction, not attachment to the app.

### 3.6 Microsoft To Do / Planner

**Evidence.** Microsoft's My Day is explicitly described as a clutter-free daily focus space. It resets as a daily surface while unfinished tasks remain in their source lists and may be suggested again rather than becoming failure debt. [E12][E13]

**Design judgment.**
- Today should feel finite and resettable.
- Unfinished intentions must remain recoverable without shame.
- "Keep / move / reduce / complete / drop" is stronger than silent rollover debt.

### 3.7 Apple Health and Journal

**Evidence.** Apple Health uses summary/highlight/trend surfaces that lead to deeper detail. Apple Journal lets people begin writing directly or use optional prompts, provides search/history, privacy controls, and separate insights. [E14][E15][E16]

**Design judgment.**
- Summary first, detail second.
- Journal's default action is writing; prompts and metadata are support, not the main event.
- Progress and Insights should reveal deeper charts only when they answer a question, not because charts look sophisticated.

### 3.8 Competitive position

Growth Compass should not try to beat competitors by putting **more** on one screen. Its differentiator is the relationship among:
`direction -> capacity -> daily intention -> factual progress -> reflection -> wellbeing -> evidence`.

The UX advantage comes from hiding that complexity until it is useful.

---

## 4. User-behavior findings

### 4.1 Repeated self-report must stay lightweight

**Evidence.** Mobile ecological momentary assessment research shows that repeated self-report can sustain useful compliance, but real-world compliance is imperfect and repeated prompts/items create burden tradeoffs. Large reviews report average compliance roughly in the 70–80% range across heterogeneous protocols. [E17][E18]

**Design judgment.**
- A normal check-in should ask only what is needed for that moment.
- No screen should ask the user to "complete the database."
- Defaults, recent values, quick repeats and optional detail are first-class design tools.

### 4.2 Gamification is not automatically ethical or effective

**Evidence.** Systematic reviews show gamification can support behavior change in some contexts, but effects depend on design and population; motivation research warns that engagement with the intervention can displace internalization of the underlying goal. [E19][E20]

**Design judgment.**
- No punishment for missed days.
- No artificially scarce rewards.
- No red failure state for ordinary human plan change.
- Celebrations are brief, dismissible, non-blocking and never required to proceed.

### 4.3 Complexity reduction is accessibility

**Evidence.** Apple's accessibility guidance explicitly notes that minimizing complexity benefits everyone, recommends simple and familiar actions, and calls for streamlined core workflows in Assistive Access. W3C similarly emphasizes predictable interfaces, clear language, keyboard access, reflow, and error recovery. [E21][E22]

**Design judgment.**
- Cognitive load is an accessibility metric, not merely a visual preference.
- Every first-class screen gets a defined primary question and primary action.

---

## 5. Current Growth Compass UI — scored critique

Source of current-state evidence: exact validated Revision C head `38bb96e0c84f94d02b437ef1b28c3617671fda70`, Quality #378, and the corresponding Chromium/WebKit visual evidence artifact. The branch remains draft/private Beta and Production is untouched. [G1]

### 5.1 Overall score: **74 / 100**

This is a meaningful improvement over the pre-Revision-C interface, but it is not yet a 9/10 product. The score is based on visible runtime evidence and current automated coverage, not on architecture quality.

| Area | Score | Current judgment |
|---|---:|---|
| Everyday ease of use | 77 | Common flows are clearer, but Plan still asks the user to think structurally. |
| Text/cognitive load | 79 | Major copy reduction succeeded; several surfaces still read like dashboard sections rather than immediate actions. |
| Information hierarchy | 76 | Titles and primary actions are clearer; multiple equal-weight cards still dilute priority. |
| Navigation | 85 | Five-item mobile bottom nav + central Add is strong; More is clearer than the prior crowded top actions. |
| Today | 76 | Understandable, but still card-led and somewhat "status dashboard" rather than a compelling daily command surface. |
| Logger | 88 | Strongest screen: direct mode choice, activity, duration, optional detail, clear save. |
| Plan | 67 | Biggest remaining weakness. Summary + tabs + expandable Goals still feels administrative and concept-heavy. |
| Progress | 79 | Compact and factual; underuses visualization and momentum/context. |
| Insights | 77 | Evidence honesty is strong; visually sparse/clinical when data is absent. |
| Wellness | 84 | Closest to tap-first content browsing; still visually generic. |
| Journal | 82 | Writing-first editor is correct; browse/search state can be more elegant and less form-like. |
| Visual polish / distinctiveness | 68 | Competent but generic rounded-card language; not yet premium or unmistakably Growth Compass. |
| Mobile responsive execution | 86 | 375px Chromium/WebKit evidence is solid. |
| Large-screen / desktop use | 61 | Excess empty space and phone-like narrow content on wide windows; desktop does not yet exploit space productively. |
| Accessibility implementation | 86 | Strong automated foundation, 44px targets and focus work; manual AT and large-text acceptance remain incomplete. |
| Data visualization | 59 | Too many values are text tiles; meaningful trend/actual-vs-plan graphics are limited. |
| Appearance / themes | 56 | Calm light palette exists; dark mode and robust appearance system are not yet a proven product-level capability. |
| Localization readiness | 67 | Human-language direction is good; full RTL/text-expansion/date-number acceptance is not yet proven. |
| Perceived performance / state feedback | 74 | Runtime gates are strong; UX specification for stale/offline/loading transitions is incomplete. |
| Design-system consistency | 80 | Shared framework exists and respects modules; component/state/token coverage needs to become more systematic. |

### 5.2 What is already good and should be protected

- Logger's simple-first structure.
- Five-position mobile navigation and central Add.
- Journal writing-first modal.
- Wellness featured-item + compact alternatives.
- Evidence-gated Insights semantics.
- Factual, non-shaming Progress and Capacity language.
- Shared presentation framework rather than module-specific visual reinvention.
- 44px-class mobile interaction targets.
- No cross-module business logic in the shell/design system.

### 5.3 Primary visible problems

1. **Plan still exposes product architecture.** Goals/Capacity/Schedule/Compass are legitimate concepts, but the current surface makes the user manage them like application sections.
2. **Card inflation.** Rounded bordered containers are used so often that hierarchy becomes flat.
3. **Desktop is an enlarged phone.** Large white/empty regions signal unfinished adaptation and reduce perceived quality.
4. **Data is under-visualized.** Numeric summary tiles dominate where small trends, ranges or progress bars would answer questions faster.
5. **Brand expression is weak.** Teal + rounded cards is clean, but not distinctive.
6. **Empty states are correct but not delightful.** They explain absence but do not always provide the best next action with enough visual emphasis.
7. **Appearance depth is incomplete.** Light-only evidence cannot support a premium cross-platform claim.
8. **Test breadth is narrower than product ambition.** Current automated visual evidence is desktop plus 375px mobile, not the full responsive matrix.

---

## 6. Definition of 9/10 and aspirational 10/10

"9/10" and "10/10" are release-quality targets, not adjectives.

### 6.1 9/10 acceptance target

A redesign may be called 9/10 only when all of the following are true:

- >=95% unassisted task completion across the eight primary Beta tasks in representative usability testing.
- >=90% first-attempt success for first-time users on: add/log activity, add to Today, find Plan goal, view Progress, write Journal entry.
- Median common Logger completion <=8 seconds when the Activity exists; repeat action <=4 seconds when a Quick Repeat exists.
- Median "What matters today?" comprehension <=5 seconds.
- Median navigation-to-destination <=2 deliberate actions from any primary view.
- System Usability Scale (SUS) >=85 or an equivalently strong validated usability benchmark.
- Single Ease Question (SEQ) median >=6/7 on the core tasks.
- No critical usability issue occurs in >5% of participants.
- WCAG 2.2 AA conformance for the web/PWA UI, including keyboard operation, 200% text resize, reflow at 320 CSS px equivalent, focus visibility, contrast and target sizing. [E23][E24]
- No clipping or loss of primary functionality at 320–1440 CSS px test widths or at 200% browser zoom.
- Manual VoiceOver iOS, TalkBack Android, NVDA/JAWS-or-Narrator Windows, and VoiceOver macOS smoke acceptance for primary tasks.
- p75 INP <=200ms and p75 LCP <=2.5s for real-user web/PWA traffic when measurement becomes available; FCP target <=1.8s. [E25][E26]
- Light and dark modes have equivalent hierarchy, contrast, component states and chart meaning.
- No Production regression and all modularity/contract/runtime gates remain green.

### 6.2 Aspirational 10/10 target

A 10/10 claim requires stronger evidence:

- >=98% unassisted core-task completion.
- >=95% first-attempt success without tutorial dependence.
- Today orientation <=3 seconds for median participant.
- Quick Repeat <=2 taps and <=3 seconds.
- SUS >=92 and SEQ median >=6.5/7.
- No recurring critical/major issue across two consecutive external usability rounds.
- Top-quartile preference against a blinded reference set of strong tracker/planner interfaces for clarity, visual confidence and perceived quality.
- Full cross-input equivalence: touch, mouse, trackpad and keyboard can all complete every primary task without a second-class path.
- Accessibility acceptance includes large text, RTL, reduced motion, high contrast/forced colors, screen readers and 400% zoom/reflow scenarios where applicable.
- Performance feels immediate even under moderate mobile network/CPU constraints; optimistic UI is used only where consistency is safe.
- Real-device validation covers small/large iPhones, representative Android compact/large phones, iPad/tablet portrait and landscape, Windows laptop/desktop, MacBook/macOS, and installed PWA behavior.

10/10 does **not** mean maximal animation, maximal density, or maximal feature count.

---

## 7. Core design principles

1. **Action before explanation.**
2. **One dominant question per screen.**
3. **One dominant primary action per state.**
4. **Progressive disclosure, never progressive confusion.**
5. **Factual language over motivational judgment.**
6. **Visual hierarchy through spacing/scale, not boxes everywhere.**
7. **Data visualization only when it shortens understanding.**
8. **The user may change the plan without being labeled a failure.**
9. **Touch-first does not mean keyboard-second.**
10. **Responsive design follows available content space, not device model names.**
11. **The design system owns primitives; modules own business presentation.**
12. **Accessibility settings are inputs to the design, not exceptions after it.**

### Anti-patterns

- Paragraphs before the first useful action.
- Multiple cards with equal weight on the first viewport.
- A card containing another card containing an input.
- Labels that expose implementation vocabulary.
- Hidden destructive actions without confirmation.
- Color-only state.
- Forced horizontal carousels for core content.
- Drag-only interaction.
- Tooltip-dependent essential information on touch.
- Auto-advancing content, countdown urgency, streak-loss pressure.
- Desktop layouts that simply center a phone-width column in a large window.
- A global "design module" that starts owning Goals/Progress/Journal business logic.

---

## 8. Responsive and cross-platform strategy

### 8.1 Content-driven breakpoints

Breakpoints are initial layout constraints, not device detection:

| Available content width | Layout mode | Default behavior |
|---|---|---|
| `< 360px` | Compact-tight | Single pane; 12–16px gutters; no side-by-side metrics that cannot hold 2 text lines; full-width sheets. |
| `360–599px` | Compact | Single pane; bottom navigation; 16px gutters; 2-column micro-metrics only when each cell remains >=144px. |
| `600–839px` | Medium | Single primary pane + optional contextual support; navigation may become rail when ergonomically better. |
| `840–1199px` | Expanded | Persistent rail/sidebar; list-detail or supporting pane when the content relationship benefits. |
| `1200–1599px` | Wide | Two-pane composition; readable primary column + contextual secondary pane; no uncontrolled stretching. |
| `>=1600px` | Extra-wide | Preserve max readable widths; third pane only when it has a real simultaneous task purpose. |

These thresholds align directionally with current adaptive-platform guidance, but the implementation should prefer container queries and minimum-component-width tests so a component changes layout when its content stops fitting. Android explicitly recommends window-size-based adaptation and different navigation on large screens; Apple likewise emphasizes resizable-window adaptation; Windows NavigationView adapts based on available width. [E27][E28][E29][E30]

### 8.2 Device mapping for test coverage

- Small iPhone / narrow mobile Safari: compact-tight.
- Large iPhone and mainstream Android portrait: compact.
- Foldables / tablet portrait / split windows: medium.
- iPad/tablet landscape and smaller desktop windows: expanded.
- MacBook/Windows laptop standard windows: wide.
- Large monitors / maximized desktop: extra-wide.

The code must never branch on "iPhone", "iPad", "Android tablet", "MacBook", etc.

### 8.3 Input adaptation

Input capability is independent from width:

- Touch: primary targets >=44px where practical; comfortable separation.
- Mouse/trackpad: visible hover where helpful, denser secondary actions allowed, precision affordances available.
- Keyboard: logical tab order, skip link, Escape closes transient UI, Enter/Space semantics correct, standard shortcuts respected.
- Do not restrict concurrent input methods. [E31][E32]

### 8.4 Large-screen model

Large screens should not merely make cards wider.

Preferred patterns:
- Plan: goals/list on left, selected goal or supporting capacity detail on right when width allows.
- Journal: entry list/search on left, selected entry/editor on right.
- Progress: summary/history primary pane, goal detail/chart support pane.
- Insights: findings primary pane, methodology/evidence detail support pane only when requested.
- Settings: category list + detail.

---

## 9. Information architecture and navigation

### 9.1 Mobile primary navigation

Keep:
`Today | Plan | Add | Progress | Wellness`

Secondary More:
`Insights | Journal | Settings`

Rationale: the bottom bar is reserved for frequent, distinct jobs. Todoist and adaptive platform guidance both favor prioritizing frequent destinations and moving infrequent actions to overflow/secondary navigation. [E4][E28]

### 9.2 Desktop/tablet navigation

Persistent rail/sidebar:
- Today
- Plan
- Progress
- Insights
- Wellness
- Journal
- persistent Add action
- Settings visually separated at the bottom

At expanded widths, navigation must not compete with content using a second redundant top action cluster.

### 9.3 Back and state preservation

- Back returns to the prior user context, not merely a default route.
- Selected Plan section/goal and Journal selection should survive layout changes.
- Resizing from two-pane to one-pane preserves the selected detail, consistent with canonical adaptive list-detail behavior. [E29]

---

## 10. Screen specifications

### 10.1 Today

**Primary question:** What matters now, and what realistically fits today?

First viewport order:
1. Today/date.
2. Add.
3. Today's intended items (or a single strong Add-to-Today empty action).
4. One compact "How today feels" check-in row.
5. Time reality: available / planned / flexible.

Below:
6. Progress direction.
7. Recent factual activity.
8. Journal entry point.

Rules:
- No explanatory paragraph at top.
- Do not use three large cards if one grouped status strip works.
- If no items exist, the empty state should visually prioritize `Add to Today`, not the absence message.
- Capacity is a reality statement, not a score.
- On wide layouts, daily items are the primary pane; wellbeing/time reality can form a supporting pane.
- Never fabricate "now/next" schedule precision from items that lack a real time.

### 10.2 Logger

**Primary question:** What do you want to record or plan?

Keep:
- `Plan | Start now | Done`.
- Activity search/create.
- Duration where relevant.
- Quick Repeat when real history exists.
- one primary button.
- More details disclosure.

Improve:
- Default focus goes to Activity.
- If duration is common for the selected Activity, recent values can be offered as shortcuts without silently changing the domain value.
- Empty Quick Repeat should not consume prominent vertical space; hide the section until there is something useful.
- Mobile uses a large bottom sheet/full-height sheet; desktop uses a focused modal with restrained width.
- Close/Escape restores focus to the invoker.

### 10.3 Plan

**Primary question:** What am I trying to do, and does it fit my life?

This is the highest-priority redesign.

Default view:
- "Your plan" summary in one compact sentence/visual block.
- Goals are the primary content.
- Each Goal row emphasizes name and plain-language progress method.
- Administrative actions live in a menu.
- Capacity and Schedule are secondary lenses, not equal-weight tabs unless testing proves tabs faster.
- Compass is an overview/reflection lens, not a permanent top-level cognitive requirement.

At expanded width:
- Goal list left.
- Selected Goal detail/support right.
- Capacity summary can persist as a small supporting element, not four equally weighted metric tiles.

Avoid:
- Four summary cards followed by four tabs followed by another card.
- Requiring the person to understand "Plan structure" before editing a goal.
- Repeated Area / measurement-type metadata unless it helps a current decision.

### 10.4 Progress

**Primary question:** What actually happened?

Default:
- short period selector if needed;
- one primary progress summary;
- recent factual history;
- "By goal" detail.

Visualization:
- actual vs target: bullet/progress bar with text equivalent;
- over-time activity: line or bars;
- categorical distribution: bars before pie/donut;
- never imply target when no legitimate target exists.

No streak pressure, no catch-up debt, no red failure for below-target ordinary variation.

### 10.5 Insights

**Primary question:** What patterns are supported by enough evidence?

States:
- learning: show tracked-day count and the one action that improves evidence (`Keep logging`), not a pseudo-dashboard of zeros;
- descriptive: show factual summaries;
- association-ready: show direction, magnitude where meaningful, sample size, time window and uncertainty;
- insufficient data: explain the missing evidence in one sentence.

Methodology lives behind `How insights work`.

Never:
- call correlation causation;
- infer from Journal text in Version 1 Beta;
- use confidence visuals without accessible textual meaning.

### 10.6 Wellness Boost

**Primary question:** What would help me reset/focus/restore right now?

Default:
- one featured practice;
- compact alternative rows;
- duration visible;
- purpose/category visible in one short phrase.

Player:
- large play/pause;
- elapsed/remaining time with accessible labels;
- stop/close;
- no auto-play;
- reduced-motion-compliant visual feedback.

Artwork/color can create emotional warmth, but must not make the screen noisy.

### 10.7 Journal

**Primary question:** What do I want to write or revisit?

Mobile:
- New entry is prominent.
- Entry editor is writing-first and can occupy most of the viewport.
- Prompt, metadata and privacy are disclosures.
- Browse view uses simple search + entries; filters do not dominate the empty state.

Wide:
- list/search left;
- selected entry or editor right.

Privacy:
- privacy explanation is accessible on demand;
- never use Journal content for Insights/AI without an explicit future contract and consent.

### 10.8 Settings

Settings should be boring, predictable, searchable when scope eventually warrants it, and separated from daily work.

Groups:
- General
- Appearance
- Notifications/reminders
- Modules/features
- Data & privacy
- Accessibility
- About/support

Do not put frequent task execution in Settings.

---

## 11. Onboarding, first run and empty states

### 11.1 Onboarding

Goal: reach useful action before configuration fatigue.

Recommended sequence:
1. One-screen value proposition: plan realistically, log what happened, learn over time.
2. Optional choose/create one Life Area and one Goal, with Skip.
3. Land on Today with a strong `Add` or `Add to Today` action.

Do not require:
- complete Life Area taxonomy;
- multiple goals;
- measurement tuning;
- capacity schedule;
- wellbeing setup;
- theme selection;
- notification permissions;
- tutorial carousel.

Permissions are requested in context when the user invokes a feature that needs them.

### 11.2 Empty-state formula

Every empty state answers:
1. What is empty?
2. Why might that be normal?
3. What is the best next action?

Maximum one short supporting sentence before the action.

Do not fill emptiness with decorative analytics containing zeros.

---

## 12. Charts and data visualization

Use charts to reduce interpretation time, not to create "dashboard credibility."

Preferred:
- line: change over time;
- bar: discrete periods/categories;
- bullet/progress bar: actual vs minimum/target;
- range/band: capacity or confidence interval where legitimate;
- small multiples: comparable trends when there are few series.

Avoid by default:
- pie/donut for precise comparisons;
- radar charts;
- gauge/speedometer metaphors;
- 3D;
- dual-axis charts;
- unexplained smoothing;
- red/green-only semantics.

Every chart must have:
- accessible title;
- textual summary;
- units;
- time range;
- data/sample count when relevant;
- keyboard/screen-reader access to meaningful points or a data-table alternative;
- hit targets larger than visual marks for touch/pointer exploration. Apple specifically recommends expanding chart interaction regions when marks are too small. [E33]

---

## 13. Visual system

### 13.1 Typography

Use the platform/system font stack by default to maximize native legibility:
`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

Baseline:
- body: 16–17px equivalent, 1.4–1.55 line height;
- compact secondary text: never below 12px CSS equivalent;
- page title: ~28–32px compact, ~32–36px wide;
- section heading: 18–22px;
- numeric metric: use tabular figures where supported.

Support 200% text resize without loss and allow layout expansion rather than truncating meaningful content. Apple explicitly recommends Dynamic Type/large-text adaptation; WCAG requires 200% resize and 320px-equivalent reflow. [E21][E23][E24]

### 13.2 Iconography

- One coherent icon family.
- Navigation uses icon + text label.
- Do not use icon-only actions for unfamiliar or destructive concepts.
- Optical stroke/weight should match text hierarchy.
- Directional icons mirror in RTL where meaning follows reading direction. [E34]

### 13.3 Spacing

Base rhythm:
`4, 8, 12, 16, 24, 32, 48`.

Rules:
- 16px minimum page gutter in standard compact layouts; 12px only in compact-tight exceptions.
- 24px between unrelated sections.
- Prefer whitespace before adding a separator/card.
- Dense desktop rows may use 8–12px internal vertical spacing when pointer/keyboard access remains clear.

### 13.4 Shape and surfaces

- Radius is semantic: smaller for controls/rows, medium for cards, large for sheets.
- Stop using pills for every container.
- A surface should exist because it groups interaction/content, not because the design needs another rectangle.
- Borders are low-emphasis; elevation is sparse.

### 13.5 Color

- Growth Compass teal remains the primary brand/action color.
- Neutral surfaces dominate.
- Semantic success/warning/error colors are separate from brand accent.
- Never use color alone for state.
- Provide light, dark and increased-contrast-safe semantic tokens. Apple recommends semantic/adaptive colors and warns against hard-coded appearance colors. [E35][E36]

### 13.6 Motion

Motion purposes:
- confirm action;
- preserve spatial context;
- indicate state change.

Default durations:
- micro feedback ~120–180ms;
- sheet/modal transitions ~180–240ms;
- avoid slow decorative motion.

Reduced Motion:
- remove scale/bounce/parallax;
- use opacity/state change;
- no essential information exists only in animation. [E37]

---

## 14. Appearance and user-selectable themes

Appearance preference:
- System (default)
- Light
- Dark

Optional theme personalization may change:
- brand accent;
- decorative tone palette;
- non-semantic illustrations.

It must **not** change:
- success/warning/error meaning;
- contrast guarantees;
- chart distinguishability;
- focus visibility;
- disabled state clarity.

Apple recommends respecting system appearance and avoiding surprising app-specific overrides; therefore System remains the default even if Growth Compass offers an explicit override for cross-platform users. [E36]

---

## 15. Accessibility contract

Target: WCAG 2.2 AA minimum for web/PWA, with selected AAA practices where practical.

Required:
- semantic landmarks/headings;
- correct names/roles/states;
- screen-reader announcements for status changes;
- keyboard-only completion of all tasks;
- no keyboard trap;
- skip link;
- visible focus;
- touch targets generally >=44px for frequent mobile controls; never below WCAG minimum without a valid spacing/equivalent exception;
- text contrast >=4.5:1 for normal text and 3:1 for large text;
- UI/non-text contrast >=3:1 where required;
- 200% text resizing;
- reflow at 320 CSS px equivalent without two-dimensional scrolling except true 2D content;
- browser zoom through 400% acceptance where applicable;
- `prefers-reduced-motion`;
- high contrast / forced-colors verification;
- no drag-only function;
- no hover-only essential function;
- accessible error messages linked to fields;
- logical focus restoration after dialogs/sheets;
- accessible chart summary/data alternative.

Manual matrix:
- iOS Safari + VoiceOver + Larger Text;
- Android Chrome + TalkBack + font/display scaling;
- Windows Edge/Chrome + NVDA plus Narrator smoke;
- macOS Safari + VoiceOver;
- keyboard-only desktop;
- 200% and 400% browser zoom.

W3C and Apple guidance directly support these requirements. [E21][E22][E23][E24]

---

## 16. Localization and RTL

Architecture requirements:
- all visible strings externalizable;
- no concatenated English sentence fragments for user-facing grammar;
- locale-aware dates, times, numbers and units;
- allow 30–50% text expansion in layout tests;
- support plural rules;
- use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`, etc.);
- mirror directional navigation/motion icons in RTL;
- do not mirror universal/non-directional symbols;
- charts preserve chronological meaning appropriate to locale.

Initial acceptance locales should include:
- English;
- German for expansion/compound-word stress;
- Persian or Arabic for RTL stress.

This does not commit to a public localization launch; it makes the design robust enough not to block it later. Apple explicitly expects locale-driven text length, formatting and RTL adaptation. [E34][E38]

---

## 17. Loading, error, empty and offline states

### Loading

- Render shell/navigation immediately.
- Prefer skeletons only when the content shape is known; use a compact progress indicator for indeterminate action work.
- Never skeleton an empty state indefinitely.
- Preserve layout to avoid jumps.

### Success

- Inline/local confirmation where possible.
- Toast/status message for cross-view confirmation.
- Avoid blocking celebratory modal.

### Error

Error copy:
- what failed;
- whether data was saved;
- what the person can do next.

Never show raw API/SQL errors.

### Offline

At minimum, installed/web app must remain in control and render a deliberate offline state instead of a browser dead-end. Web platform guidance explicitly recommends an app-owned offline fallback. [E39]

If offline writes are not safely supported:
- do not fake success;
- keep the local form state;
- explain that saving needs a connection;
- offer Retry.

If future safe queuing is implemented:
- show `Saved on this device — syncing`;
- expose conflict/error status;
- never silently overwrite newer data.

---

## 18. Ethical motivation and retention

Growth Compass retention should come from usefulness, not compulsion.

Allowed:
- gentle acknowledgement;
- progress summaries;
- reminders the user explicitly controls;
- highlighting recovery after changed plans;
- meaningful reflection on chosen goals.

Avoid:
- streak loss as punishment;
- guilt copy;
- "you failed";
- forced catch-up debt;
- arbitrary coins/currencies;
- loot-box/variable reward patterns;
- false urgency;
- escalating notification pressure;
- hiding opt-outs.

The app's success metric is whether the person makes better decisions and understands their own patterns, not raw session count.

---

## 19. Performance perception

Perceived speed is a design requirement.

Targets:
- p75 INP <=200ms. [E25]
- p75 LCP <=2.5s. [E26]
- FCP <=1.8s target. [E40]
- primary navigation responds visually within one frame where possible;
- disable double-submit immediately;
- preserve input while requests are in flight;
- use optimistic UI only for operations whose rollback semantics are safe;
- prefetch/cache static shell assets for installed PWA use;
- no heavy chart/animation library in the initial route unless actually visible.

Measure mobile and desktop separately.

---

## 20. Design-system architecture

The design system is a **platform presentation service**, not a business module.

### 20.1 Token layers

1. Primitive tokens: spacing, type scale, raw palette, radius, motion.
2. Semantic tokens: surface, text, border, action, focus, success, warning, danger.
3. Component tokens: button height, field padding, card radius.
4. Theme mappings: light/dark/accent variants.

Business modules may consume semantic/component tokens; they do not define global palette meanings.

### 20.2 Core component contracts

Required shared primitives:
- Button / IconButton
- Link
- TextField / TextArea / Select
- SegmentedControl
- Checkbox / Radio / Switch
- Disclosure
- ListRow / ChoiceRow
- Metric
- ProgressBar / BulletBar
- Sheet / Dialog
- Popover / Menu
- Tabs where justified
- BottomNav / NavigationRail / Sidebar
- EmptyState
- InlineStatus / Toast
- Skeleton / Spinner
- SearchField
- Chart container + accessible summary
- FormField / validation message

Each component specification includes:
- default/hover/active/focus/disabled/loading/error states;
- touch and pointer sizes;
- keyboard behavior;
- screen-reader semantics;
- light/dark/high-contrast tokens;
- responsive behavior.

### 20.3 Module boundary rule

- Today/Plan may compose module contributions.
- Modules own business labels, business rows and domain-specific presentation.
- The design system never queries Goals, Progress, Journal, D1 or business APIs.
- A module must be removable without leaving orphan visual dependencies.

This is directly subordinate to `MODULARITY_STANDARD.md`. [G2]

---

## 21. Validation and usability-testing framework

### 21.1 Test tasks

Every major design round tests at least:
1. Add something to Today.
2. Log a completed Activity.
3. Plan an Activity for later.
4. Find and edit a Goal.
5. Explain available vs planned vs flexible time.
6. Find what Progress was recorded this week.
7. Understand whether an Insight is ready/credible.
8. Start a meditation.
9. Write and find a Journal entry.
10. Change an appearance setting.

### 21.2 Metrics

Collect:
- task success;
- first-attempt success;
- time on task;
- taps/clicks;
- backtracks;
- errors;
- SEQ;
- SUS at round end;
- comprehension check ("What do you think this means?");
- preference vs. current baseline.

### 21.3 Participant matrix

Before public release, include:
- experienced productivity-app users;
- low-frequency tracker users;
- people who self-identify as easily overwhelmed by complex apps;
- keyboard-heavy desktop users;
- at least one screen-reader user per major platform family where feasible;
- users testing large text/zoom;
- bilingual/RTL validation participants before localization release.

### 21.4 Design gate

No broad visual rollout because "the team likes it."

A change ships to the private Beta only when:
- architecture/unit/integration/browser gates pass;
- screenshots at required responsive states are reviewed;
- no known critical accessibility regression;
- user testing supports the intended improvement or the change is an explicitly bounded experiment.

---

## 22. Prioritized redesign roadmap

### P0 — Foundation and measurement

No feature work.

- Establish this master spec as normative.
- Consolidate semantic design tokens and component states.
- Add light/dark/high-contrast token architecture.
- Expand visual evidence widths: 320, 375/390, 430, 768, 1024, 1280, 1440+.
- Add text-scale/zoom screenshots where automation is practical.
- Define baseline usability tasks and measure current Revision C.

### P1 — Core loop: Today -> Logger -> Plan

Highest value.

**Today**
- reduce card inflation;
- make daily items/empty action visually dominant;
- compress wellbeing/time reality into calmer support surfaces;
- wide-screen supporting pane.

**Logger**
- hide empty Quick Repeat;
- tighten vertical rhythm;
- validate existing/new Activity flow with real users;
- preserve current semantics/contracts.

**Plan**
- replace dashboard/tab feel with goal-first hierarchy;
- list-detail on wide screens;
- capacity as supporting context;
- reduce repeated metadata.

### P2 — Evidence and reflection

**Progress**
- introduce accessible actual-vs-target and time-trend visuals.

**Insights**
- redesign learning/insufficient-data state around one clear evidence story.

**Journal**
- stronger list-detail desktop layout;
- cleaner entry browsing/empty state.

**Wellness**
- add visual warmth/art direction without adding content types/features.

### P3 — Cross-platform finish

- dark mode parity;
- optional accent themes;
- full tablet/desktop adaptive patterns;
- keyboard shortcuts only for existing frequent actions;
- RTL/text expansion hardening;
- offline/error/loading polish;
- PWA installed-mode acceptance.

### P4 — External quality validation

- 2 rounds of moderated/unmoderated usability testing;
- manual AT matrix;
- cross-platform device matrix;
- performance field metrics;
- close only evidence-backed defects;
- keep PR/private Beta until acceptance threshold is met.

---

## 23. Acceptance criteria by surface

### Today
- first useful action/content begins within the first viewport at all compact widths;
- no more than one sentence of explanatory copy before it;
- user can identify planned today + available/flexible time in <=5s median;
- empty state has one dominant next action.

### Logger
- existing Activity Done flow <=8s median;
- all common fields reachable without opening More details;
- all optional detail remains available;
- Escape/close preserves/returns focus correctly;
- no hidden save consequence.

### Plan
- Goal names are the dominant repeated visual element;
- administrative controls do not compete with Goal names;
- user can find a Goal and explain whether the plan fits available time without understanding internal architecture;
- expanded layout uses additional width for related detail, not blank space.

### Progress
- factual history is never confused with planned items;
- actual/target visual has a text equivalent;
- no target is displayed if none is legitimate;
- period changes do not mutate history.

### Insights
- tracked-day/sample evidence is visible;
- insufficient-data state does not resemble a failed dashboard;
- associations are labeled non-causal;
- methodology is available but not required reading.

### Wellness
- practice can be started in <=2 deliberate actions from the Wellness landing page;
- duration and purpose are visible before start;
- playback is keyboard/screen-reader operable;
- no auto-play.

### Journal
- new entry starts with writing focus;
- prompt/metadata/privacy are optional;
- empty browse state leads to New entry;
- wide layout supports list-detail without duplicating navigation.

### Settings
- appearance/privacy/module controls are predictable and grouped;
- changing appearance does not break contrast/semantic state;
- no business workflow is buried here.

---

## 24. Release-blocking UX criteria

Do not call the design "ready" when only screenshots look good.

Release blocking for the UX program:
- no regression in modularity, route, D1 or domain tests;
- responsive acceptance at the defined width matrix;
- no horizontal overflow;
- WCAG 2.2 AA automated + manual primary-flow acceptance;
- light/dark parity when dark mode is enabled;
- keyboard/touch/pointer parity;
- usability targets for the core loop;
- explicit human product acceptance;
- Production remains a separate deliberate release decision.

---

## 25. Source register

### Market/product evidence

- **[E1] Structured — Daily Planner** — https://structured.app/
- **[E2] Structured Getting Started (updated June 2026)** — https://help.structured.app/en/articles/380546
- **[E3] Todoist Today view (updated July 22, 2026)** — https://www.todoist.com/help/articles/plan-your-day-with-the-today-view-UVUXaiSs
- **[E4] Todoist mobile navigation customization** — https://www.todoist.com/help/articles/customize-the-todoist-navigation-bar-L4qpkI0xj
- **[E5] Todoist cleaner Quick Add (June 30, 2026)** — https://www.todoist.com/de/help/articles/a-cleaner-simpler-quick-add-june-29-PuIpiLmLh
- **[E6] Daylio product** — https://daylio.net/
- **[E7] Daylio activity/mood statistics** — https://daylio.net/faq/docs/daylio-faq/about/activity-and-mood-statistics/
- **[E8] Bearable product** — https://bearable.app/
- **[E9] Bearable correlation guidance** — https://bearable.app/support/howto/how-to-find-correlations/
- **[E10] Finch approach to self-care** — https://help.finchcare.com/hc/en-us/articles/37935669335309-Our-Approach-to-Self-Care
- **[E11] Finch creating/completing goals** — https://help.finchcare.com/hc/en-us/articles/37779940291213-Creating-and-Completing-Goals
- **[E12] Microsoft To Do — My Day and suggestions** — https://support.microsoft.com/en-US/ToDo/plan-and-connect-with-microsoft-to-do
- **[E13] Microsoft Planner — My Day** — https://support.microsoft.com/en-US/Planner/teams/plan-your-day-with-my-day
- **[E14] Apple Health — view highlights/trends** — https://support.apple.com/guide/iphone/view-your-health-data-iphe3d379c32/26/ios/26
- **[E15] Apple Journal — get started** — https://support.apple.com/guide/iphone/get-started-iph0e5ca7dd3/26/ios/26
- **[E16] Apple Journal — settings/privacy/suggestions** — https://support.apple.com/en-euro/guide/iphone/iphf965002cf/26/ios/26

### Behavioral/research evidence

- **[E17] Williams et al., mEMA compliance systematic review/meta-analysis** — https://www.jmir.org/2021/3/e17023/
- **[E18] EMA designs/samples/compliance meta-analysis** — https://pmc.ncbi.nlm.nih.gov/articles/PMC9999286/
- **[E19] Gamified digital-health RCT systematic review/meta-analysis** — https://pmc.ncbi.nlm.nih.gov/articles/PMC11701442/
- **[E20] Alberts et al., Self-Determination Theory in behavior-change technologies** — https://arxiv.org/abs/2402.00121

### Platform/accessibility evidence

- **[E21] Apple HIG Accessibility** — https://developer.apple.com/design/human-interface-guidelines/accessibility/
- **[E22] W3C Accessibility Principles** — https://www.w3.org/WAI/fundamentals/accessibility-principles/
- **[E23] WCAG 2.2** — https://www.w3.org/TR/WCAG22/
- **[E24] WCAG Reflow understanding** — https://www.w3.org/WAI/WCAG22/Understanding/reflow
- **[E25] web.dev INP** — https://web.dev/articles/optimize-inp
- **[E26] web.dev LCP** — https://web.dev/articles/lcp
- **[E27] Android window size classes** — https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes
- **[E28] Android layout/navigation patterns** — https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns
- **[E29] Android canonical adaptive layouts** — https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts
- **[E30] Microsoft Windows NavigationView adaptive behavior** — https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/navigationview
- **[E31] Apple HIG Keyboards** — https://developer.apple.com/design/human-interface-guidelines/keyboards/
- **[E32] Apple HIG Pointing devices** — https://developer.apple.com/design/human-interface-guidelines/pointing-devices
- **[E33] Apple HIG Charts** — https://developer.apple.com/design/human-interface-guidelines/charts
- **[E34] Apple HIG Right to left** — https://developer.apple.com/design/human-interface-guidelines/right-to-left
- **[E35] Apple HIG Color** — https://developer.apple.com/design/human-interface-guidelines/color
- **[E36] Apple HIG Dark Mode** — https://developer.apple.com/design/human-interface-guidelines/dark-mode
- **[E37] Apple HIG Motion** — https://developer.apple.com/design/human-interface-guidelines/motion
- **[E38] Apple HIG Layout** — https://developer.apple.com/design/human-interface-guidelines/layout
- **[E39] web.dev offline fallback** — https://web.dev/articles/offline-fallback-page
- **[E40] web.dev FCP** — https://web.dev/articles/fcp

### Growth Compass evidence

- **[G1]** PR #6 exact-head Revision C visual/runtime checkpoint at `38bb96e0c84f94d02b437ef1b28c3617671fda70`.
- **[G2]** `docs/MODULARITY_STANDARD.md` — mandatory architecture/isolation contract.

---

## 26. Final design direction

The next successful Growth Compass iteration is **not** "more polished cards."

It is a shift from:

`dashboard -> explanation -> controls`

to:

`current reality -> obvious action -> optional depth`.

The engineering architecture is already strong enough to permit that redesign safely. The design work should now be judged on task speed, comprehension, visual confidence, accessibility, adaptive quality and user evidence.

Until those measures reach the 9/10 threshold, do not add new features merely to make the product feel more complete.
