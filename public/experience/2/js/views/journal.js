import { journalCapability } from '../capabilities/journal.js';

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

function normalizeFilters(input = {}) {
  if (typeof input === 'string') return { query: input.trim(), date: '' };
  return {
    query: String(input?.query || '').trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(input?.date || '')) ? String(input.date) : ''
  };
}

function tagsOf(item) {
  try {
    return Array.isArray(item.tags) ? item.tags : JSON.parse(item.tags_json || '[]');
  } catch {
    return [];
  }
}

function typeLabel(type) {
  return ({ free: 'Free entry', morning: 'Morning', evening: 'Evening', reflection: 'Reflection' })[type] || 'Entry';
}

function entryBody(item) {
  const tags = tagsOf(item);
  return `<div class="journal-entry-meta"><span>${escapeHtml(item.occurred_on)}</span><span>${escapeHtml(typeLabel(item.entry_type))}</span></div><h3>${escapeHtml(item.title || 'Untitled reflection')}</h3><p>${escapeHtml(item.body)}</p>${tags.length ? `<div class="journal-tags">${tags.map(tag => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>` : ''}`;
}

function entryHtml(item) {
  return `<article class="journal-entry" data-journal-entry="${item.id}">${entryBody(item)}<div class="journal-entry-actions"><button type="button" class="ghost-button compact" data-journal-edit="${item.id}">Edit</button><button type="button" class="ghost-button compact" data-journal-archive="${item.id}">Archive</button></div></article>`;
}

function archivedEntryHtml(item) {
  return `<article class="journal-entry journal-entry-archived" data-journal-archived-entry="${item.id}">${entryBody(item)}<div class="journal-entry-actions"><button type="button" class="ghost-button compact" data-journal-restore="${item.id}">Restore</button><button type="button" class="danger-button compact" data-journal-remove="${item.id}">Remove permanently</button></div></article>`;
}

function emptyHtml(filters) {
  const filtered = Boolean(filters.query || filters.date);
  return `<div class="journal-empty"><strong>${filtered ? 'No matching active entries.' : 'Your journal is empty.'}</strong><span>${filtered ? 'Change or clear the filters. Archived matches, if any, are shown below.' : 'Write one sentence or go deeper. There is no streak and no score.'}</span></div>`;
}

export async function loadJournal(filters = {}) {
  const normalized = normalizeFilters(filters);
  const shared = {
    q: normalized.query,
    from: normalized.date || '',
    to: normalized.date || '',
    limit: 100
  };
  const [activeResponse, archivedResponse] = await Promise.all([
    journalCapability.list(shared),
    journalCapability.list({ ...shared, archivedOnly: true })
  ]);
  return {
    filters: normalized,
    query: normalized.query,
    date: normalized.date,
    items: activeResponse.items || [],
    archived: archivedResponse.items || []
  };
}

export function renderJournal(model) {
  const filters = normalizeFilters(model.filters || { query: model.query, date: model.date });
  const hasFilters = Boolean(filters.query || filters.date);
  return `<div class="journal-view"><section class="journal-hero living-surface"><div><p class="eyebrow">Private reflection</p><h2>Journal</h2><p>Write first. Prompts, tags, and structure stay optional.</p></div><button type="button" class="primary-button" data-journal-new>New entry</button></section><form class="journal-tools static-surface" data-journal-filter><label class="journal-search-field"><span>Search your entries</span><input type="search" id="journalSearch" value="${escapeHtml(filters.query)}" placeholder="Search words or phrases"></label><label class="journal-date-field"><span>Date</span><input type="date" id="journalDateFilter" value="${escapeHtml(filters.date)}" aria-label="Filter journal by date"></label><button type="submit" class="secondary-button" data-journal-search>Apply</button>${hasFilters ? '<button type="button" class="text-button journal-clear" data-journal-clear>Clear</button>' : ''}</form><section class="journal-list static-surface" aria-label="Active journal entries">${model.items.length ? model.items.map(entryHtml).join('') : emptyHtml(filters)}</section>${model.archived.length ? `<details class="journal-archive static-surface"><summary>Archived <span>${model.archived.length}</span></summary><p class="journal-archive-note">Archived reflections stay private and recoverable. Permanent removal is available only here.</p><div class="journal-archive-list">${model.archived.map(archivedEntryHtml).join('')}</div></details>` : ''}</div>`;
}

function editorHtml(item = {}) {
  const tags = tagsOf(item).join(', ');
  return `<div class="journal-editor-backdrop" data-journal-close><section class="journal-editor static-surface" role="dialog" aria-modal="true" aria-labelledby="journalEditorTitle" data-journal-dialog><header><div><p class="eyebrow">${item.id ? 'Edit reflection' : 'New reflection'}</p><h2 id="journalEditorTitle">Journal entry</h2></div><button type="button" class="journal-editor-close" data-journal-close aria-label="Close journal editor">×</button></header><form id="journalForm"><input type="hidden" name="id" value="${item.id || ''}"><div class="journal-form-row"><label><span>Date</span><input type="date" name="occurred_on" value="${escapeHtml(item.occurred_on || todayKey())}" required></label><label><span>Style</span><select name="entry_type"><option value="free"${item.entry_type === 'free' || !item.entry_type ? ' selected' : ''}>Free entry</option><option value="morning"${item.entry_type === 'morning' ? ' selected' : ''}>Morning</option><option value="evening"${item.entry_type === 'evening' ? ' selected' : ''}>Evening</option><option value="reflection"${item.entry_type === 'reflection' ? ' selected' : ''}>Reflection</option></select></label></div><label><span>Title <small>optional</small></span><input name="title" maxlength="120" value="${escapeHtml(item.title || '')}" placeholder="A short heading"></label><label><span>Write</span><textarea name="body" maxlength="20000" rows="10" required placeholder="One sentence is enough.">${escapeHtml(item.body || '')}</textarea></label><label><span>Tags <small>optional, comma separated</small></span><input name="tags" value="${escapeHtml(tags)}" placeholder="work, health, gratitude"></label><p class="journal-privacy">Journal entries remain private reflection. Saving one does not create Progress, Insights, or Wellbeing evidence.</p><div class="journal-form-actions"><button type="button" class="ghost-button" data-journal-close>Cancel</button><button type="submit" class="primary-button">Save entry</button></div><p class="journal-form-error" id="journalFormError" role="alert"></p></form></section></div>`;
}

function removeHtml(item) {
  return `<div class="journal-editor-backdrop" data-journal-close><section class="journal-editor journal-delete-dialog static-surface" role="dialog" aria-modal="true" aria-labelledby="journalDeleteTitle" data-journal-dialog><header><div><p class="eyebrow">Permanent removal</p><h2 id="journalDeleteTitle">Remove this journal entry permanently?</h2></div><button type="button" class="journal-editor-close" data-journal-close aria-label="Close removal dialog">×</button></header><div class="journal-delete-body"><p>“${escapeHtml(item.title || 'Untitled reflection')}” is already archived. Permanent removal cannot be undone. It does not create or change Progress, Insights, or Wellbeing evidence.</p><div class="journal-form-actions"><button type="button" class="secondary-button" data-journal-remove-cancel>Keep archived</button><button type="button" class="danger-button" data-journal-remove-confirm>Remove permanently</button></div><p class="journal-form-error" id="journalRemoveError" role="alert"></p></div></section></div>`;
}

function toast(message) {
  const host = document.querySelector('#toastHost');
  if (!host) return;
  host.innerHTML = `<div class="journal-toast static-surface">${escapeHtml(message)}</div>`;
  setTimeout(() => {
    if (host.textContent === message) host.innerHTML = '';
  }, 2400);
}

function mountModal(content, { initialFocus } = {}) {
  const host = document.querySelector('#overlayHost');
  if (!host) return null;
  const opener = document.activeElement;
  host.innerHTML = content;
  document.body.classList.add('journal-modal-open');
  const dialog = host.querySelector('[data-journal-dialog]');
  const close = () => {
    host.onkeydown = null;
    host.innerHTML = '';
    document.body.classList.remove('journal-modal-open');
    if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
  };
  host.querySelectorAll('[data-journal-close]').forEach(node => node.addEventListener('click', event => {
    if (event.target === node || node.matches('button')) close();
  }));
  dialog?.addEventListener('click', event => event.stopPropagation());
  host.onkeydown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = [...host.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(node => !node.hidden && node.offsetParent !== null);
    if (focusables.length < 2) return;
    const first = focusables[0], last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  requestAnimationFrame(() => host.querySelector(initialFocus || 'button,input,select,textarea')?.focus());
  return { host, close };
}

function replaceJournalView(model) {
  const current = document.querySelector('.journal-view');
  if (!current) return false;
  const template = document.createElement('template');
  template.innerHTML = renderJournal(model).trim();
  const next = template.content.firstElementChild;
  if (!next || !current.isConnected) return false;
  current.replaceWith(next);
  bindJournal(model);
  return true;
}

let journalRefreshVersion = 0;
function replaceJournalViewAfterMutation(model) {
  journalRefreshVersion += 1;
  return replaceJournalView(model);
}

async function refreshJournal(filters) {
  if (!document.querySelector('.journal-view')) return;
  const version = ++journalRefreshVersion;
  const model = await loadJournal(filters);
  if (version !== journalRefreshVersion || !document.querySelector('.journal-view')) return;
  replaceJournalView(model);
}

function removeArchivedEntryFromView(id) {
  const entry = document.querySelector(`[data-journal-archived-entry="${Number(id)}"]`);
  const archive = entry?.closest('.journal-archive');
  entry?.remove();
  if (!archive) return;
  const remaining = archive.querySelectorAll('[data-journal-archived-entry]').length;
  if (!remaining) {
    archive.remove();
    return;
  }
  const count = archive.querySelector('summary span');
  if (count) count.textContent = String(remaining);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRequestTimeout(operation, timeoutMs, timeoutMessage) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new Error(timeoutMessage);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function isPermanentlyRemoved(item) {
  const probe = String(item.title || item.body || '').slice(0, 120);
  return withRequestTimeout(async signal => {
    const response = await journalCapability.list({ archivedOnly: true, q: probe, limit: 100 }, { signal });
    return !(response.items || []).some(entry => Number(entry.id) === Number(item.id));
  }, 2000, 'Could not verify whether the journal entry was removed');
}

async function removePermanently(item) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await withRequestTimeout(
        signal => journalCapability.remove(item.id, { signal }),
        5000,
        'Journal removal request timed out'
      );
    } catch (error) {
      lastError = error;
      try {
        if (await isPermanentlyRemoved(item)) return { removed: true, reconciled: true };
      } catch {}
      if (attempt < 2) await sleep(120 * (attempt + 1));
    }
  }
  throw lastError || new Error('Could not permanently remove journal entry');
}

function openEditor(item, model) {
  const modal = mountModal(editorHtml(item), { initialFocus: 'textarea[name="body"]' });
  if (!modal) return;
  const { host, close } = modal;
  host.querySelector('#journalForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      occurred_on: String(form.get('occurred_on') || ''),
      title: String(form.get('title') || '').trim() || null,
      body: String(form.get('body') || '').trim(),
      entry_type: String(form.get('entry_type') || 'free'),
      tags: String(form.get('tags') || '').split(',').map(value => value.trim()).filter(Boolean)
    };
    const error = host.querySelector('#journalFormError');
    try {
      const id = Number(form.get('id') || 0);
      if (id) await journalCapability.update(id, payload);
      else await journalCapability.create(payload);
      close();
      toast(id ? 'Journal entry updated' : 'Journal entry saved');
      await refreshJournal(model.filters);
    } catch (err) {
      if (error) error.textContent = err.message || 'Could not save journal entry';
    }
  });
}

