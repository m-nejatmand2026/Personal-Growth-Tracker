function clockNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

export function formatMeditationClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export const BREATHING_PATTERN_4_2_8_2 = Object.freeze([
  Object.freeze({ id: 'inhale', label: 'Inhale', seconds: 4 }),
  Object.freeze({ id: 'hold-in', label: 'Hold', seconds: 2 }),
  Object.freeze({ id: 'exhale', label: 'Exhale', seconds: 8 }),
  Object.freeze({ id: 'hold-out', label: 'Hold', seconds: 2 })
]);

function voiceAvailable() {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';
}

function ambientAvailable() {
  return typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);
}

function speak(text) {
  if (!voiceAvailable()) return false;
  const utterance = new window.SpeechSynthesisUtterance(text);
  utterance.rate = 0.82;
  utterance.pitch = 0.96;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
  return true;
}

function createAmbient() {
  if (!ambientAvailable()) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  const master = context.createGain();
  const now = context.currentTime;
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.018, now + 1.6);
  master.connect(context.destination);

  const oscillators = [174.61, 220, 261.63].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = [0.58, 0.26, 0.16][index];
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    return oscillator;
  });

  // A very slow amplitude movement keeps the generated bed from sounding like
  // a static test tone. It remains local and contains no recorded media.
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.055;
  lfoGain.gain.value = 0.0025;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();

  void context.resume?.();
  return { context, master, oscillators, lfo };
}

function stopAmbient(ambient, { fadeMs = 650 } = {}) {
  if (!ambient) return;
  const { context, master } = ambient;
  const now = context.currentTime;
  const stopAt = now + fadeMs / 1000;
  try {
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    ambient.oscillators.forEach((oscillator) => oscillator.stop(stopAt));
    ambient.lfo?.stop(stopAt);
  } catch {
    ambient.oscillators.forEach((oscillator) => {
      try { oscillator.stop(); } catch { /* already stopped */ }
    });
    try { ambient.lfo?.stop(); } catch { /* already stopped */ }
  }
  window.setTimeout(() => void context.close?.(), fadeMs + 80);
}

function setPlayerStatus(root, text) {
  const status = root?.querySelector('[data-wb-status]');
  if (status) status.textContent = text;
}

function setReadyStatus(root, text) {
  const status = root?.querySelector('[data-wb-ready-status]');
  if (status) status.textContent = text;
}

function setPlayerActive(root, active) {
  root?.querySelector('.wellness-boost-player')?.classList.toggle('is-active', active);
}

function paintProgress(root, item, elapsedSeconds = 0) {
  const total = item.durationMinutes * 60;
  const safeElapsed = Math.min(total, Math.max(0, elapsedSeconds));
  const percent = total ? (safeElapsed / total) * 100 : 0;
  const progress = root?.querySelector('[data-wb-progress]');
  const track = root?.querySelector('[data-wb-progress-track]');
  const timer = root?.querySelector('[data-wb-time]');
  if (progress) progress.style.width = `${percent}%`;
  if (track) track.setAttribute('aria-valuenow', String(Math.round(percent)));
  if (timer) timer.textContent = formatMeditationClock(total - safeElapsed);
}

function resetPlayerControls(root) {
  const start = root?.querySelector('[data-wb-start]');
  const toggle = root?.querySelector('[data-wb-toggle]');
  const end = root?.querySelector('[data-wb-end]');
  if (start) start.disabled = false;
  if (toggle) { toggle.disabled = true; toggle.textContent = 'Pause'; }
  if (end) end.disabled = true;
  setPlayerActive(root, false);
}

