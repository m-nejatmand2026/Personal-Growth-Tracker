// Module-owned Wellness Boost content. Guided scripts are original Growth Compass
// copy. Playback uses device speech and locally generated ambient sound so Beta
// does not depend on third-party recordings or unlicensed music.
export const boostTypes = Object.freeze({
  meditation: Object.freeze({
    id: 'meditation',
    label: 'Meditation',
    description: 'Choose a practice that fits the moment.'
  })
});

function practice(input) {
  return Object.freeze({
    ...input,
    boostType: 'meditation',
    availableModes: Object.freeze(['voice', 'ambient', 'both']),
    cues: Object.freeze(input.cues.map((cue) => Object.freeze(cue)))
  });
}

export const boostContent = Object.freeze([
  practice({
    id: 'meditation-gentle-arrival',
    title: 'Gentle arrival',
    durationMinutes: 3,
    category: 'Reset',
    icon: '◌',
    summary: 'Settle into the moment.',
    description: 'A brief pause to notice the body, the breath, and where you are now.',
    cues: [
      { atSeconds: 0, text: 'Settle into a position that feels steady enough. You do not need to make anything perfect.' },
      { atSeconds: 25, text: 'Notice where your body is supported. Let your shoulders soften if they want to.' },
      { atSeconds: 60, text: 'Bring attention to one natural breath. No need to deepen it. Just notice the inhale and the exhale.' },
      { atSeconds: 105, text: 'If your attention wandered, notice that gently and return to the next breath.' },
      { atSeconds: 150, text: 'Take in the space around you again. Choose one small thing you want to carry into the next moment.' }
    ]
  }),
  practice({
    id: 'meditation-steadier-breath',
    title: 'A steadier breath',
    durationMinutes: 5,
    category: 'Calm',
    icon: '∿',
    summary: 'Follow a guided breathing rhythm.',
    description: 'A motion-guided breathing practice with a longer exhale and optional locally generated ambient sound.',
    cues: [
      { atSeconds: 0, text: 'Find a comfortable position and let your breathing be ordinary.' },
      { atSeconds: 35, text: 'Notice the beginning of an inhale, the middle, and the end. Then notice the exhale in the same way.' },
      { atSeconds: 90, text: 'There is nothing to achieve here. Let each breath arrive and leave on its own.' },
      { atSeconds: 150, text: 'When thoughts pull your attention away, name that simply as thinking, then return to the feeling of breathing.' },
      { atSeconds: 220, text: 'Notice whether any part of the body can release a little effort.' },
      { atSeconds: 270, text: 'For the last few breaths, widen your attention to include your body and the room around you.' }
    ]
  }),
  practice({
    id: 'meditation-open-attention',
    title: 'Open attention',
    durationMinutes: 10,
    category: 'Focus',
    icon: '✦',
    summary: 'Clear some mental space.',
    description: 'Practice returning attention without turning distraction into a problem.',
    cues: [
      { atSeconds: 0, text: 'Let yourself arrive. Feel the contact points between your body and whatever is supporting you.' },
      { atSeconds: 45, text: 'Choose the breath as a home base. Follow one full inhale and one full exhale.' },
      { atSeconds: 120, text: 'Now allow sounds to be part of awareness. Notice them without needing to identify or follow them.' },
      { atSeconds: 210, text: 'Return to the breath when you want a steady reference point.' },
      { atSeconds: 300, text: 'Notice thoughts as events that appear and change. You do not need to finish each one.' },
      { atSeconds: 390, text: 'If attention has narrowed around one thought, gently reopen it to breath, body, and sound.' },
      { atSeconds: 480, text: 'For a little while, let awareness be broad. Nothing specific needs to be held onto.' },
      { atSeconds: 555, text: 'Notice what feels most present now, then prepare to return to what you were doing.' }
    ]
  }),
  practice({
    id: 'meditation-settle-restore',
    title: 'Settle and restore',
    durationMinutes: 20,
    category: 'Restore',
    icon: '☾',
    summary: 'Take a longer restorative pause.',
    description: 'A longer practice with spacious pauses for body awareness, breath, and open attention.',
    cues: [
      { atSeconds: 0, text: 'Choose a position you can stay with comfortably. Let this time be unhurried.' },
      { atSeconds: 60, text: 'Notice the weight of the body and the places where you are supported.' },
      { atSeconds: 150, text: 'Move attention slowly through the face, jaw, neck, and shoulders. Let unnecessary effort soften where it can.' },
      { atSeconds: 270, text: 'Bring attention to the breath. Feel where breathing is easiest to notice today.' },
      { atSeconds: 390, text: 'Stay with a few breaths. When attention moves elsewhere, returning is the practice.' },
      { atSeconds: 540, text: 'Open awareness to the whole body at once, including areas that feel neutral or quiet.' },
      { atSeconds: 690, text: 'Allow sounds and sensations to come and go without needing to organize them.' },
      { atSeconds: 840, text: 'If a thought feels urgent, notice the sense of urgency too. You can return to it after this pause.' },
      { atSeconds: 990, text: 'Rest attention wherever it feels most natural: breath, body, sound, or simple open awareness.' },
      { atSeconds: 1110, text: 'Begin to notice the room again. Feel your hands and feet, and let movement return gradually.' },
      { atSeconds: 1170, text: 'Before finishing, notice one quality you would like to bring with you into the rest of the day.' }
    ]
  })
]);