function openRemove(item, model) {
  const modal = mountModal(removeHtml(item), { initialFocus: '[data-journal-remove-cancel]' });
  if (!modal) return;
  const { host, close } = modal;
  host.querySelector('[data-journal-remove-cancel]')?.addEventListener('click', close);
  host.querySelector('[data-journal-remove-confirm]')?.addEventListener('click', async event => {
    const confirm = event.currentTarget;
    const cancel = host.querySelector('[data-journal-remove-cancel]');
    const dismiss = host.querySelector('.journal-editor-close');
    const errorNode = host.querySelector('#journalRemoveError');
    confirm.disabled = true;
    if (cancel) cancel.disabled = true;
    if (dismiss) dismiss.disabled = true;
    confirm.textContent = 'Removing…';
    if (errorNode) errorNode.textContent = '';
    try {
      await removePermanently(item);
      close();
      journalRefreshVersion += 1;
      removeArchivedEntryFromView(item.id);
      toast('Journal entry permanently removed');
    } catch (error) {
      confirm.disabled = false;
      if (cancel) cancel.disabled = false;
      if (dismiss) dismiss.disabled = false;
      confirm.textContent = 'Remove permanently';
      if (errorNode) errorNode.textContent = error.message || 'Could not remove journal entry';
    }
  });
}

