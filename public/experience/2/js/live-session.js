import { api } from './core/api.js';

const host = document.querySelector('#activeSessionHost');
let current = null;
let additionalCount = 0;
let timer = 0;
let refreshTimer = 0;
let refreshInFlight = false;
let completing = false;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function elapsedSeconds(item = current) {
  const started = new Date(item?.started_at || '').getTime();
  return Number.isFinite(started) ? Math.max(0, Math.floor((Date.now() - started) / 1000)) : 0;
}

function elapsedMinutes(item = current) {
  return Math.max(1, Math.round(elapsedSeconds(item) / 60));
}

function clock(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const rest = value % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function completionOpen() {
  return document.body.classList.contains('gc-live-completion-open');
}

function stopClock() {
  if (timer) window.clearInterval(timer);
  timer = 0;
}

function tick() {
  const node = host?.querySelector('[data-live-elapsed]');
  if (node && current) node.textContent = clock(elapsedSeconds(current));
}

function startClock() {
  stopClock();
  if (!current || completionOpen()) return;
  tick();
  timer = window.setInterval(tick, 1000);
}

function chooseSession(items = []) {
  const active = items.filter(item => item.status === 'in_progress');
  active.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime() || Number(b.id) - Number(a.id));
  return { current: active[0] || null, additionalCount: Math.max(0, active.length - 1) };
}

function render() {
  stopClock();
  if (!host) return;
  if (!current) {
    host.innerHTML = '';
    document.body.classList.remove('gc-live-session-active');
    return;
  }
  const meta = [current.activity_label && current.activity_label !== current.title ? current.activity_label : '', current.planned_minutes ? `${Number(current.planned_minutes)} min planned` : '', additionalCount ? `+${additionalCount} also in progress` : ''].filter(Boolean).join(' · ');
  host.innerHTML = `<aside class="gc-live-session" aria-label="Active session" data-live-session-id="${Number(current.id)}"><span class="gc-live-marker" aria-hidden="true"></span><div class="gc-live-copy"><small>In progress</small><strong>${escapeHtml(current.title || current.activity_label || 'Current action')}</strong>${meta ? `<span>${escapeHtml(meta)}</span>` : ''}</div><time data-live-elapsed aria-label="Elapsed time">${clock(elapsedSeconds(current))}</time><div class="gc-live-actions"><button type="button" class="gc-live-change" data-live-change>Plans changed?</button><button type="button" class="gc-live-done" data-live-done>Done</button></div></aside>`;
  host.querySelector('[data-live-change]')?.addEventListener('click', plansChanged);
  host.querySelector('[data-live-done]')?.addEventListener('click', openCompletion);
  document.body.classList.add('gc-live-session-active');
  startClock();
}

async function refresh() {
  if (refreshInFlight || !host || completionOpen()) return;
  refreshInFlight = true;
  try {
    const response = await api.get(`/v1/daily-plan?date=${encodeURIComponent(todayKey())}`);
    const next = chooseSession(response.items || []);
    const changed = Number(next.current?.id || 0) !== Number(current?.id || 0) || next.additionalCount !== additionalCount || next.current?.started_at !== current?.started_at;
    current = next.current;
    additionalCount = next.additionalCount;
    if (changed) render(); else tick();
  } catch {
    // Keep the current surface through transient navigation/network errors.
  } finally {
    refreshInFlight = false;
  }
}

function scheduleRefresh(delay = 80) {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => void refresh(), delay);
}

