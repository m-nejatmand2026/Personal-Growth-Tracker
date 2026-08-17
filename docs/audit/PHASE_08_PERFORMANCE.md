# Engineering audit — Phase 8: Performance

Status: **COMPLETE — LIGHTWEIGHT BASELINE PRESERVED; SCALE RISKS RECORDED**

Audit context: Growth Compass — Version 1 Beta, Cloudflare Worker + Workers Assets + D1, native ES modules and CSS without a frontend framework/bundler.

## Overall assessment

Growth Compass does **not** currently have a dependency/bundle problem. The browser application has no third-party runtime libraries, external fonts, remote scripts or frontend framework, and the source remains small enough that adding a bundler/code-splitting pipeline solely for perceived performance would create more engineering complexity than demonstrated benefit.

The audit found one concrete client request waterfall on Today and removed it. Release-blocking source budgets now prevent silent frontend growth. Server-side composition already uses concurrency in important paths, list endpoints are generally bounded, and core history queries have profile/date indexes.

The main remaining performance risks are scale-dependent rather than current-Beta failures: Today year-range calculation expands civil days in JavaScript, Journal substring search cannot use the date index for the text predicate, full user export is intentionally unbounded, and there is no browser/Web-Vitals style performance evidence yet.

---

## P1 — Runtime dependency footprint is appropriately small

**Status:** PASS

Evidence:

- browser code uses native ES modules;
- `package.json` has no production/browser dependencies;
- Wrangler `4.123.0` is the only development dependency;
- initial HTML contains no third-party script, font or stylesheet origins;
- Meditation ambient audio and guided speech use browser-local APIs rather than remote media SDKs.

Decision:

Do not introduce React/Vue/a bundler merely to claim optimization. Revisit build tooling only when measured source/request growth, browser compatibility or developer ergonomics justify it.

## P2 — Frontend source now has an explicit growth budget

**Status:** PASS after remediation  
**Severity before remediation:** LOW/MEDIUM maintainability risk

A new dependency-free Quality test recursively measures all `public/js/**/*.js` and `public/css/**/*.css` source files.

Current guardrails:

- combined JS + CSS source must remain <= 512 KiB;
- any single JS/CSS source file must remain <= 40 KiB.

These are **source-growth guardrails**, not claims about compressed transfer size or rendering speed. Their purpose is to make a large architectural growth step explicit rather than letting the native frontend silently become a monolith.

If a legitimate feature exceeds a budget, first determine whether the file/module should be recursively isolated or whether the budget genuinely needs revision. Do not mechanically raise limits.

## P3 — Today contained an avoidable serial request waterfall

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM

Observed client flow:

1. load Daily Plan;
2. wait;
3. load Journal preview;
4. wait;
5. render the Today composition, whose Capacity / Today summary / Wellbeing reads are then performed concurrently.

Daily Plan and Journal preview are independent capabilities. Serializing them added one unnecessary network round trip to every Today render.

Remediation:

`public/js/app.js` now starts those two reads together using `Promise.allSettled`. Each capability retains independent degraded behavior if its read fails.

A Quality contract protects this concurrency decision.

## P4 — Important Today server reads are already concurrent

**Status:** PASS

`worker/modules/today/public.js` uses concurrency in the two important composition layers reviewed:

- direction calculation concurrently reads Progress aggregate, Plan allocations and Activity references;
- `getDay()` concurrently calculates direction and reads same-day Progress history.

This matches the architecture: Today composes public contracts but does not copy their SQL/business persistence into a central query module.

Do not collapse these contracts into cross-module SQL merely to reduce function calls.

## P5 — Year/month direction calculation has a scale-sensitive CPU shape

**Status:** CONCERN  
**Severity:** MEDIUM before larger user histories

`getDirection()` currently expands every civil date in the selected range, then scans effective plan versions and their values for each date.

For current Beta data this is small and provides correct exact-calendar semantics. The algorithm becomes more expensive as all three dimensions grow:

- date range (especially Year);
- number of historical plan versions;
- goals/values per version.

Required future optimization trigger:

When representative benchmark data shows this path is material, replace per-day expansion with interval overlap/allocation math while preserving the exact semantics already protected by tests (real month length, leap years, effective-dated plan history).

Do **not** optimize it prematurely with approximate four-week/month scaling or by losing historical version accuracy.

## P6 — Core history/list reads are bounded and indexed

**Status:** PASS for reviewed paths

Positive evidence:

- Progress list limit defaults to 100 and is bounded to a maximum of 500;
- Journal list defaults to 50 and is bounded to 100;
- Progress has `(profile_id, occurred_on)` plus goal/date and activity/date indexes;
- Journal has `(profile_id, occurred_on DESC, id DESC)`;
- Areas/Goals/Plans/Capacity have profile/status/date indexes aligned with primary list/read shapes;
- prepared/bound predicates keep profile/date filtering in D1 rather than loading entire datasets into the Worker for ordinary views.

