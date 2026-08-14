// Module-owned, rights-safe starter catalog. Replace placeholder tracks only
// with audio Growth Compass owns or is explicitly licensed to distribute.
const TONE_PLACEHOLDER = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAh46TlpaTjoiBeXNua2ttcXd/ho2SlZWTj4mCe3RvbGttcXZ9hYuRlJWTkIqDfHVwbWttcHZ8g4qPk5STkIuEfXdxbmxtcHV7gomOkpSTkIyGf3hzbm1tb3R6gYeNkZOTkYyHgHl0cG1tb3N5f4aMkJKTkY2HgXt1cW5tb3N4foWKj5KSkY2Ignx2cm9ub3J3fYOJjpGSkY6Jg313c3Bub3J3fIKIjZCRkY6KhH55dHBvb3J2e4GHjI+RkI6KhX96dXFwcHJ1eoCGio6QkI6LhoF7dnJwcHJ1en+EiY2PkI6Lh4F8d3NxcHJ1eX6DiIyPj46Lh4J9eHRycXJ0eH2Ch4uOj46MiIN+eXVzcXJ0eHyBhoqNjo6MiIR/enZzcnJ0d3yAhYmMjo6MiYWAe3d0c3N0d3uAhIiLjY2MiYWBfHh1c3N0d3p/g4eKjI2MiYaCfXl2dHN0d3p+goaKjIyMiYaCfnp3dXR0dnp9goWJi4yLioeDf3t4dXR1dnl9gYWIiouLioeDgHx5dnV1dnl8gISHiYuLiYeEgH15d3Z1d3l8f4OGiYqKiYeEgX16eHZ2d3l7f4KFiImKiYeFgn57eXd2d3l7foGFh4mJiYeFgn98eXh3d3l7foGEhoiJiYeFgn99enh3eHl7fYCDhoeIiIeFg4B9e3l4eHl7fYCChYeIiIeFg4B+e3p5eHl7fX+ChIaHh4eFg4F+fHp5eXl7fX+BhIWGh4aFg4F/fXt6eXp7fH+Bg4WGhoaFhIJ/fXx6enp7fH6AgoSFhoaFhIKAfnx7enp7fH6AgoOFhYWFhIKAfn18e3t7fX6AgYOEhYWEg4KAf318fHt8fX5/gYKDhISEg4KBf359fHx8fX5/gYKDhISEg4KBgH59fXx9fX5/gIGCg4ODg4KBgH9+fX19fX5/gIGCg4ODgoKBgH9+fn19fn5/gIGCgoKCgoKBgH9/fn5+fn9/gICBgoKCgoGBgIB/f35+f39/gICBgYGBgYGBgIB/f39/f39/gICAgYGBgYGAgICAgH9/f4CAgICAgICAgICAgICAgICAgICAgA==';

export const boostTypes = Object.freeze({
  meditation: Object.freeze({
    id: 'meditation',
    label: 'Meditation',
    description: 'A short pause for settling, noticing, or refocusing.'
  })
});

export const boostContent = Object.freeze([
  Object.freeze({
    id: 'meditation-gentle-arrival',
    boostType: 'meditation',
    title: 'Gentle arrival',
    durationMinutes: 3,
    category: 'Reset',
    description: 'Pause, soften your shoulders, and give your attention one quiet place to land.',
    audioKind: 'music',
    tracks: Object.freeze([
      Object.freeze({
        role: 'music',
        label: 'Ambient preview tone',
        src: TONE_PLACEHOLDER,
        mimeType: 'audio/wav',
        placeholder: true
      })
    ])
  }),
  Object.freeze({
    id: 'meditation-guided-breath',
    boostType: 'meditation',
    title: 'A steadier breath',
    durationMinutes: 5,
    category: 'Guided',
    description: 'A future guided practice with optional ambient sound underneath.',
    audioKind: 'both',
    tracks: Object.freeze([])
  })
]);