export function createMeditationPlayer() {
  let session = null;

  function stop({ root = null, completed = false, quiet = false, item = null } = {}) {
    if (!session) return;
    clearInterval(session.timer);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    stopAmbient(session.ambient);
    const stoppedItem = item && item.id === session.itemId ? item : null;
    session = null;
    if (stoppedItem && root) paintProgress(root, stoppedItem, completed ? stoppedItem.durationMinutes * 60 : 0);
    resetPlayerControls(root);
    if (!quiet && root) {
      setReadyStatus(root, completed ? 'Complete. Nothing was logged.' : 'Ended. Nothing was logged.');
    }
  }

  function tick(root, item) {
    if (!session || session.itemId !== item.id || session.paused) return;
    const now = clockNow();
    session.elapsedSeconds += (now - session.lastTick) / 1000;
    session.lastTick = now;

    if (session.mode === 'voice' || session.mode === 'both') {
      item.cues.forEach((cue, index) => {
        if (session.elapsedSeconds >= cue.atSeconds && !session.spoken.has(index)) {
          session.spoken.add(index);
          speak(cue.text);
        }
      });
    }

    paintProgress(root, item, session.elapsedSeconds);
    if (session.elapsedSeconds >= item.durationMinutes * 60) stop({ root, completed: true, item });
  }

  function start(root, item, mode) {
    stop({ root, quiet: true, item });

    const wantsVoice = mode === 'voice' || mode === 'both';
    const wantsAmbient = mode === 'ambient' || mode === 'both';
    const hasVoice = !wantsVoice || voiceAvailable();
    const ambient = wantsAmbient ? createAmbient() : null;
    const hasAmbient = !wantsAmbient || Boolean(ambient);

    if (!hasVoice && !hasAmbient) {
      setReadyStatus(root, 'This device cannot start that listening style. Try another option.');
      return false;
    }
    if (mode === 'voice' && !hasVoice) {
      setReadyStatus(root, 'Guided voice is not available on this device. Try Ambient.');
      return false;
    }
    if (mode === 'ambient' && !hasAmbient) {
      setReadyStatus(root, 'Ambient sound is not available on this device. Try Guided.');
      return false;
    }

    session = {
      itemId: item.id,
      mode,
      elapsedSeconds: 0,
      lastTick: clockNow(),
      paused: false,
      spoken: new Set(),
      ambient,
      timer: null
    };

    const startButton = root.querySelector('[data-wb-start]');
    const toggle = root.querySelector('[data-wb-toggle]');
    const end = root.querySelector('[data-wb-end]');
    if (startButton) startButton.disabled = true;
    if (toggle) toggle.disabled = false;
    if (end) end.disabled = false;
    setPlayerActive(root, true);

    const unavailable = [];
    if (wantsVoice && !hasVoice) unavailable.push('guided voice');
    if (wantsAmbient && !hasAmbient) unavailable.push('ambient sound');
    setPlayerStatus(root, unavailable.length
      ? `Playing without ${unavailable.join(' and ')}.`
      : 'In progress.');

    tick(root, item);
    session.timer = setInterval(() => tick(root, item), 250);
    return true;
  }

  function toggle(root) {
    if (!session) return false;
    const toggleButton = root.querySelector('[data-wb-toggle]');
    session.paused = !session.paused;
    if (session.paused) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.pause();
      void session.ambient?.context.suspend?.();
      if (toggleButton) toggleButton.textContent = 'Resume';
      setPlayerStatus(root, 'Paused.');
    } else {
      session.lastTick = clockNow();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.resume();
      void session.ambient?.context.resume?.();
      if (toggleButton) toggleButton.textContent = 'Pause';
      setPlayerStatus(root, 'In progress.');
    }
    return session.paused;
  }

  return Object.freeze({
    isActive() {
      return Boolean(session);
    },
    start,
    toggle,
    stop
  });
}

function breathingStatus(root, text) {
  const status = root?.querySelector('[data-wb-breath-status]');
  if (status) status.textContent = text;
}

function breathingButton(root) {
  return root?.querySelector('[data-wb-breath-start]') || null;
}

function paintBreathingPhase(root, phase, remainingSeconds, { durationSeconds = phase.seconds, announce = false } = {}) {
  const button = breathingButton(root);
  const phaseLabel = root?.querySelector('[data-wb-breath-phase]');
  const count = root?.querySelector('[data-wb-breath-count]');
  if (button) {
    button.dataset.breathPhase = phase.id;
    button.dataset.breathRunning = 'true';
    button.style.setProperty('--breath-phase-duration', `${Math.max(.12, durationSeconds)}s`);
    button.setAttribute('aria-label', `${phase.label}, ${Math.max(1, Math.ceil(remainingSeconds))} seconds remaining`);
  }
  if (phaseLabel) phaseLabel.textContent = phase.label;
  if (count) count.textContent = `${Math.max(1, Math.ceil(remainingSeconds))}s`;
  if (announce) breathingStatus(root, `${phase.label} · ${phase.seconds} seconds`);
}

function resetBreathingGuide(root) {
  const button = breathingButton(root);
  const phaseLabel = root?.querySelector('[data-wb-breath-phase]');
  const count = root?.querySelector('[data-wb-breath-count]');
  const toggle = root?.querySelector('[data-wb-breath-toggle]');
  const end = root?.querySelector('[data-wb-breath-end]');
  if (button) {
    button.dataset.breathPhase = 'ready';
    button.dataset.breathRunning = 'false';
    button.dataset.breathPaused = 'false';
    button.style.setProperty('--breath-phase-duration', '.25s');
    button.setAttribute('aria-label', 'Start guided breathing');
    button.disabled = false;
  }
  if (phaseLabel) phaseLabel.textContent = 'Ready';
  if (count) count.textContent = 'Tap to start';
  if (toggle) { toggle.disabled = true; toggle.textContent = 'Pause'; }
  if (end) end.disabled = true;
}

