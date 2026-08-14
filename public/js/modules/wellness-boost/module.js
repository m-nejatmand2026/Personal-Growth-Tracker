import { escapeHtml } from '../../core/dom.js';
import { boostContent, boostTypes } from './content.js';

const DURATIONS = Object.freeze(['all', 3, 5, 10, 20]);
const MODES = Object.freeze([
  Object.freeze({ id: 'voice', label: 'Guided voice', detail: 'Uses your device voice' }),
  Object.freeze({ id: 'ambient', label: 'Ambient', detail: 'Locally generated tone' }),
  Object.freeze({ id: 'both', label: 'Both', detail: 'Voice + ambient' })
]);

let selectedDuration = 'all';
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

function paintProgress(root, item, elapsedSeconds = 0) {
  const total = item.durationMinutes * 60;
  const safeElapsed = Math.min(total, Math.max(0, elapsedSeconds));
  const percent = total ? (safeElapsed / total) * 100 : 0;
  const progress = root?.querySelector('[data-wb-progress]');
  const timer = root?.querySelector('[data-wb-time]');
  if (progress) progress.style.width = `${percent}%`;
  if (timer) timer.textContent = `${formatClock(safeElapsed)} / ${formatClock(total)}`;
}

function resetPlayerControls(root) {
  const start = root?.querySelector('[data-wb-start]');
  const toggle = root?.querySelector('[data-wb-toggle]');
  const end = root?.querySelector('[data-wb-end]');
  if (start) start.disabled = false;
  if (toggle) { toggle.disabled = true; toggle.textContent = 'Pause'; }
  if (end) end.disabled = true;
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
    setPlayerStatus(root, completed
      ? 'Session complete. Nothing was added to Progress.'
      : 'Session ended. Nothing was added to Progress.');
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
  stopSession({ quiet: true });

  const wantsVoice = mode === 'voice' || mode === 'both';
  const wantsAmbient = mode === 'ambient' || mode === 'both';
  const hasVoice = !wantsVoice || voiceAvailable();
  const ambient = wantsAmbient ? createAmbient() : null;
  const hasAmbient = !wantsAmbient || Boolean(ambient);

  if (!hasVoice && !hasAmbient) {
    setPlayerStatus(root, 'This device cannot start the selected playback mode. Try another option.');
    return;
  }
  if (mode === 'voice' && !hasVoice) {
    setPlayerStatus(root, 'Guided voice is not available on this device. Choose Ambient instead.');
    return;
  }
  if (mode === 'ambient' && !hasAmbient) {
    setPlayerStatus(root, 'Ambient playback is not available on this device. Choose Guided voice instead.');
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

  const unavailable = [];
  if (wantsVoice && !hasVoice) unavailable.push('guided voice');
  if (wantsAmbient && !hasAmbient) unavailable.push('ambient sound');
  setPlayerStatus(root, unavailable.length
    ? `Session started without ${unavailable.join(' and ')}.`
    : 'Session in progress. You can pause or end at any time.');

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
    setPlayerStatus(root, 'Session in progress.');
  }
}

function renderDurationFilters() {
  return `<div class="wellness-boost-filter" role="group" aria-label="Meditation duration">
    ${DURATIONS.map((duration) => {
      const active = String(duration) === String(selectedDuration);
      const label = duration === 'all' ? 'All' : `${duration} min`;
      return `<button type="button" data-wb-duration="${escapeHtml(String(duration))}" aria-pressed="${active}">${escapeHtml(label)}</button>`;
    }).join('')}
  </div>`;
}

function renderPracticeCard(item) {
  return `<article class="wellness-boost-card">
    <div class="wellness-boost-card-head"><div><span class="wellness-boost-category">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3></div><span class="wellness-boost-duration" aria-label="Duration ${item.durationMinutes} minutes">${item.durationMinutes} min</span></div>
    <p>${escapeHtml(item.description)}</p>
    <div class="wellness-boost-modes" aria-label="Playback options">Guided voice · Ambient · Both</div>
    <button type="button" class="gc-button gc-button--secondary wellness-boost-open" data-wb-open="${escapeHtml(item.id)}">Open practice</button>
  </article>`;
}

function renderLibrary() {
  const type = boostTypes.meditation;
  const items = boostContent.filter((item) => selectedDuration === 'all' || item.durationMinutes === Number(selectedDuration));
  return `<div class="wellness-boost-view" data-module="wellness-boost">
    <section class="wellness-boost-hero" aria-labelledby="wellnessBoostTitle">
      <p class="eyebrow">Wellness Boost</p>
      <h2 id="wellnessBoostTitle">Choose a small reset that fits the moment</h2>
      <p>Meditation is the first practice library. Future Wellness Boost types can live here without changing Progress or wellbeing history.</p>
    </section>
    <section class="os-section wellness-boost-type" aria-labelledby="wellnessBoostMeditationTitle">
      <div class="os-section-head wellness-boost-library-head"><div><span class="section-kicker">Practice</span><h2 id="wellnessBoostMeditationTitle">${escapeHtml(type.label)}</h2><small>${escapeHtml(type.description)}</small></div>${renderDurationFilters()}</div>
      <div class="wellness-boost-grid">${items.map(renderPracticeCard).join('')}</div>
    </section>
  </div>`;
}

function renderModePicker(item) {
  return `<div class="wellness-boost-mode-picker" role="group" aria-label="Playback style">
    ${MODES.filter((mode) => item.availableModes.includes(mode.id)).map((mode) => `<button type="button" data-wb-mode="${mode.id}" aria-pressed="${mode.id === selectedMode}"><strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.detail)}</span></button>`).join('')}
  </div>`;
}

function renderPlayer(item) {
  return `<div class="wellness-boost-view wellness-boost-player-view" data-module="wellness-boost">
    <button type="button" class="wellness-boost-back" data-wb-back>← Back to Meditation</button>
    <section class="wellness-boost-player" aria-labelledby="wellnessBoostPlayerTitle">
      <div class="wellness-boost-player-copy"><span class="wellness-boost-category">Meditation · ${escapeHtml(item.category)}</span><h2 id="wellnessBoostPlayerTitle">${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p></div>
      <span class="wellness-boost-duration wellness-boost-player-duration">${item.durationMinutes} min</span>
      ${renderModePicker(item)}
      <p class="wellness-boost-privacy">Guided voice uses your device’s built-in speech voice. Ambient sound is generated locally in your browser. No meditation recording is uploaded.</p>
      <div class="wellness-boost-progress" aria-hidden="true"><span data-wb-progress></span></div>
      <div class="wellness-boost-player-time" data-wb-time>${formatClock(0)} / ${formatClock(item.durationMinutes * 60)}</div>
      <p class="wellness-boost-player-status" data-wb-status role="status" aria-live="polite">Ready when you are. Nothing here creates Progress or a streak.</p>
      <div class="wellness-boost-player-controls">
        <button type="button" class="gc-button gc-button--primary" data-wb-start>Start meditation</button>
        <button type="button" class="gc-button gc-button--secondary" data-wb-toggle disabled>Pause</button>
        <button type="button" class="gc-button gc-button--secondary" data-wb-end disabled>End</button>
      </div>
      <details class="wellness-boost-script"><summary>Read the guidance</summary><ol>${item.cues.map((cue) => `<li><span>${formatClock(cue.atSeconds)}</span><p>${escapeHtml(cue.text)}</p></li>`).join('')}</ol></details>
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

  root.querySelectorAll('[data-wb-duration]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedDuration = button.dataset.wbDuration === 'all' ? 'all' : Number(button.dataset.wbDuration);
      void rerender?.();
    });
  });
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
