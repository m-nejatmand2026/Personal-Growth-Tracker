import { escapeHtml } from '../../core/dom.js';
import { boostContent } from './content.js';
import { createMeditationPlayer, formatMeditationClock } from './player.js';

const MODES = Object.freeze([
  Object.freeze({ id: 'voice', label: 'Guided' }),
  Object.freeze({ id: 'ambient', label: 'Ambient' }),
  Object.freeze({ id: 'both', label: 'Both' })
]);

const TONES = Object.freeze({ Reset: 'reset', Calm: 'calm', Focus: 'focus', Restore: 'restore' });
const FEATURED_PRACTICE_ID = 'meditation-steadier-breath';
const player = createMeditationPlayer();
let activePracticeId = null;
let selectedMode = 'voice';

function toneFor(item) { return TONES[item.category] || 'calm'; }
function renderFeaturedPractice(item) {
  return `<button type="button" class="wellness-boost-featured gc-feature-card gc-tone--${toneFor(item)}" data-wb-open="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.title)}, ${item.durationMinutes} minutes, ${escapeHtml(item.category)}"><span class="gc-feature-card__copy"><span class="gc-feature-card__meta">Featured · ${escapeHtml(item.category)}</span><strong class="gc-feature-card__title">${escapeHtml(item.title)}</strong><span class="gc-feature-card__summary">${escapeHtml(item.summary)}</span><span class="gc-feature-card__action">${item.durationMinutes} min <span aria-hidden="true">→</span></span></span><span class="gc-feature-card__visual" aria-hidden="true">${escapeHtml(item.icon)}</span></button>`;
}
function renderPracticeRow(item) {
  return `<button type="button" class="wellness-boost-row gc-choice-row gc-tone--${toneFor(item)}" data-wb-open="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.title)}, ${item.durationMinutes} minutes, ${escapeHtml(item.category)}"><span class="gc-choice-row__icon" aria-hidden="true">${escapeHtml(item.icon)}</span><span class="gc-choice-row__copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.summary)}</span><small>${item.durationMinutes} Min</small></span><span class="gc-choice-row__arrow" aria-hidden="true">▶</span></button>`;
}
function renderLibrary() {
  const featured = boostContent.find((item) => item.id === FEATURED_PRACTICE_ID) || boostContent[0];
  const more = boostContent.filter((item) => item.id !== featured.id);
  return `<div class="wellness-boost-view wellness-boost-library-view gc-page-frame gc-page-flow" data-module="wellness-boost" aria-labelledby="wellnessCurrentTitle">
    <header class="wellness-current-header"><h2 id="wellnessCurrentTitle">Wellness</h2><p>A quieter space to reset, focus, or restore.</p></header>
    <section class="living-wellness-hero" aria-labelledby="wellnessBoostMeditationTitle"><span class="living-sanctuary-label">Your sanctuary</span><h3 id="wellnessBoostMeditationTitle">Find your center</h3><p>Follow a steady rhythm and let the next few minutes be enough.</p><div class="living-breathing-orb" aria-label="Breathing guide"><i></i><span>Breathe</span></div></section>
    <section class="wellness-boost-more" aria-labelledby="wellnessBoostMoreTitle"><h3 class="gc-section-heading" id="wellnessBoostMoreTitle">Immersive sessions</h3><p>Choose the state you need now.</p><div class="gc-choice-list">${renderFeaturedPractice(featured)}${more.map(renderPracticeRow).join('')}</div></section>
  </div>`;
}
function renderModePicker(item) {
  return `<div class="wellness-boost-mode-picker" role="group" aria-label="Playback style">${MODES.filter((mode) => item.availableModes.includes(mode.id)).map((mode) => `<button type="button" data-wb-mode="${mode.id}" aria-pressed="${mode.id === selectedMode}"><strong>${escapeHtml(mode.label)}</strong></button>`).join('')}</div>`;
}
function renderPlayer(item) {
  return `<div class="wellness-boost-view wellness-boost-player-view gc-page-frame" data-module="wellness-boost" aria-label="Wellness"><button type="button" class="wellness-boost-back" data-wb-back>← Wellness</button><section class="wellness-boost-player" aria-labelledby="wellnessBoostPlayerTitle"><div class="wellness-boost-player-copy"><span class="wellness-boost-category">${escapeHtml(item.category)}</span><div class="wellness-boost-player-title"><h2 id="wellnessBoostPlayerTitle">${escapeHtml(item.title)}</h2><span class="wellness-boost-duration">${item.durationMinutes} min</span></div><p>${escapeHtml(item.description)}</p></div><div class="wellness-boost-prestart"><h3>How would you like to listen?</h3>${renderModePicker(item)}<button type="button" class="gc-button gc-button--primary wellness-boost-start" data-wb-start aria-label="Start meditation">Start session</button><p class="wellness-boost-ready-status" data-wb-ready-status role="status" aria-live="polite">Ready when you are.</p><details class="wellness-boost-audio-note"><summary>About audio</summary><p>Guided uses your device’s built-in speech voice. Ambient sound is generated locally in your browser. No meditation recording is uploaded, and nothing here is added to Progress or Wellbeing.</p></details></div><div class="wellness-boost-active-player"><div class="wellness-boost-player-time" data-wb-time>${formatMeditationClock(item.durationMinutes * 60)}</div><div class="wellness-boost-time-label">remaining</div><div class="wellness-boost-progress" data-wb-progress-track role="progressbar" aria-label="Meditation progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-wb-progress></span></div><p class="wellness-boost-player-status" data-wb-status role="status" aria-live="polite">In progress.</p><div class="wellness-boost-player-controls"><button type="button" class="gc-button gc-button--primary" data-wb-toggle disabled>Pause</button><button type="button" class="gc-button gc-button--secondary" data-wb-end disabled>End</button></div></div><details class="wellness-boost-script"><summary>Read guidance</summary><ol>${item.cues.map((cue) => `<li><span>${formatMeditationClock(cue.atSeconds)}</span><p>${escapeHtml(cue.text)}</p></li>`).join('')}</ol></details></section></div>`;
}
function renderView() { const item = boostContent.find((entry) => entry.id === activePracticeId); return item ? renderPlayer(item) : renderLibrary(); }
function bindView({ root, rerender } = {}) {
  if (!root) return;
  const item = boostContent.find((entry) => entry.id === activePracticeId);
  root.querySelectorAll('[data-wb-open]').forEach((button) => button.addEventListener('click', () => { activePracticeId = button.dataset.wbOpen; selectedMode = 'voice'; void rerender?.(); }));
  root.querySelector('[data-wb-back]')?.addEventListener('click', () => { player.stop({ root, quiet: true, item }); activePracticeId = null; void rerender?.(); });
  root.querySelectorAll('[data-wb-mode]').forEach((button) => button.addEventListener('click', () => { if (player.isActive()) return; selectedMode = button.dataset.wbMode; void rerender?.(); }));
  if (item) { root.querySelector('[data-wb-start]')?.addEventListener('click', () => player.start(root, item, selectedMode)); root.querySelector('[data-wb-toggle]')?.addEventListener('click', () => player.toggle(root)); root.querySelector('[data-wb-end]')?.addEventListener('click', () => player.stop({ root, item })); }
}
function deactivate() { player.stop({ quiet: true }); activePracticeId = null; }
export const wellnessBoostModule = Object.freeze({ id: 'wellness-boost', contractVersion: 1, dependsOn: Object.freeze([]), defaultEnabled: true, publishes: Object.freeze([]), subscribes: Object.freeze([]), slots: Object.freeze([]), renderView, bindView, deactivate });
