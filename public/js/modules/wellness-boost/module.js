import { escapeHtml } from '../../core/dom.js';
import { boostContent, boostTypes } from './content.js';

function audioLabel(kind) {
  return { voice: 'Guided voice', music: 'Music / ambient', both: 'Voice + ambient' }[kind] || 'Audio';
}

function renderTracks(item) {
  if (!item.tracks.length) {
    return '<p class="wellness-boost-coming">Audio coming soon — no unlicensed recording has been added.</p>';
  }

  return item.tracks.map((track) => `<div class="wellness-boost-track">
    <span>${escapeHtml(track.label)}${track.placeholder ? ' · rights-safe placeholder' : ''}</span>
    <audio controls preload="metadata" aria-label="Play ${escapeHtml(item.title)} — ${escapeHtml(track.label)}">
      <source src="${escapeHtml(track.src)}" type="${escapeHtml(track.mimeType)}">
      Your browser does not support audio playback.
    </audio>
  </div>`).join('');
}

function renderItem(item) {
  const type = boostTypes[item.boostType];
  return `<article class="wellness-boost-card" data-boost-type="${escapeHtml(item.boostType)}">
    <div class="wellness-boost-card-head"><div><span class="wellness-boost-category">${escapeHtml(type?.label || item.boostType)} · ${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3></div><span class="wellness-boost-duration" aria-label="Duration ${item.durationMinutes} minutes">${item.durationMinutes} min</span></div>
    ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
    <div class="wellness-boost-audio-kind"><span aria-hidden="true">♫</span> ${escapeHtml(audioLabel(item.audioKind))}</div>
    ${renderTracks(item)}
  </article>`;
}

export const wellnessBoostModule = Object.freeze({
  id: 'wellness-boost',
  contractVersion: 1,
  dependsOn: Object.freeze([]),
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([{ name: 'today-boost', order: 45 }]),

  renderSlot({ slot } = {}) {
    if (slot !== 'today-boost') return '';
    return `<section class="os-section wellness-boost-section" data-module="wellness-boost" aria-labelledby="wellnessBoostTitle">
      <div class="os-section-head"><div><span class="section-kicker">Optional pause</span><h2 id="wellnessBoostTitle">Wellness Boost</h2><small>Choose something that fits the moment. This is separate from your wellbeing observations.</small></div></div>
      <div class="wellness-boost-grid">${boostContent.map(renderItem).join('')}</div>
    </section>`;
  }
});
