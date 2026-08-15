import { $ } from '../core/dom.js';

export function renderSettings() {
  const root = $('#settingsView');
  if (!root) return;

  const row = (icon, title, detail = '', action = '') => `<div class="living-settings-row"><span aria-hidden="true">${icon}</span><div><strong>${title}</strong>${detail ? `<small>${detail}</small>` : ''}</div>${action || '<b aria-hidden="true">›</b>'}</div>`;
  root.innerHTML = `<header class="settings-current-header"><h2>Settings</h2><p>Profile, experience, and data ownership.</p></header>
    <section class="living-profile">
      <p class="gc-sr-only">Goals, minimums and targets are managed in Plan.</p>
      <div class="living-profile-avatar">GC<span aria-hidden="true">✎</span></div>
      <h3>Your Profile</h3><p>Growth Compass member</p>
    </section>
    <section class="living-settings-group"><h3>Account</h3><div class="living-settings-card">${row('♙','Personal info','Name and profile details')}${row('▣','Security','Private Beta access')}${row('▤','Subscriptions','Not active in Beta')}</div></section>
    <section class="living-settings-group"><h3>Experience</h3><div class="living-settings-card">${row('◉','Theme','Living Canvas · Mint')}${row('♢','Notifications','Manage reminders later')}${row('◎','Language','English')}</div></section>
    <section class="living-settings-group"><h3>Data ownership</h3><div class="living-settings-card">${row('⇩','Export everything','Download all records as JSON','<a href="/api/export" target="_blank" rel="noopener" aria-label="Export everything">↗</a>')}</div><aside class="settings-plan-note"><strong>Planning settings live in Plan</strong><p>Goals, minimums and targets are not account settings.</p></aside></section>`;
}
