import { escapeHtml } from '../../core/dom.js';
import { boostContent, boostTypes } from './content.js';

const MODES = Object.freeze([
  Object.freeze({ id: 'voice', label: 'Guided' }),
  Object.freeze({ id: 'ambient', label: 'Ambient' }),
  Object.freeze({ id: 'both', label: 'Both' })
]);

let activePracticeId = null;
let selectedMode = 'voice';
let session = null;

function clockNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function formatClock(totalSeconds) {
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
  if (timer) timer.textContent = formatClock(total - safeElapsed);
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

function stopSession({ root = null, completed = false, quiet = false } = {}) {
  if (!session) return;
  clearInterval(session.timer);
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  stopAmbient(session.ambient);
  const item = boostContent.find((entry) => entry.id === session.itemId);
  session = null;
  if (item && root) paintProgress(root, item, completed ? item.durationMinutes * 60 : 0);
  resetPlayerControls(root);
  if (!quiet && root) {
    setReadyStatus(root, completed ? 'Complete. Nothing was logged.' : 'Ended. Nothing was logged.');
  }
}

function tickSession(root, item) {
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
  if (session.elapsedSeconds >= item.durationMinutes * 60) stopSession({ root, completed: true });
}

function startSession(root, item, mode) {
  stopSession({ root, quiet: true });

  const wantsVoice = mode === 'voice' || mode === 'both';
  const wantsAmbient = mode === 'ambient' || mode === 'both';
  const hasVoice = !wantsVoice || voiceAvailable();
  const ambient = wantsAmbient ? createAmbient() : null;
  const hasAmbient = !wantsAmbient || Boolean(ambient);

  if (!hasVoice && !hasAmbient) {
    setReadyStatus(root, 'This device cannot start that listening style. Try another option.');
    return;
  }
  if (mode === 'voice' && !hasVoice) {
    setReadyStatus(root, 'Guided voice is not available on this device. Try Ambient.');
    return;
  }
  if (mode === 'ambient' && !hasAmbient) {
    setReadyStatus(root, 'Ambient sound is not available on this device. Try Guided.');
    return;
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

  const start = root.querySelector('[data-wb-start]');
  const toggle = root.querySelector('[data-wb-toggle]');
  const end = root.querySelector('[data-wb-end]');
  if (start) start.disabled = true;
  if (toggle) toggle.disabled = false;
  if (end) end.disabled = false;
  setPlayerActive(root, true);

  const unavailable = [];
  if (wantsVoice && !hasVoice) unavailable.push('guided voice');
  if (wantsAmbient && !hasAmbient) unavailable.push('ambient sound');
  setPlayerStatus(root, unavailable.length
    ? `Playing without ${unavailable.join(' and ')}.`
    : 'In progress.');

  tickSession(root, item);
  session.timer = setInterval(() => tickSession(root, item), 250);
}

function toggleSession(root) {
  if (!session) return;
  const toggle = root.querySelector('[data-wb-toggle]');
  session.paused = !session.paused;
  if (session.paused) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.pause();
    void session.ambient?.context.suspend?.();
    if (toggle) toggle.textContent = 'Resume';
    setPlayerStatus(root, 'Paused.');
  } else {
    session.lastTick = clockNow();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.resume();
    void session.ambient?.context.resume?.();
    if (toggle) toggle.textContent = 'Pause';
    setPlayerStatus(root, 'In progress.');
  }
}

function renderPracticeCard(item) {
  return `<button type="button" class="wellness-boost-card" data-wb-open="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.title)}, ${item.durationMinutes} minutes, ${escapeHtml(item.category)}">
    <span class="wellness-boost-card-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
    <span class="wellness-boost-card-copy"><span class="wellness-boost-category">${escapeHtml(item.category)}</span><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.summary)}</span></span>
    <span class="wellness-boost-card-meta"><span class="wellness-boost-duration">${item.durationMinutes} min</span><span class="wellness-boost-card-arrow" aria-hidden="true">→</span></span>
  </button>`;
}

function renderLibrary() {
  const type = boostTypes.meditation;
  return `<div class="wellness-boost-view" data-module="wellness-boost" aria-label="Wellness Boost">
    <section class="wellness-boost-intro" aria-labelledby="wellnessBoostIntroTitle">
      <h2 id="wellnessBoostIntroTitle">Take a few minutes for yourself.</h2>
    </section>
    <section class="os-section wellness-boost-type" aria-labelledby="wellnessBoostMeditationTitle">
      <div class="os-section-head wellness-boost-library-head"><div><h2 id="wellnessBoostMeditationTitle">${escapeHtml(type.label)}</h2><small>${escapeHtml(type.description)}</small></div></div>
      <div class="wellness-boost-grid">${boostContent.map(renderPracticeCard).join('')}</div>
    </section>
  </div>`;
}

function renderModePicker(item) {
  return `<div class="wellness-boost-mode-picker" role="group" aria-label="Playback style">
    ${MODES.filter((mode) => item.availableModes.includes(mode.id)).map((mode) => `<button type="button" data-wb-mode="${mode.id}" aria-pressed="${mode.id === selectedMode}"><strong>${escapeHtml(mode.label)}</strong></button>`).join('')}
  </div>`;
}

function renderPlayer(item) {
  return `<div class="wellness-boost-view wellness-boost-player-view" data-module="wellness-boost" aria-label="Wellness Boost">
    <button type="button" class="wellness-boost-back" data-wb-back>← Meditation</button>
    <section class="wellness-boost-player" aria-labelledby="wellnessBoostPlayerTitle">
      <div class="wellness-boost-player-copy"><span class="wellness-boost-category">${escapeHtml(item.category)}</span><div class="wellness-boost-player-title"><h2 id="wellnessBoostPlayerTitle">${escapeHtml(item.title)}</h2><span class="wellness-boost-duration">${item.durationMinutes} min</span></div><p>${escapeHtml(item.description)}</p></div>

      <div class="wellness-boost-prestart">
        <h3>How would you like to listen?</h3>
        ${renderModePicker(item)}
        <button type="button" class="gc-button gc-button--primary wellness-boost-start" data-wb-start aria-label="Start meditation">Start</button>
        <p class="wellness-boost-ready-status" data-wb-ready-status role="status" aria-live="polite">Ready when you are.</p>
        <details class="wellness-boost-audio-note"><summary>About audio</summary><p>Guided uses your device’s built-in speech voice. Ambient sound is generated locally in your browser. No meditation recording is uploaded, and nothing here is added to Progress or Wellbeing.</p></details>
      </div>

      <div class="wellness-boost-active-player">
        <div class="wellness-boost-player-time" data-wb-time>${formatClock(item.durationMinutes * 60)}</div>
        <div class="wellness-boost-time-label">remaining</div>
        <div class="wellness-boost-progress" data-wb-progress-track role="progressbar" aria-label="Meditation progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-wb-progress></span></div>
        <p class="wellness-boost-player-status" data-wb-status role="status" aria-live="polite">In progress.</p>
        <div class="wellness-boost-player-controls">
          <button type="button" class="gc-button gc-button--primary" data-wb-toggle disabled>Pause</button>
          <button type="button" class="gc-button gc-button--secondary" data-wb-end disabled>End</button>
        </div>
      </div>

      <details class="wellness-boost-script"><summary>Read guidance</summary><ol>${item.cues.map((cue) => `<li><span>${formatClock(cue.atSeconds)}</span><p>${escapeHtml(cue.text)}</p></li>`).join('')}</ol></details>
    </section>
  </div>`;
}

function renderView() {
  const item = boostContent.find((entry) => entry.id === activePracticeId);
  return item ? renderPlayer(item) : renderLibrary();
}

function bindView({ root, rerender } = {}) {
  if (!root) return;
  const item = boostContent.find((entry) => entry.id === activePracticeId);

  root.querySelectorAll('[data-wb-open]').forEach((button) => {
    button.addEventListener('click', () => {
      activePracticeId = button.dataset.wbOpen;
      selectedMode = 'voice';
      void rerender?.();
    });
  });
  root.querySelector('[data-wb-back]')?.addEventListener('click', () => {
    stopSession({ root, quiet: true });
    activePracticeId = null;
    void rerender?.();
  });
  root.querySelectorAll('[data-wb-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      if (session) return;
      selectedMode = button.dataset.wbMode;
      void rerender?.();
    });
  });
  if (item) {
    root.querySelector('[data-wb-start]')?.addEventListener('click', () => startSession(root, item, selectedMode));
    root.querySelector('[data-wb-toggle]')?.addEventListener('click', () => toggleSession(root));
    root.querySelector('[data-wb-end]')?.addEventListener('click', () => stopSession({ root }));
  }
}

function deactivate() {
  stopSession({ quiet: true });
  activePracticeId = null;
}

export const wellnessBoostModule = Object.freeze({
  id: 'wellness-boost',
  contractVersion: 1,
  dependsOn: Object.freeze([]),
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([]),
  renderView,
  bindView,
  deactivate
});
