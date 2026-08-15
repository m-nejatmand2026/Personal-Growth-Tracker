# Growth Compass — Core Everyday Workflows V1

Status: product-definition reset after rejected visual implementation.

These workflows are acceptance contracts. Screens must serve them; screens are not ends in themselves.

## Workflow 1 — Plan an existing Activity

1. From Today, tap `Add activity` or center Add.
2. Add sheet opens with `Plan / Start now / Done` and `Plan` selected if invoked from a planning context.
3. Search field focuses.
4. Recent/frequent Activities are visible immediately.
5. Select Activity.
6. Choose duration; common presets are available.
7. Date defaults to Today; Tomorrow is one tap; advanced date/time stays secondary.
8. Confirm `Add to Today/Tomorrow`.
9. Sheet closes.
10. The item appears immediately in `Your day`.
11. No Progress fact is written.

Target: existing Activity + default duration/date should be only a few taps.

## Workflow 2 — Start an existing Activity now

1. From Today `Now`, tap `Start an activity`, or open Add and choose `Start now`.
2. Select recent/frequent Activity.
3. Duration may be estimated/defaulted but must be editable.
4. Confirm `Start now`.
5. Today now shows the Activity in the `Now` slot with start time and clear `Done` action.
6. No Progress fact exists yet.

## Workflow 3 — Finish an in-progress Activity

1. Tap `Done` on the active Today item.
2. Completion sheet confirms actual duration and optional note/focus.
3. Save.
4. Daily Plan intention becomes completed.
5. A factual Progress record is created explicitly.
6. Today `Now` returns to no-active-item or the next item.
7. Recent Progress updates.

## Workflow 4 — Record something already done

1. Open Add → `Done`.
2. Select/search Activity.
3. Enter actual duration/measurement.
4. Optional date/time/note under details.
5. Save.
6. Factual Progress appears immediately.
7. No new planned item is created unless explicitly requested.

## Workflow 5 — Create a missing Activity in context

1. Open Add.
2. Type a name that does not match an existing Activity.
3. Show `Create “<name>”` directly below matches.
4. Keep the current Plan/Start/Done context intact.
5. Ask only the minimum relationship information required by the domain contract.
6. Create Activity.
7. Return automatically to the capture flow with the Activity selected.
8. Finish Plan/Start/Done without leaving the sheet.

The user must never be forced to navigate to Activity Library during this workflow.

## Workflow 6 — Create a generic Daily Plan item

Use when the thing is an intention but does not need to become a reusable progress-tracked Activity.

1. Today → `Add to day`.
2. Type title.
3. Date defaults to Today.
4. Optional time/duration.
5. Save.
6. Item appears in `Your day`.
7. Marking it complete completes the intention only; it does not fabricate a Progress record.

## Workflow 7 — Recover an unfinished plan

1. On the next planning/recovery moment, show unfinished items explicitly.
2. For each item choose: Keep / Move / Reduce / Complete truthfully / Drop.
3. Apply decision.
4. Never create automatic catch-up debt or silent rollover.

## Workflow 8 — Weekly planning

1. Open Plan.
2. See Available / Planned / Flexible time together.
3. See active priorities/Goals and their current planned attention.
4. Select a Goal or Activity that needs attention.
5. `Plan activity` opens capture in Plan mode.
6. Add items to specific days or leave flexible where supported.
7. Capacity updates as planned time changes.
8. Finish with an understandable week, not a score.

## Workflow 9 — Create a Goal

1. Plan → Goals → Add goal.
2. Enter Goal name.
3. Choose or create Life Area in context.
4. Answer `How will you know you are making progress?` using plain-language choices.
5. Optional target/minimum and dates stay progressive.
6. Save.
7. Goal appears in Plan.
8. User may add an Activity immediately or later.

## Workflow 10 — Check factual Progress

1. Open Progress.
2. Recent factual history is visible first.
3. Change Day/Week/Month/Year/filter.
4. Open Goal/Activity detail when needed.
5. Planned items remain visually distinct and are never counted as Actual.

## Workflow 11 — Check Insights

1. Open Insights.
2. First show evidence readiness and sample size.
3. If insufficient data, say what can be learned now and what cannot.
4. If enough paired data exists, show descriptive associations with sample size and non-causal language.
5. Do not invent a pattern merely to fill the page.

## Workflow 12 — Journal quickly

1. Open Journal.
2. Tap `New entry`.
3. Writing field is immediately ready.
4. Optional prompt/title/tags/type/date are secondary.
5. Save.
6. Return to history with the new entry visible.

## Workflow 13 — Use Wellness

1. Open Wellness.
2. See a featured practice and compact alternatives.
3. Choose by purpose/duration.
4. Start player.
5. Play/pause/stop with accessible controls.
6. Completion remains a Wellness event only; it does not silently write Progress.

## Workflow 14 — Energy check-in

1. Today or Wellbeing entry point → check-in.
2. Select energy level quickly.
3. Optional context/note.
4. Save.
5. Today reflects the observation.
6. Insights may use it only through the declared Wellbeing contract.

## Cross-workflow rules

- Capture first; organize later where safe.
- Every mutation must communicate its consequence.
- Intentions and facts remain different records.
- No hidden rollover, hidden scoring, streak pressure or fabricated interpretation.
- Common actions must stay within thumb reach on mobile.
- No workflow should require internal words such as `subtype`, `measurement_type`, `plan_version`, or `progress_record`.