# Growth Compass — Experience 2 Usability Protocol

Status: required human-validation protocol for a credible 90+ UX claim.  
Date: 2026-08-22.  
Scope: Preview 2 / Experience 2 only.

Automated tests can prove behavior, accessibility mechanics and regression safety. They cannot prove that a first-time human understands Growth Compass. A 90+ usability claim therefore requires representative human testing against this protocol.

## 1. Participants

Minimum useful formative round: 5–7 participants.  
Release-confidence rounds: two rounds with enough participants to detect recurring confusion, including a mix of planning/tracking experience and at least some people unfamiliar with Growth Compass.

Do not teach the navigation or product vocabulary before the tasks.

## 2. Environment matrix

At minimum include:

- compact phone touch
- larger phone touch
- desktop/laptop mouse or trackpad
- keyboard-only smoke
- one screen-reader smoke for the primary journey
- light and dark appearance

Later release acceptance should include representative iOS/Safari, Android/Chromium, Windows and macOS/PWA behavior.

## 3. Primary tasks

Give these as life situations, not UI instructions.

### Task 1 — Set direction

“You want the next year to be healthier. Set Growth Compass up so it reflects that.”

Observe whether the participant finds Direction through first-run or Compass without learning the internal word “Goal.”

### Task 2 — Make it concrete

“Choose one useful thing you could do this week to support that direction.”

Observe whether planning feels like an action rather than application administration.

### Task 3 — Real life changed

“You planned something for tonight, but it no longer fits. Change the plan without recording it as completed.”

Required semantic outcome: no factual Progress is created.

### Task 4 — Record fact

“You already exercised for 35 minutes today. Record what actually happened.”

Required semantic outcome: factual Progress is created; it must not be confused with a planned item.

### Task 5 — Record wellbeing

“Record that your energy feels low but your mood is positive.”

Observe whether the participant understands energy and mood as separate dimensions and can complete the observation quickly.

### Task 6 — Find a personal pattern

“You have a month of data. Find when your energy has generally been stronger.”

Observe whether Patterns answers a human question rather than forcing chart interpretation.

### Task 7 — Check alignment

“Find out whether your recent time has been going toward what you said matters.”

Observe navigation path, interpretation and any false causal assumptions.

### Task 8 — Reflect and adjust

“Review the week and decide one thing you want to change next week.”

Required outcome: participant can distinguish factual context from their own interpretation and save one deliberate adjustment.

### Task 9 — Recover

“Go back to the previous thing you were looking at using the phone/browser Back behavior.”

Required outcome: in-app history behaves predictably.

## 4. Metrics

Record for every task:

- success / partial / failure
- first-attempt success
- time to completion
- deliberate navigation actions
- wrong turns
- requests for explanation
- terminology confusion
- recovery from errors
- SEQ score 1–7 after each task

After the complete session, use SUS or an equivalent validated usability measure.

## 5. Release-quality targets

A credible 90+ target requires:

- >=95% unassisted completion across primary tasks
- >=90% first-attempt success for the common first-time tasks
- median Today orientation <=5 seconds; aspirational <=3 seconds
- common activity logging <=8 seconds when the activity exists
- common repeat action <=4 seconds
- primary destination <=2 deliberate navigation actions
- SEQ median >=6/7
- SUS >=85 or equivalent
- no critical recurring issue in >5% of participants

The aspirational 10/10 level requires stronger evidence, not more animation: >=98% completion, >=95% first-attempt success, SUS >=92, and no recurring major issue across two consecutive external rounds.

## 6. Observer rules

Do not rescue a participant immediately. Let hesitation become evidence.

Do not ask “Do you like it?” as the main question. Ask:

- What do you think this screen is for?
- What would you do next?
- What did you expect that control to do?
- What do you think this chart is claiming?
- What would you change about your next week after seeing this?

If a participant interprets an observational pattern as proven causation, treat that as a design defect even if the wording is technically correct.

## 7. Accessibility acceptance

In addition to automated checks, verify manually:

- keyboard completion of all primary tasks
- visible focus never hidden behind fixed navigation
- 200% browser text resize
- reflow around 320 CSS px equivalent
- reduced motion
- chart information available without relying on color or pointer hover
- screen-reader labels for navigation, check-ins, charts and dialogs
- touch controls are comfortably operable; target 44px-class controls for primary actions
- modal focus containment and focus return

## 8. Evidence states to test

Run Patterns with:

- no data
- 3 tracked days
- 12 tracked days
- 30 tracked days
- 60 tracked days

The amount and certainty of analysis must increase progressively. Empty/low-data states should provide the next useful action instead of fake charts.

## 9. Scoring rubric

Score each dimension 0–100 after a round:

| Dimension | Weight |
|---|---:|
| First-time comprehension | 18% |
| Everyday action speed | 16% |
| Navigation / mental model | 13% |
| Planning realism | 10% |
| Evidence comprehension | 10% |
| Reflection / adjustment usefulness | 8% |
| Error recovery / changed-plan handling | 7% |
| Accessibility | 7% |
| Responsive execution | 5% |
| Visual hierarchy / confidence | 4% |
| Emotional pressure / non-shaming behavior | 2% |

Do not round a weak dimension away with aesthetics. A release candidate with any critical semantic failure—planned work becoming fact, causation invented from observations, inaccessible core operation, or changed plans becoming shame/debt—fails regardless of weighted score.

## 10. Iteration rule

After each round:

1. rank failures by frequency × severity;
2. fix the mental-model/interaction problem before adding explanation copy;
3. rerun the affected tasks;
4. only then refine visual polish;
5. preserve the domain contracts and Preview 2 isolation gates.