export function bindJournal(model) {
  document.querySelector('[data-journal-new]')?.addEventListener('click', () => openEditor({}, model));
  document.querySelector('[data-journal-filter]')?.addEventListener('submit', event => {
    event.preventDefault();
    void refreshJournal({
      query: document.querySelector('#journalSearch')?.value.trim() || '',
      date: document.querySelector('#journalDateFilter')?.value || ''
    });
  });
  document.querySelector('[data-journal-clear]')?.addEventListener('click', () => void refreshJournal({ query: '', date: '' }));
  document.querySelectorAll('[data-journal-edit]').forEach(button => button.addEventListener('click', () => {
    const item = model.items.find(entry => entry.id === Number(button.dataset.journalEdit));
    if (item) openEditor(item, model);
  }));
  document.querySelectorAll('[data-journal-archive]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    const id = Number(button.dataset.journalArchive);
    try {
      const response = await journalCapability.archive(id);
      const archived = response?.item || model.items.find(entry => entry.id === id);
      if (archived) {
        const nextModel = {
          ...model,
          items: model.items.filter(entry => entry.id !== id),
          archived: [archived, ...model.archived.filter(entry => entry.id !== id)]
        };
        replaceJournalViewAfterMutation(nextModel);
      } else {
        await refreshJournal(model.filters);
      }
      toast('Journal entry archived');
    } catch (error) {
      button.disabled = false;
      toast(error.message || 'Could not archive journal entry');
    }
  }));
  document.querySelectorAll('[data-journal-restore]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    const id = Number(button.dataset.journalRestore);
    try {
      const response = await journalCapability.restore(id);
      const restored = response?.item || model.archived.find(entry => entry.id === id);
      if (restored) {
        const nextModel = {
          ...model,
          items: [restored, ...model.items.filter(entry => entry.id !== id)],
          archived: model.archived.filter(entry => entry.id !== id)
        };
        replaceJournalViewAfterMutation(nextModel);
      } else {
        journalRefreshVersion += 1;
        removeArchivedEntryFromView(id);
      }
      toast('Journal entry restored');
    } catch (error) {
      button.disabled = false;
      toast(error.message || 'Could not restore journal entry');
    }
  }));
  document.querySelectorAll('[data-journal-remove]').forEach(button => button.addEventListener('click', () => {
    const item = model.archived.find(entry => entry.id === Number(button.dataset.journalRemove));
    if (item) openRemove(item, model);
  }));
}
