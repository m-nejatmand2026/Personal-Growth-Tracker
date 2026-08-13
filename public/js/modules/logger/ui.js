import { api } from '../../core/api.js';
import { $, escapeHtml } from '../../core/dom.js';
import { state } from '../../core/state.js';
import { toast } from '../../core/toast.js';
import { activateModal } from '../../platform/modal.js';

const PRESETS = [15, 25, 35, 45, 60];

function addDays(dateText, amount) {
  const d = new Date(`${dateText}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

function fallbackActivities() {
  const items = [];
  const seen = new Set();
  for (const x of state.data.week || []) {
    if (!x?.key || seen.has(x.key)) continue;
    seen.add(x.key);
    items.push({ key: x.key, name: x.name || x.key });
  }
  for (const x of state.data.sessions || []) {
    if (!x?.activity_key || seen.has(x.activity_key)) continue;
    seen.add(x.activity_key);
    items.push({ key: x.activity_key, name: x.activity_name || x.activity_key });
  }
  return items;
}

function repeatKey(x) {
  return [x.activity_key, x.subtype || '', Number(x.minutes) || 0].join('|');
}

function recentRepeats(items) {
  const seen = new Set();
  const out = [];
  for (const x of items || []) {
    const key = repeatKey(x);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
    if (out.length === 3) break;
  }
  return out;
}

function repeatButtons(items) {
  if (items == null) return '<div class="logger-loading">Loading recent repeats…</div>';
  if (!items.length) return '<div class="logger-empty">Your recent activity combinations will appear here.</div>';
  return items.map((x, i) => `
    <button type="button" class="repeat-chip" data-repeat-index="${i}">
      <strong>${escapeHtml(x.activity_name || x.activity_key)}</strong>
      <span>${x.subtype ? `${escapeHtml(x.subtype)} · ` : ''}${Number(x.minutes) || 0}m</span>
    </button>
  `).join('');
}

async function loadRecentRepeats() {
  const from = addDays(state.date, -13);
  try {
    const response = await api(`/api/v1/progress?from=${from}&to=${state.date}&limit=100`);
    return recentRepeats(response.items || []);
  } catch {
    return recentRepeats(state.data.sessions || []);
  }
}

async function loadActivities() {
  try {
    const response = await api('/api/v1/activities');
    return response.items || [];
  } catch {
    return fallbackActivities();
  }
}

function dayLabel(date) {
  if (date === state.date) return 'Today';
  if (date === addDays(state.date, 1)) return 'Tomorrow';
  return 'selected day';
}

function modeCopy(mode, date) {
  if (mode === 'planned') {
    return {
      button: `Add to ${dayLabel(date)}`,
      hint: `Adds this activity to ${dayLabel(date).toLowerCase()}'s short-term plan. It does not count as completed progress.`
    };
  }
  if (mode === 'in_progress') {
    return {
      button: 'Start now',
      hint: 'Marks this activity as in progress today. It does not record completed minutes yet.'
    };
  }
  return {
    button: 'Save completed progress',
    hint: 'Records what actually happened. Change the minutes first if the real duration was different.'
  };
}

