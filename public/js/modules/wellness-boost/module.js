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

function renderType(typeId, type) {
  const items = boostContent.filter((item) => item.boostType === typeId);
  if (!items.length) return '';
  return `<section class="os-section wellness-boost-type" aria-labelledby="wellnessBoostType-${escapeHtml(typeId)}">
    <div class="os-section-head"><div><span class="section-kicker">Practice</span><h2 id="wellnessBoostType-${escapeHtml(typeId)}">${escapeHtml(type.label)}</h2><small>${escapeHtml(type.description || '')}</small></div></div>
    <div class="wellness-boost-grid">${items.map(renderItem).join('')}</div>
  </section>`;
}

export const wellnessBoostModule = Object.freeze({
  id: 'wellness-boost',
  contractVersion: 1,
  dependsOn: Object.freeze([]),
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([]),

  renderView() {
    const groups = Object.entries(boostTypes).map(([typeId, type]) => renderType(typeId, type)).join('');
    return `<div class="wellness-boost-view" data-module="wellness-boost">
      <section class="wellness-boost-hero" aria-labelledby="wellnessBoostTitle">
        <p class="eyebrow">Wellness Boost</p>
        <h2 id="wellnessBoostTitle">Choose a small reset that fits the moment</h2>
        <p>Meditation is the first Wellness Boost practice. More optional practices can be added here later without changing your Progress or wellbeing history.</p>
      </section>
      ${groups || '<section class="os-section"><div class="empty">No Wellness Boost practices are available yet.</div></section>'}
    </div>`;
  }
});