export function createBreathingGuide({ pattern = BREATHING_PATTERN_4_2_8_2 } = {}) {
  let session = null;

  function stop({ root = null, item = null, completed = false, quiet = false } = {}) {
    if (!session) {
      if (root) resetBreathingGuide(root);
      return;
    }
    clearInterval(session.timer);
    stopAmbient(session.ambient);
    const stoppedItem = item && item.id === session.itemId ? item : null;
    session = null;
    if (stoppedItem && root) paintProgress(root, stoppedItem, completed ? stoppedItem.durationMinutes * 60 : 0);
    if (root) resetBreathingGuide(root);
    if (!quiet && root) breathingStatus(root, completed ? 'Complete. Nothing was logged.' : 'Ended. Nothing was logged.');
  }

  function tick(root, item) {
    if (!session || session.itemId !== item.id || session.paused) return;
    const now = clockNow();
    const delta = Math.max(0, (now - session.lastTick) / 1000);
    session.lastTick = now;
    session.elapsedSeconds += delta;
    session.phaseElapsed += delta;

    let phase = pattern[session.phaseIndex];
    while (session.phaseElapsed >= phase.seconds) {
      session.phaseElapsed -= phase.seconds;
      session.phaseIndex = (session.phaseIndex + 1) % pattern.length;
      phase = pattern[session.phaseIndex];
      paintBreathingPhase(root, phase, phase.seconds, { durationSeconds: phase.seconds, announce: true });
    }

    const remaining = Math.max(0, phase.seconds - session.phaseElapsed);
    const phaseLabel = root?.querySelector('[data-wb-breath-phase]');
    const count = root?.querySelector('[data-wb-breath-count]');
    const button = breathingButton(root);
    if (phaseLabel) phaseLabel.textContent = phase.label;
    if (count) count.textContent = `${Math.max(1, Math.ceil(remaining))}s`;
    if (button) button.setAttribute('aria-label', `${phase.label}, ${Math.max(1, Math.ceil(remaining))} seconds remaining`);

    paintProgress(root, item, session.elapsedSeconds);
    if (session.elapsedSeconds >= item.durationMinutes * 60) stop({ root, item, completed: true });
  }

  function start(root, item, { sound = true } = {}) {
    stop({ root, item, quiet: true });
    const ambient = sound ? createAmbient() : null;
    session = {
      itemId: item.id,
      elapsedSeconds: 0,
      phaseIndex: 0,
      phaseElapsed: 0,
      lastTick: clockNow(),
      paused: false,
      soundEnabled: Boolean(sound),
      ambient,
      timer: null
    };

    const button = breathingButton(root);
    const toggle = root.querySelector('[data-wb-breath-toggle]');
    const end = root.querySelector('[data-wb-breath-end]');
    if (button) button.disabled = true;
    if (toggle) toggle.disabled = false;
    if (end) end.disabled = false;

    const phase = pattern[0];
    paintBreathingPhase(root, phase, phase.seconds, { announce: true });
    if (sound && !ambient) breathingStatus(root, 'Inhale · motion started; ambient sound is unavailable on this device.');
    paintProgress(root, item, 0);
    session.timer = setInterval(() => tick(root, item), 100);
    return true;
  }

  function toggle(root) {
    if (!session) return false;
    const button = breathingButton(root);
    const toggleButton = root.querySelector('[data-wb-breath-toggle]');
    session.paused = !session.paused;
    if (button) button.dataset.breathPaused = String(session.paused);
    if (session.paused) {
      void session.ambient?.context.suspend?.();
      if (toggleButton) toggleButton.textContent = 'Resume';
      breathingStatus(root, 'Paused.');
    } else {
      session.lastTick = clockNow();
      void session.ambient?.context.resume?.();
      if (toggleButton) toggleButton.textContent = 'Pause';
      const phase = pattern[session.phaseIndex];
      const remaining = Math.max(.1, phase.seconds - session.phaseElapsed);
      paintBreathingPhase(root, phase, remaining, { durationSeconds: remaining, announce: true });
    }
    return session.paused;
  }

  function setSound(enabled) {
    if (!session) return Boolean(enabled);
    if (enabled && !session.ambient) session.ambient = createAmbient();
    if (!enabled && session.ambient) {
      stopAmbient(session.ambient);
      session.ambient = null;
    }
    session.soundEnabled = Boolean(enabled && session.ambient);
    return session.soundEnabled;
  }

  return Object.freeze({
    isActive() {
      return Boolean(session);
    },
    start,
    toggle,
    setSound,
    stop
  });
}