export function createLogger({ onSaved, onIntent }) {
  const host = $('#loggerHost');
  if (!host) return { open() {}, close() {} };

  let repeats = [];
  let activities = [];
  let isOpen = false;
  let closeModal = () => {};
  const close = () => closeModal();

  function activityOptions(selected = '') {
    if (!activities.length) return '<option value="">No activities available yet</option>';
    return `<option value="">Choose activity</option>${activities.map((item) => `
      <option value="${escapeHtml(item.key)}" ${item.key === selected ? 'selected' : ''}>
        ${escapeHtml(item.name || item.key)}
      </option>
    `).join('')}`;
  }

  function subtypePlaceholder() {
    return 'e.g. focus, variation, subtask';
  }

  function ensureActivityOption(item) {
    const select = $('#loggerActivity');
    if (!select || !item?.activity_key) return;
    if (![...select.options].some((option) => option.value === item.activity_key)) {
      select.add(new Option(item.activity_name || item.activity_key, item.activity_key));
    }
  }

  function updateSubtypeHint() {
    const input = $('#loggerSubtype');
    if (input) input.placeholder = subtypePlaceholder();
  }

  function currentMode() {
    return host.querySelector('input[name="loggerEntryMode"]:checked')?.value || 'done';
  }

  function updateModeUi() {
    const date = $('#loggerDate')?.value || state.date;
    const copy = modeCopy(currentMode(), date);
    if ($('#loggerSaveButton')) $('#loggerSaveButton').textContent = copy.button;
    if ($('#loggerModeHint')) $('#loggerModeHint').textContent = copy.hint;
  }

  function fill(item = {}) {
    if (item.activity_key) ensureActivityOption(item);
    if ($('#loggerActivity')) $('#loggerActivity').value = item.activity_key || '';
    if ($('#loggerSubtype')) $('#loggerSubtype').value = item.subtype || '';
    if ($('#loggerDuration')) $('#loggerDuration').value = Number(item.minutes || item.duration || 25);
    if ($('#loggerDate')) $('#loggerDate').value = item.occurred_on || state.date;
    if ($('#loggerNote')) $('#loggerNote').value = item.note || '';
    updateSubtypeHint();
    updateModeUi();
  }

  function bindRepeats() {
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
    const mode = ['planned', 'in_progress', 'done'].includes(prefill.entryMode)
      ? prefill.entryMode
      : 'done';
    const date = prefill.date || prefill.occurred_on || state.date;

    host.innerHTML = `
      <div class="logger-backdrop" data-logger-close></div>
      <section class="logger-panel" role="dialog" aria-modal="true" aria-labelledby="loggerTitle" tabindex="-1">
        <div class="logger-head">
          <div>
            <p class="eyebrow">Universal logger</p>
            <h2 id="loggerTitle">Plan it, do it, or finish it</h2>
            <p>One activity can become a short-term plan, something in progress, or confirmed completed progress.</p>
          </div>
          <button class="logger-close" type="button" data-logger-close aria-label="Close logger">×</button>
        </div>

        <section class="logger-repeats" aria-labelledby="recentRepeatsTitle">
          <div class="logger-section-head"><h3 id="recentRepeatsTitle">Recent repeats</h3><span>Tap to prefill</span></div>
          <div class="repeat-row" id="loggerRecentRepeats">${repeatButtons(repeats)}</div>
        </section>

        <form id="loggerForm" class="logger-form">
          <fieldset class="logger-mode-fieldset">
            <legend>What does this mean right now?</legend>
            <div class="logger-mode-grid">
              <label class="logger-mode-choice"><input type="radio" name="loggerEntryMode" value="planned" ${mode === 'planned' ? 'checked' : ''}><span>Plan</span></label>
              <label class="logger-mode-choice"><input type="radio" name="loggerEntryMode" value="in_progress" ${mode === 'in_progress' ? 'checked' : ''}><span>Doing now</span></label>
              <label class="logger-mode-choice"><input type="radio" name="loggerEntryMode" value="done" ${mode === 'done' ? 'checked' : ''}><span>Done</span></label>
            </div>
            <p id="loggerModeHint" class="logger-mode-hint">${escapeHtml(modeCopy(mode, date).hint)}</p>
          </fieldset>

          <label class="logger-field"><span>Activity</span><select id="loggerActivity" required>${activityOptions(prefill.activityKey || prefill.activity_key || '')}</select></label>
          <label class="logger-field"><span>Subtype / focus <small>optional</small></span><input id="loggerSubtype" maxlength="80" placeholder="${escapeHtml(subtypePlaceholder())}"></label>
          <div class="logger-field duration-field">
            <span>Duration</span>
            <div class="duration-input-wrap"><input id="loggerDuration" type="number" min="1" max="1440" step="1" inputmode="numeric" value="${Number(prefill.minutes || prefill.duration || 25)}" required><strong>minutes</strong></div>
            <div class="duration-presets" aria-label="Duration presets">${PRESETS.map((minutes) => `<button type="button" data-duration-preset="${minutes}">${minutes}m</button>`).join('')}</div>
          </div>
          <label class="logger-field"><span>Date</span><input id="loggerDate" type="date" value="${escapeHtml(date)}" required></label>
          <label class="logger-field"><span>Note <small>optional</small></span><textarea id="loggerNote" maxlength="500" placeholder="Anything worth remembering?"></textarea></label>
          <button class="logger-save" id="loggerSaveButton" type="submit">${escapeHtml(modeCopy(mode, date).button)}</button>
        </form>
      </section>`;

    fill({
      activity_key: prefill.activityKey || prefill.activity_key || '',
      activity_name: prefill.activityName || prefill.activity_name || '',
      subtype: prefill.subtype || '',
      minutes: prefill.minutes || prefill.duration || 25,
      occurred_on: date,
      note: prefill.note || ''
    });

    host.querySelectorAll('[data-logger-close]').forEach((item) => item.addEventListener('click', close));
    host.querySelectorAll('[data-duration-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        $('#loggerDuration').value = button.dataset.durationPreset;
        $('#loggerDuration').focus();
      });
    });
    host.querySelectorAll('input[name="loggerEntryMode"]').forEach((item) => item.addEventListener('change', updateModeUi));
    $('#loggerActivity')?.addEventListener('change', updateSubtypeHint);
    $('#loggerDate')?.addEventListener('change', updateModeUi);

    $('#loggerForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const select = $('#loggerActivity');
      const activityKey = select.value;
      const activityLabel = select.selectedOptions[0]?.textContent?.trim() || activityKey;
      const minutes = Math.round(Number($('#loggerDuration').value || 0));
      const occurredOn = $('#loggerDate').value;
      const subtype = $('#loggerSubtype').value.trim() || null;
      const note = $('#loggerNote').value.trim() || null;
      const entryMode = currentMode();

      if (!activityKey) return toast('Choose an activity');
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return toast('Duration must be 1–1440 minutes');
      if (!occurredOn) return toast('Choose a date');
      if (entryMode === 'in_progress' && occurredOn !== state.date) return toast('Doing now must use Today');

      try {
        if (entryMode === 'planned' || entryMode === 'in_progress') {
          await onIntent?.({
            planned_for: occurredOn,
            title: subtype || activityLabel,
            activity_key: activityKey,
            activity_label: activityLabel,
            subtype,
            planned_minutes: minutes,
            note,
            status: entryMode,
            source: 'logger'
          });
          toast(entryMode === 'in_progress' ? 'Added as doing now' : `Added to ${dayLabel(occurredOn)}`);
          close();
          return;
        }

        const response = await api('/api/v1/progress', {
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
          dailyPlanId: prefill.dailyPlanId || null,
          progressId: response.item?.id || null,
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
    const [loadedActivities, loadedRepeats] = await Promise.all([
      loadActivities(),
      loadRecentRepeats()
    ]);
    if (!isOpen) return;
    activities = loadedActivities;
    repeats = loadedRepeats;
    render(prefill);
    closeModal = activateModal(host, {
      initialFocus: () => $('#loggerActivity'),
      onClose: () => {
        host.innerHTML = '';
        document.body.classList.remove('logger-open');
        isOpen = false;
      }
    });
  }

  return { open, close };
}