Continue evaluating indexes from real query shapes/data rather than adding speculative indexes to every column.

## P7 — Journal substring search will scan profile text as history grows

**Status:** CONCERN  
**Severity:** LOW current Beta; MEDIUM for long-lived/public users

Journal search uses wildcard predicates such as:

`LIKE '%query%'`

across title, body and tags. The result set is bounded, but the text predicate can still require scanning the user's matching date/profile rows as the Journal becomes large.

Current decision:

Keep the simple private-Beta implementation. Do not introduce an FTS/indexing subsystem before representative data shows a real latency problem.

Future option:

If search becomes measurably slow, evaluate a Journal-owned full-text/search strategy. It must remain private to Journal and must not quietly become an Insights/AI indexing path.

## P8 — Full user export is intentionally unbounded

**Status:** CONCERN  
**Severity:** LOW now; MEDIUM at public scale

`/api/export` is an explicit ownership/export operation and therefore correctly returns complete module data rather than silently truncating it.

As accounts become long-lived, composing all module exports into one in-memory JSON response may eventually become an expensive request.

Before public scale, benchmark representative multi-year accounts. If needed, redesign export as a deliberately asynchronous/streamed job while retaining module public-contract ownership and complete user data semantics.

Do not paginate a user export in a way that silently omits data.

## P9 — Static module/CSS loading is broad but acceptable at current source size

**Status:** ACCEPTED CURRENT DESIGN

The frontend composition root statically imports all registered module manifests and `index.html` loads the module/business stylesheets up front.

This means a first visit can request code/styles for capabilities the user may not immediately open. However:

- the total source footprint remains under the new budget;
- there are no large third-party dependencies;
- static imports keep the module registry deterministic and simple;
- no measured cold-load evidence currently justifies making registry discovery asynchronous.

Revisit lazy loading when actual browser measurements show network/parse cost rather than implementing it speculatively.

Any future lazy-loading design must preserve module dependency validation and graceful disabled-module behavior.

## P10 — Private API responses deliberately use `Cache-Control: no-store`

**Status:** PASS / intentional security-performance tradeoff

Phase 5 set API JSON responses to `no-store` because they contain private/profile data such as Journal, Wellbeing, Progress and export content.

Do not undo that security/privacy boundary as a generic caching optimization.

Performance work should first target request composition, query shape, payload size and rendering. If a future public/read-only endpoint can be safely cached, make that an explicit endpoint-specific decision.

## P11 — Browser performance evidence is missing

**Status:** CONCERN  
**Severity:** HIGH before public/global launch; MEDIUM current private Beta

The current suite can protect source budgets and code structure, but it cannot measure:

- first contentful/render timing on real browsers;
- largest-content rendering;
- interaction latency;
- layout shifts;
- CSS/JS parse/evaluation cost;
- actual request waterfall timing under mobile/network latency;
- browser memory over long navigation/use sessions;
- Meditation Web Audio/speech resource cleanup in a real browser.

This aligns with Phase 3/7: add a focused browser E2E layer before public release, then capture performance measurements on representative mobile and desktop viewports.

Do not set arbitrary Web-Vitals-style release thresholds until the browser layer exists and we have a baseline to compare against.

## P12 — No performance regression should compromise product semantics

**Status:** PASS as design principle

Several tempting shortcuts are explicitly rejected:

- no approximate four-week month math;
- no truncation of factual history merely to make calculations cheaper;
- no cross-module SQL joins that destroy capability ownership;
- no caching of private API responses by default;
- no reduced Insight evidence thresholds for faster computation;
- no background precomputation that rewrites historical facts.

Optimization must preserve Growth Compass domain semantics and modularity.

## Verification checkpoint

After Phase 8 executable changes:

- feature SHA: `363b262872e6822c247b5d65ee2c8163ed8db4c6`
- Quality run #323
- **276 / 276 passing**
- exact tested feature SHA confirmed by Quality checkout.

Documentation commits after this checkpoint must also pass the full Quality gate before Phase 8 is frozen.

## Phase 8 decision

**Performance direction: continue without architectural overreaction.**

The app remains deliberately lightweight. Current priorities before public release are:

- obtain browser performance measurements (P11);
- benchmark Today range calculation with representative long-lived plan history before optimizing it (P5);
- benchmark Journal search/export with representative multi-year accounts before introducing heavier infrastructure (P7/P8);
- retain the frontend source budgets and independent-read concurrency guard.

Production Worker code and production D1 were not changed by this phase.