async function plansChanged() {
  if (!current) return;
  const id = Number(current.id);
  if (typeof window.__gcExperience2Navigate === 'function') window.__gcExperience2Navigate('today');
  else document.dispatchEvent(new CustomEvent('gc:navigate-view', { detail: { view: 'today' } }));
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    const button = document.querySelector(`[data-today-change="${id}"]`);
    if (button) {
      button.click();
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

function closeCompletion(opener) {
  const overlay = document.querySelector('#overlayHost');
  if (!overlay) return;
  overlay.onkeydown = null;
  overlay.innerHTML = '';
  document.body.classList.remove('gc-live-completion-open');
  completing = false;
  startClock();
  scheduleRefresh(0);
  opener?.focus?.({ preventScroll: true });
}

async function existingProgressForSession(item) {
  if (!item?.activity_key || !item?.started_at) return null;
  const date = item.planned_for || todayKey();
  const response = await api.get(`/v1/progress?from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}&limit=100`);
  return (response.items || []).find(progress => String(progress.activity_key || '') === String(item.activity_key) && String(progress.started_at || '') === String(item.started_at)) || null;
}

async function finishSession(item, minutes, note, statusNode, saveButton) {
  if (completing) return;
  completing = true;
  saveButton.disabled = true;
  try {
    let progress = null;
    if (item.activity_key) {
      progress = await existingProgressForSession(item).catch(() => null);
      if (!progress) {
        const response = await api.post('/v1/progress', {
          occurred_on: item.planned_for || todayKey(),
          started_at: item.started_at || null,
          activity_key: item.activity_key,
          minutes,
          subtype: item.subtype || null,
          note: note || item.note || null
        });
        progress = response.item || null;
      }
    }
    await api.put(`/v1/daily-plan/${Number(item.id)}`, { status: 'completed' });
    const overlay = document.querySelector('#overlayHost');
    if (overlay) {
      overlay.onkeydown = null;
      overlay.innerHTML = '';
    }
    document.body.classList.remove('gc-live-completion-open');
    completing = false;
    current = null;
    render();
    scheduleRefresh(0);
    document.dispatchEvent(new CustomEvent('gc:session-completed', { detail: { dailyPlanId: Number(item.id), progressId: progress?.id || null } }));
  } catch (error) {
    completing = false;
    saveButton.disabled = false;
    statusNode.textContent = error.message || 'Could not finish this session.';
  }
}

function openCompletion() {
  if (!current) return;
  const item = { ...current };
  const overlay = document.querySelector('#overlayHost');
  if (!overlay) return;
  const opener = document.activeElement;
  const actual = elapsedMinutes(item);
  stopClock();
  overlay.innerHTML = `<div class="gc-live-completion-backdrop" data-live-completion-close><section class="gc-live-completion" role="dialog" aria-modal="true" aria-labelledby="gcLiveCompletionTitle"><header><div><p class="eyebrow">Factual completion</p><h2 id="gcLiveCompletionTitle">What actually happened?</h2><p>${escapeHtml(item.title || item.activity_label || 'Current action')}</p></div><button type="button" data-live-completion-close aria-label="Close completion">×</button></header>${item.activity_key ? `<form data-live-completion-form><div class="gc-live-completion-fact"><span>Started</span><strong>${escapeHtml(new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</strong><span>Elapsed now</span><strong>${escapeHtml(clock(elapsedSeconds(item)))}</strong></div><label><span>Actual duration</span><div><input type="number" min="1" max="1440" name="minutes" value="${actual}" required><b>min</b></div><small>Prefilled from the real session start. Change it only if the factual duration differs.</small></label><label><span>Note <small>optional</small></span><textarea name="note" maxlength="500" placeholder="Anything worth remembering?">${escapeHtml(item.note || '')}</textarea></label><p class="gc-live-boundary">Saving creates factual Progress once, then closes this in-progress Plan item.</p><button type="submit" class="primary-button" data-live-completion-save>Save factual Progress</button><p class="gc-live-completion-status" role="alert"></p></form>` : `<div class="gc-live-one-off"><p>This one-off Plan item has no reusable Activity, so finishing it closes the plan without inventing Progress.</p><button type="button" class="primary-button" data-live-one-off-finish>Mark complete</button><p class="gc-live-completion-status" role="alert"></p></div>`}</section></div>`;
  document.body.classList.add('gc-live-completion-open');
  const dialog = overlay.querySelector('.gc-live-completion');
  const close = () => closeCompletion(opener);
  overlay.querySelectorAll('[data-live-completion-close]').forEach(node => node.addEventListener('click', event => {
    if (event.target === node || node.matches('button')) close();
  }));
  dialog?.addEventListener('click', event => event.stopPropagation());
  overlay.onkeydown = event => {
    if (event.key === 'Escape' && !completing) {
      event.preventDefault();
      close();
    }
  };
  overlay.querySelector('[data-live-completion-form]')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const minutes = Math.round(Number(data.get('minutes')));
    const status = overlay.querySelector('.gc-live-completion-status');
    const save = overlay.querySelector('[data-live-completion-save]');
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      status.textContent = 'Actual duration must be 1–1440 minutes.';
      return;
    }
    void finishSession(item, minutes, String(data.get('note') || '').trim(), status, save);
  });
  overlay.querySelector('[data-live-one-off-finish]')?.addEventListener('click', event => {
    const status = overlay.querySelector('.gc-live-completion-status');
    void finishSession(item, actual, '', status, event.currentTarget);
  });
  requestAnimationFrame(() => overlay.querySelector('input[name="minutes"], [data-live-one-off-finish]')?.focus());
}

if (host) {
  const observer = new MutationObserver(() => scheduleRefresh());
  const app = document.querySelector('#experience2App');
  const overlay = document.querySelector('#overlayHost');
  if (app) observer.observe(app, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-current-view'] });
  if (overlay) observer.observe(overlay, { subtree: true, childList: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRefresh(0); });
  window.addEventListener('focus', () => scheduleRefresh(0));
  window.setInterval(() => scheduleRefresh(0), 15_000);
  scheduleRefresh(0);
}
