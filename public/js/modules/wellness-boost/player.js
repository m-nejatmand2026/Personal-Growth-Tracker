function clockNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

export function formatMeditationClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

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
  master.gain.value = 0.018;
  master.connect(context.destination);

  const oscillators = [174.61, 261.63].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = index === 0 ? 0.72 : 0.28;
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    return oscillator;
  });

  void context.resume?.();
  return { context, oscillators };
}

function stopAmbient(ambient) {
  if (!ambient) return;
  ambient.oscillators.forEach((oscillator) => {
    try { oscillator.stop(); } catch { /* already stopped */ }
  });
  void ambient.context.close?.();
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
