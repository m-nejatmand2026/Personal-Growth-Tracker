import { $ } from '../core/dom.js';

export function renderSettings() {
  const root = $('#settingsView');
  if (!root) return;

  const row = (icon, title, detail = '', action = '') => `<div class="living-settings-row"><span aria-hidden="true">${icon}</span><div><strong>${title}</strong>${detail ? `<small>${detail}</small>` : ''}</div>${action || '<b aria-hidden="true">›</b>'}</div>`;
  root.innerHTML = `<section class="living-profile">
      <p class="gc-sr-only">Goals, Minimums and Targets are managed in Plan.</p>
      <div class="living-profile-avatar">GC<span aria-hidden="true">✎</span></div>
      <h2>Your Profile</h2><p>Growth Compass member</p>
    </section>
    <section class="living-settings-group"><h3>Account</h3><div class="living-settings-card">${row('♙','Personal Info')}${row('▣','Security')}${row('▤','Subscriptions')}</div></section>
    <section class="living-settings-group"><h3>Experience</h3><div class="living-settings-card">${row('◉','Theme','Living Canvas')}${row('♢','Notifications')}${row('◎','Language','English')}</div></section>
    <section class="living-settings-group"><h3>Data ownership</h3><div class="living-settings-card">${row('⇩','Export everything','Download all records as JSON','<a href="/api/export" target="_blank" rel="noopener" aria-label="Export everything">↗</a>')}</div></section>`;
}
