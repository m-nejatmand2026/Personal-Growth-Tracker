# Wellness Boost — Version 1 Beta

Status: active preview capability on `feature/experience-refinement`.

## Purpose

Wellness Boost is an optional, independent Growth Compass section for short practices that may help a person pause, settle, refocus, or restore.

It is deliberately separate from:

- **Wellbeing**, which records optional observations such as Energy, Sleep, and Day Context;
- **Progress**, which records factual activity history;
- **Daily Plan**, which records dated intentions.

Using or completing a Wellness Boost practice does **not** create Progress, a streak, catch-up debt, or a performance score.

## Version 1 content model

Meditation is the first Wellness Boost practice type.

The starter Meditation library contains four original Growth Compass practices:

- 3 min — **Gentle arrival**
- 5 min — **A steadier breath**
- 10 min — **Open attention**
- 20 min — **Settle and restore**

Each practice owns:

- title;
- duration;
- category;
- concise library summary;
- optional longer description;
- timed guidance cues;
- supported playback modes.

The module is structured so later practice types such as Breathing, Reset, Focus, Sleep, or gentle movement can be added without changing Today, Progress, Wellbeing, or platform/core.

## Experience model

Wellness Boost should feel like entering a quieter destination, not another dashboard.

The default path is intentionally progressive:

1. Wellness Boost opens with the short Meditation context and the line **Take a few minutes for yourself.**
2. The library uses a restrained content width instead of stretching across the full desktop workspace.
3. One meditation is visually featured to create a clear focal point. In Version 1 Beta, **A steadier breath** is the featured five-minute practice.
4. The remaining meditations appear as compact rows under **More meditations** rather than four equal dashboard cards.
5. Reset, Calm, Focus, and Restore use low-saturation module-owned tones for distinction without turning the page into a bright wellness-app palette.
6. The library is not wrapped in a large white dashboard panel.
7. The whole featured practice and each compact row are the selection targets. Repeated `Open practice` buttons are not shown.
8. Duration filter controls are not shown while the library is only four items.
9. Playback choices are deferred until after a meditation is selected.
10. After Start, setup controls disappear and the player foregrounds remaining time, progress, Pause/Resume, and End.
11. Full guidance remains available through a collapsed `Read guidance` disclosure.

Do not fill the library with disabled or decorative `Coming soon` practice types. New Wellness Boost types should appear only when usable.

## Playback model

The Version 1 Beta player offers:

- **Guided** — uses the device/browser built-in speech voice to read the original timed meditation cues;
- **Ambient** — uses a locally generated low-volume ambient tone created with browser audio primitives;
- **Both** — combines guided voice and ambient sound.

The player supports start, pause/resume, end, visible remaining time, progress, and readable guidance text.

Leaving Wellness Boost stops active speech and ambient playback.

## Audio and rights policy

No third-party meditation recording or music is bundled in the Beta implementation.

The current guided scripts are original Growth Compass content. Guided playback is synthesized by the person's device. Ambient playback is generated locally in the browser.

Future recorded voices, music, soundscapes, or licensed tracks may be added only when Growth Compass owns the content or has explicit distribution rights. Content metadata and playback implementation remain module-owned.

## Privacy and persistence

The current Meditation player:

- makes no Progress API calls;
- makes no Wellbeing API calls;
- creates no D1 rows;
- uses no localStorage/sessionStorage for meditation history;
- uploads no meditation recording;
- does not create streaks or completion pressure.

If favorites, recents, downloaded audio, or practice history are added later, they require an explicit Wellness Boost-owned persistence contract rather than borrowing another module's tables.

## Navigation

Wellness Boost is a dedicated first-class app section.

Desktop exposes Wellness Boost and Insights in the navigation rail.

Mobile keeps the universal Logger centered while making Wellness Boost directly visible in the five-position main navigation:

`Today | Plan | + | Progress | Wellness`

Insights remains available as a labeled secondary top action on mobile. Journal and Settings remain secondary destinations.

## Modularity requirements

Wellness Boost remains dependency-free in Version 1 Beta.

It owns its content, presentation, playback lifecycle, and tests. Today does not embed its practice library. Removing or disabling Wellness Boost must leave Today, Plan, Progress, Insights, Journal, and Wellbeing functioning normally.

Any future cross-module behavior must use a declared public contract or factual event and must not silently turn Wellness Boost completion into Progress or Wellbeing data.
