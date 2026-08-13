import { api } from '../core/api.js';
import { $, escapeHtml } from '../core/dom.js';
import { state } from '../core/state.js';
import { toast } from '../core/toast.js';

const PRESETS = [15, 25, 35, 45, 60];

function addDays(dateText, amount) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function activityCatalog() {
  const items = [];
  const seen = new Set();

  for (const item of state.data.week || []) {
    if (!item?.key || seen.has(item.key)) continue;
    seen.add(item.key);
    items.push({ key: item.key, name: item.name || item.key });
  }

  for (const item of state.data.sessions || []) {
    if (!item?.activity_key || seen.has(item.activity_key)) continue;
    seen.add(item.activity_key);
    items.push({ key: item.activity_key, name: item.activity_name || item.activity_key });
  }

  return items;
}

function activityOptions(selectedKey = '') {
  const items = activityCatalog();
  if (!items.length) return '<option value="">No activities available yet</option>';
  return `<option value="">Choose activity</option>${items.map((item) => `<option value="${escapeHtml(item.key)}" ${item.key === selectedKey ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}`;
}

function subtypePlaceholder(activityKey = '') {
  const item = activityCatalog().find((entry) => entry.key === activityKey);
  const text = `${activityKey} ${item?.name || ''}`.toLowerCase();
  if (/sport|calisthen|workout|fitness|gym|exercise/.test(text)) return 'e.g. Back, Abs, Push-ups';
  if (/german|language/.test(text)) return 'e.g. Speaking, Grammar, Vocabulary';
  if (/guitar|music/.test(text)) return 'e.g. Chords, Technique, Song practice';
  if (/reading|book/.test(text)) return 'e.g. Book, Chapter, Notes';
  return 'e.g. Focus, variation, subtask';
}

function repeatKey(item) {
  return [item.activity_key, item.subtype || '', Number(item.minutes) || 0].join('|');
}

function recentRepeats(items) {
  const seen = new Set();
  const result = [];
  for (const item of items || []) {
    const key = repeatKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length === 3) break;
  }
  return result;
}

function repeatButtons(items) {
  if (items == null) return '<div class="logger-loading">Loading recent repeats…</div>';
  if (!items.length) return '<div class="logger-empty">Your recent activity combinations will appear here.</div>';
  return items.map((item, index) => `<button type="button" class="repeat-chip" data-repeat-index="${index}">
    <strong>${escapeHtml(item.activity_name || item.activity_key)}</strong>
    <span>${item.subtype ? `${escapeHtml(item.subtype)} · ` : ''}${Number(item.minutes) || 0}m</span>
  </button>`).join('');
}

async function loadRecentRepeats() {
  const from = addDays(state.date, -13);
  try {
    const history = await api(`/api/history?from=${from}&to=${state.date}`);
    return recentRepeats(history.sessions || []);
  } catch {
    return recentRepeats(state.data.sessions || []);
  }
}

function modeCopy(mode) {
  if (mode === 'planned') return {
    button: 'Add to Today',
    hint: 'This is an intention, not completed progress. You can start it or finish it later from Today.'
  };
  if (mode === 'in_progress') return {
    button: 'Start now',
    hint: 'Marks this item as in progress. It does not record completed minutes yet.'
  };
  return {
    button: 'Save completed progress',
    hint: 'Records what actually happened. Change the minutes first if the real duration was different.'
  };
}

export function createLogger({ onSaved, onIntent }) {
  const host = $('#loggerHost');
  if (!host) return { open() {}, close() {} };

  let repeats = [];
  let isOpen = false;

  function close() {
    host.innerHTML = '';
    document.body.classList.remove('logger-open');
    isOpen = false;
  }

  function ensureActivityOption(item) {
    const select = $('#loggerActivity');
    if (!select || !item?.activity_key) return;
    const exists = [...select.options].some((option) => option.value === item.activity_key);
    if (!exists) select.add(new Option(item.activity_name || item.activity_key, item.activity_key));
  }

  function updateSubtypeHint() {
    const input = $('#loggerSubtype');
    const select = $('#loggerActivity');
    if (input && select) input.placeholder = subtypePlaceholder(select.value);
  }

  function currentMode() {
    return host.querySelector('input[name="loggerEntryMode"]:checked')?.value || 'done';
  }

  function updateModeUi() {
    const copy = modeCopy(currentMode());
    const button = $('#loggerSaveButton');
    const hint = $('#loggerModeHint');
    if (button) button.textContent = copy.button;
    if (hint) hint.textContent = copy.hint;
  }

  function fill(item = {}) {
    if (item.activity_key) ensureActivityOption(item);
    if ($('#loggerActivity')) $('#loggerActivity').value = item.activity_key || '';
    if ($('#loggerSubtype')) $('#loggerSubtype').value = item.subtype || '';
    if ($('#loggerDuration')) $('#loggerDuration').value = Number(item.minutes || item.duration || 25);
    if ($('#loggerDate')) $('#loggerDate').value = item.occurred_on || state.date;
    if ($('#loggerNote')) $('#loggerNote').value = item.note || '';
    updateSubtypeHint();
  }

  function bindRepeatButtons() {
    host.querySelectorAll('[data-repeat-index]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = repeats[Number(button.dataset.repeatIndex)];
        if (!item) return;
        fill(item);
        $('#loggerDuration')?.focus();
      });
    });
  }

  function render(prefill = {}) {
    const selectedMode = ['planned','in_progress','done'].includes(prefill.entryMode) ? prefill.entryMode : 'done';
    host.innerHTML = `
      <div class="logger-backdrop" data-logger-close></div>
      <section class="logger-panel" role="dialog" aria-modal="true" aria-labelledby="loggerTitle">
        <div class="logger-head">
          <div>
            <p class="eyebrow">Universal logger</p>
            <h2 id="loggerTitle">Plan it, do it, or finish it</h2>
            <p>Use the same entry for something you intend to do, something you are doing now, or completed progress.</p>
          </div>
          <button class="logger-close" type="button" data-logger-close aria-label="Close logger">×</button>
        </div>

        <div class="logger-plus" aria-hidden="true">＋</div>

        <section class="logger-repeats" aria-labelledby="recentRepeatsTitle">
          <div class="logger-section-head">
            <h3 id="recentRepeatsTitle">Recent repeats</h3>
            <span>Tap to prefill</span>
          </div>
          <div class="repeat-row" id="loggerRecentRepeats">${repeatButtons(null)}</div>
        </section>

        <form id="loggerForm" class="logger-form">
          <fieldset class="logger-mode-fieldset">
            <legend>Use this entry as</legend>
            <div class="logger-mode-grid">
              <label class="logger-mode-choice">
                <input type="radio" name="loggerEntryMode" value="planned" ${selectedMode === 'planned' ? 'checked' : ''}>
                <span>Plan today</span>
              </label>
              <label class="logger-mode-choice">
                <input type="radio" name="loggerEntryMode" value="in_progress" ${selectedMode === 'in_progress' ? 'checked' : ''}>
                <span>Doing now</span>
              </label>
              <label class="logger-mode-choice">
                <input type="radio" name="loggerEntryMode" value="done" ${selectedMode === 'done' ? 'checked' : ''}>
                <span>Done</span>
              </label>
            </div>
            <p id="loggerModeHint" class="logger-mode-hint">${escapeHtml(modeCopy(selectedMode).hint)}</p>
          </fieldset>

          <label class="logger-field">
            <span>Activity</span>
            <select id="loggerActivity" required>${activityOptions(prefill.activityKey || prefill.activity_key || '')}</select>
          </label>

          <label class="logger-field">
            <span>Subtype / focus <small>optional for this beta</small></span>
            <input id="loggerSubtype" maxlength="80" placeholder="${escapeHtml(subtypePlaceholder(prefill.activityKey || prefill.activity_key || ''))}" />
          </label>

          <div class="logger-field duration-field">
            <span>Duration</span>
            <div class="duration-input-wrap">
              <input id="loggerDuration" type="number" min="1" max="1440" step="1" inputmode="numeric" value="${Number(prefill.minutes || prefill.duration || 25)}" required />
              <strong>minutes</strong>
            </div>
            <div class="duration-presets" aria-label="Duration presets">
              ${PRESETS.map((minutes) => `<button type="button" data-duration-preset="${minutes}">${minutes}m</button>`).join('')}
            </div>
          </div>

          <label class="logger-field">
            <span>Date</span>
            <input id="loggerDate" type="date" value="${escapeHtml(prefill.date || prefill.occurred_on || state.date)}" required />
          </label>

          <label class="logger-field">
            <span>Note <small>optional</small></span>
            <textarea id="loggerNote" maxlength="500" placeholder="Anything worth remembering?"></textarea>
          </label>

          <button class="logger-save" id="loggerSaveButton" type="submit">${escapeHtml(modeCopy(selectedMode).button)}</button>
        </form>
      </section>
    `;

    fill({
      activity_key: prefill.activityKey || prefill.activity_key || '',
      activity_name: prefill.activityName || prefill.activity_name || '',
      subtype: prefill.subtype || '',
      minutes: prefill.minutes || prefill.duration || 25,
      occurred_on: prefill.date || prefill.occurred_on || state.date,
      note: prefill.note || ''
    });

    host.querySelectorAll('[data-logger-close]').forEach((element) => element.addEventListener('click', close));
    host.querySelectorAll('[data-duration-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        $('#loggerDuration').value = button.dataset.durationPreset;
        $('#loggerDuration').focus();
      });
    });
    host.querySelectorAll('input[name="loggerEntryMode"]').forEach((input) => input.addEventListener('change', updateModeUi));
    $('#loggerActivity')?.addEventListener('change', updateSubtypeHint);

    $('#loggerForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const activityKey = $('#loggerActivity').value;
      const minutes = Math.round(Number($('#loggerDuration').value || 0));
      const occurredOn = $('#loggerDate').value;
      const subtype = $('#loggerSubtype').value.trim() || null;
      const note = $('#loggerNote').value.trim() || null;
      const mode = currentMode();
      if (!activityKey) return toast('Choose an activity');
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return toast('Duration must be 1–1440 minutes');
      if (!occurredOn) return toast('Choose a date');

      try {
        if (mode === 'planned' || mode === 'in_progress') {
          await onIntent?.({
            occurred_on: occurredOn,
            activity_key: activityKey,
            subtype,
            planned_minutes: minutes,
            note,
            status: mode
          });
          toast(mode === 'in_progress' ? 'Added to Today as in progress' : 'Added to Today');
          close();
          return;
        }

        const response = await api('/api/session', {
          method: 'POST',
          body: JSON.stringify({
            occurred_on: occurredOn,
            activity_key: activityKey,
            minutes,
            subtype,
            note
          })
        });
        toast('Progress saved');
        close();
        await onSaved?.({
          intentionId: prefill.intentionId || null,
          sessionId: response.id || null,
          activity_key: activityKey,
          minutes,
          occurred_on: occurredOn
        });
      } catch (error) {
        toast(error.message || 'Could not save');
      }
    });
  }

  async function open(prefill = {}) {
    isOpen = true;
    document.body.classList.add('logger-open');
    render(prefill);
    $('#loggerActivity')?.focus();

    repeats = await loadRecentRepeats();
    if (!isOpen) return;
    const repeatHost = $('#loggerRecentRepeats');
    if (repeatHost) {
      repeatHost.innerHTML = repeatButtons(repeats);
      bindRepeatButtons();
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) close();
  });

  return { open, close };
}
