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
  if (items == null) return '<div class="logger-loading">Loading quick repeats…</div>';
  if (!items.length) return '<div class="logger-empty">Recent combinations will appear here.</div>';
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
    return [];
  }
}

async function loadActivities(activityCapability) {
  try {
    return await activityCapability?.list?.() || [];
  } catch {
    return [];
  }
}

async function loadActivityCreationContext(activityCapability) {
  try {
    return await activityCapability?.creationContext?.() || { goals: [] };
  } catch {
    return { goals: [] };
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
      hint: `Schedule this for ${dayLabel(date).toLowerCase()}. It does not count as completed Progress.`
    };
  }
  if (mode === 'in_progress') {
    return {
      button: 'Start now',
      hint: 'Put this into Today as in progress. It does not record completed Progress yet.'
    };
  }
  return {
    button: 'Save progress',
    hint: 'Record what actually happened as factual Progress.'
  };
}

function timeFromStartedAt(value = '') {
  const match = String(value || '').match(/T(\d{2}:\d{2})/);
  return match?.[1] || '';
}

async function savePlanIntent(input) {
  const response = await api('/api/v1/daily-plan', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return response.item;
}

async function completeDailyPlanItem(id) {
  if (!id) return null;
  const response = await api(`/api/v1/daily-plan/${Number(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'completed' })
  });
  return response.item;
}

function normalizeName(value) {
  return String(value || '').trim().toLocaleLowerCase();
}

export function createLogger({ onSaved, activities: activityCapability } = {}) {
  const host = $('#loggerHost');
  if (!host) return { open() {}, close() {} };

  let repeats = [];
  let activities = [];
  let activityContext = { goals: [] };
  let isOpen = false;
  let closeModal = () => {};
  const close = () => closeModal();

  function goalName(goalId) {
    return activityContext.goals.find((goal) => Number(goal.id) === Number(goalId))?.name || '';
  }

  function goalOptions() {
    if (!activityContext.goals.length) return '<option value="">No active goals available</option>';
    return `<option value="">Choose a goal</option>${activityContext.goals.map((goal) => `
      <option value="${Number(goal.id)}">${escapeHtml(goal.name)}</option>
    `).join('')}`;
  }

  function subtypePlaceholder() {
    return 'e.g. chords, vocabulary, chapter 2';
  }

  function ensureActivity(item = {}) {
    const key = item.activity_key || item.key;
    if (!key || activities.some((activity) => activity.key === key)) return;
    activities.unshift({
      key,
      name: item.activity_name || item.name || key,
      goal_id: item.goal_id || null
    });
  }

  function exactActivities(query) {
    const normalized = normalizeName(query);
    if (!normalized) return [];
    return activities.filter((activity) => normalizeName(activity.name || activity.key) === normalized);
  }

  function currentActivity() {
    const key = $('#loggerActivityKey')?.value || '';
    return activities.find((activity) => activity.key === key) || null;
  }

  function hideActivityCreate() {
    const create = $('#loggerActivityCreate');
    const panel = $('#loggerActivityCreatePanel');
    if (create) create.hidden = true;
    if (panel) panel.hidden = true;
  }

  function selectActivity(item) {
    if (!item) return;
    ensureActivity(item);
    if ($('#loggerActivityQuery')) $('#loggerActivityQuery').value = item.name || item.activity_name || item.key || item.activity_key || '';
    if ($('#loggerActivityKey')) $('#loggerActivityKey').value = item.key || item.activity_key || '';
    if ($('#loggerActivitySuggestions')) $('#loggerActivitySuggestions').innerHTML = '';
    hideActivityCreate();
  }

  function renderActivitySuggestions(query = '') {
    const suggestions = $('#loggerActivitySuggestions');
    const create = $('#loggerActivityCreate');
    const createLabel = $('#loggerActivityCreateLabel');
    const createPanel = $('#loggerActivityCreatePanel');
    const normalized = normalizeName(query);
    if (!suggestions || !create) return;

    if (!normalized) {
      suggestions.innerHTML = '';
      create.hidden = true;
      if (createPanel) createPanel.hidden = true;
      return;
    }

    const matches = activities
      .filter((activity) => normalizeName(activity.name || activity.key).includes(normalized))
      .slice(0, 6);

    suggestions.innerHTML = matches.map((activity) => {
      const goal = goalName(activity.goal_id);
      return `<button type="button" class="logger-activity-option" data-activity-key="${escapeHtml(activity.key)}"><strong>${escapeHtml(activity.name || activity.key)}</strong>${goal ? `<span>${escapeHtml(goal)}</span>` : ''}</button>`;
    }).join('');

    suggestions.querySelectorAll('[data-activity-key]').forEach((button) => {
      button.addEventListener('click', () => {
        selectActivity(activities.find((activity) => activity.key === button.dataset.activityKey));
        $('#loggerDuration')?.focus();
      });
    });

    const exact = exactActivities(query);
    if (exact.length === 1) {
      if ($('#loggerActivityKey')) $('#loggerActivityKey').value = exact[0].key;
    }

    const canCreate = exact.length === 0;
    create.hidden = !canCreate;
    if (createLabel && canCreate) createLabel.textContent = `Create “${String(query).trim()}” as a new Activity`;
    if (!canCreate && createPanel) createPanel.hidden = true;
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
    if (item.activity_key) ensureActivity(item);
    const selected = activities.find((activity) => activity.key === item.activity_key);
    if (selected) selectActivity(selected);
    else if ($('#loggerActivityQuery')) $('#loggerActivityQuery').value = item.activity_name || '';
    if ($('#loggerSubtype')) $('#loggerSubtype').value = item.subtype || '';
    if ($('#loggerDuration')) $('#loggerDuration').value = Number(item.minutes || item.duration || 25);
    if ($('#loggerDate')) $('#loggerDate').value = item.occurred_on || item.date || state.date;
    if ($('#loggerStartTime')) $('#loggerStartTime').value = item.planned_time || timeFromStartedAt(item.started_at);
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
    const advancedOpen = Boolean(prefill.subtype || prefill.note || prefill.started_at || prefill.planned_time || date !== state.date);

    host.innerHTML = `
      <div class="logger-backdrop" data-logger-close></div>
      <section class="logger-panel" role="dialog" aria-modal="true" aria-labelledby="loggerTitle" tabindex="-1">
        <header class="logger-head">
          <div>
            <p class="eyebrow">Logger</p>
            <h2 id="loggerTitle">What do you want to do?</h2>
            <p>Plan it, start now, or record what already happened.</p>
          </div>
          <button class="logger-close" type="button" data-logger-close aria-label="Close logger">×</button>
        </header>

        <form id="loggerForm" class="logger-form">
          <fieldset class="logger-mode-fieldset" aria-describedby="loggerModeHint">
            <legend>Right now, I want to…</legend>
            <div class="logger-mode-grid">
              <label class="logger-mode-choice"><input type="radio" name="loggerEntryMode" value="planned" ${mode === 'planned' ? 'checked' : ''}><span>Plan</span></label>
              <label class="logger-mode-choice"><input type="radio" name="loggerEntryMode" value="in_progress" ${mode === 'in_progress' ? 'checked' : ''}><span>Start now</span></label>
              <label class="logger-mode-choice"><input type="radio" name="loggerEntryMode" value="done" ${mode === 'done' ? 'checked' : ''}><span>Done</span></label>
            </div>
            <p id="loggerModeHint" class="logger-mode-hint">${escapeHtml(modeCopy(mode, date).hint)}</p>
          </fieldset>

          <div class="logger-primary-grid">
            <div class="logger-field logger-activity-field">
              <label for="loggerActivityQuery"><span>What did you do?</span></label>
              <input id="loggerActivityQuery" type="text" autocomplete="off" maxlength="120" placeholder="Type an activity" aria-describedby="loggerActivityHelp" aria-autocomplete="list" aria-controls="loggerActivitySuggestions loggerActivityCreate">
              <input id="loggerActivityKey" type="hidden">
              <small id="loggerActivityHelp" class="logger-field-help">Choose an existing Activity or type a new one.</small>
              <div id="loggerActivitySuggestions" class="logger-activity-suggestions" aria-label="Activity suggestions"></div>
              <div id="loggerActivityCreate" class="logger-create-activity" hidden>
                <button type="button" class="logger-create-activity-toggle" id="loggerCreateActivityToggle"><span aria-hidden="true">＋</span><span id="loggerActivityCreateLabel">Create as a new Activity</span></button>
                <div class="logger-create-activity-panel" id="loggerActivityCreatePanel" hidden>
                  <label class="logger-field"><span>Which goal does this support?</span><select id="loggerCreateGoal">${goalOptions()}</select></label>
                  ${activityContext.goals.length ? '<button type="button" class="gc-button gc-button--secondary logger-create-confirm" id="loggerCreateActivityConfirm">Create activity</button>' : '<p class="logger-create-help">Create an active Goal in Plan first, then come back here.</p>'}
                </div>
              </div>
            </div>
            <div class="logger-field duration-field">
              <span>How long?</span>
              <div class="duration-input-wrap"><input id="loggerDuration" type="number" min="1" max="1440" step="1" inputmode="numeric" value="${Number(prefill.minutes || prefill.duration || 25)}" required aria-label="Duration in minutes"><strong>minutes</strong></div>
              <div class="duration-presets" aria-label="Duration presets">${PRESETS.map((minutes) => `<button type="button" data-duration-preset="${minutes}">${minutes}m</button>`).join('')}</div>
            </div>
          </div>

          <section class="logger-repeats" aria-labelledby="recentRepeatsTitle">
            <div class="logger-section-head"><h3 id="recentRepeatsTitle">Quick repeat</h3><span>Optional shortcut</span></div>
            <div class="repeat-row" id="loggerRecentRepeats">${repeatButtons(repeats)}</div>
          </section>

          <details class="logger-advanced" ${advancedOpen ? 'open' : ''}>
            <summary><span class="logger-advanced-copy"><strong>More details</strong><small>Focus, date, time, note</small></span><span class="logger-disclosure-icon" aria-hidden="true">⌄</span></summary>
            <div class="logger-advanced-grid">
              <label class="logger-field logger-full"><span>Focus / variation <small>optional</small></span><input id="loggerSubtype" maxlength="80" placeholder="${escapeHtml(subtypePlaceholder())}"></label>
              <label class="logger-field"><span>Date</span><input id="loggerDate" type="date" value="${escapeHtml(date)}" required></label>
              <label class="logger-field"><span>Start time <small>optional</small></span><input id="loggerStartTime" type="time"></label>
              <label class="logger-field logger-full"><span>Note <small>optional</small></span><textarea id="loggerNote" maxlength="500" placeholder="Anything worth remembering?"></textarea></label>
            </div>
          </details>

          <button class="logger-save" id="loggerSaveButton" type="submit">${escapeHtml(modeCopy(mode, date).button)}</button>
        </form>
      </section>`;

    fill({
      activity_key: prefill.activityKey || prefill.activity_key || '',
      activity_name: prefill.activityName || prefill.activity_name || '',
      subtype: prefill.subtype || '',
      minutes: prefill.minutes || prefill.duration || 25,
      occurred_on: date,
      started_at: prefill.started_at || '',
      planned_time: prefill.planned_time || '',
      note: prefill.note || ''
    });

    bindRepeats();
    host.querySelectorAll('[data-logger-close]').forEach((item) => item.addEventListener('click', close));
    host.querySelectorAll('[data-duration-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        $('#loggerDuration').value = button.dataset.durationPreset;
        $('#loggerDuration').focus();
      });
    });
    host.querySelectorAll('input[name="loggerEntryMode"]').forEach((item) => item.addEventListener('change', updateModeUi));
    $('#loggerDate')?.addEventListener('change', updateModeUi);
    $('#loggerActivityQuery')?.addEventListener('input', (event) => {
      if ($('#loggerActivityKey')) $('#loggerActivityKey').value = '';
      renderActivitySuggestions(event.currentTarget.value);
    });
    $('#loggerActivityQuery')?.addEventListener('focus', (event) => renderActivitySuggestions(event.currentTarget.value));
    $('#loggerCreateActivityToggle')?.addEventListener('click', () => {
      const panel = $('#loggerActivityCreatePanel');
      if (panel) panel.hidden = !panel.hidden;
      if (panel && !panel.hidden) $('#loggerCreateGoal')?.focus();
    });
    $('#loggerCreateActivityConfirm')?.addEventListener('click', async () => {
      const name = $('#loggerActivityQuery')?.value.trim() || '';
      const goalId = Number($('#loggerCreateGoal')?.value || 0);
      if (!name) return toast('Type an activity first');
      if (!Number.isInteger(goalId) || goalId <= 0) return toast('Choose the goal this activity supports');
      try {
        const created = await activityCapability.create({
          goal_id: goalId,
          name,
          description: null,
          sort_order: 100
        });
        activities.push(created);
        selectActivity(created);
        toast('Activity created');
        $('#loggerDuration')?.focus();
      } catch (error) {
        toast(error.message || 'Could not create activity');
      }
    });

    $('#loggerForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const typedActivity = $('#loggerActivityQuery')?.value.trim() || '';
      let activity = currentActivity();
      if (!activity) {
        const exact = exactActivities(typedActivity);
        if (exact.length === 1) activity = exact[0];
      }
      const activityKey = activity?.key || '';
      const activityLabel = activity?.name || typedActivity;
      const minutes = Math.round(Number($('#loggerDuration').value || 0));
      const occurredOn = $('#loggerDate').value;
      const startTime = $('#loggerStartTime').value || null;
      const subtype = $('#loggerSubtype').value.trim() || null;
      const note = $('#loggerNote').value.trim() || null;
      const entryMode = currentMode();

      if (!activityKey) return toast('Choose an existing Activity or create this one');
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return toast('Duration must be 1–1440 minutes');
      if (!occurredOn) return toast('Choose a date');
      if (entryMode === 'in_progress' && occurredOn !== state.date) return toast('Start now must use Today');

      try {
        if (entryMode === 'planned' || entryMode === 'in_progress') {
          await savePlanIntent({
            planned_for: occurredOn,
            planned_time: startTime,
            title: subtype || activityLabel,
            activity_key: activityKey,
            activity_label: activityLabel,
            subtype,
            planned_minutes: minutes,
            note,
            status: entryMode,
            source: 'logger'
          });
          toast(entryMode === 'in_progress' ? 'Started for Today' : `Added to ${dayLabel(occurredOn)}`);
          close();
          await onSaved?.({ kind: 'plan-intent' });
          return;
        }

        const response = await api('/api/v1/progress', {
          method: 'POST',
          body: JSON.stringify({
            occurred_on: occurredOn,
            started_at: startTime ? `${occurredOn}T${startTime}:00` : null,
            activity_key: activityKey,
            minutes,
            subtype,
            note
          })
        });

        if (prefill.dailyPlanId) {
          await completeDailyPlanItem(prefill.dailyPlanId);
        }

        toast('Progress saved');
        close();
        await onSaved?.({
          kind: 'progress',
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
    const [loadedActivities, loadedRepeats, loadedContext] = await Promise.all([
      loadActivities(activityCapability),
      loadRecentRepeats(),
      loadActivityCreationContext(activityCapability)
    ]);
    if (!isOpen) return;
    activities = loadedActivities;
    repeats = loadedRepeats;
    activityContext = loadedContext;
    render(prefill);
    closeModal = activateModal(host, {
      initialFocus: () => $('#loggerActivityQuery'),
      onClose: () => {
        host.innerHTML = '';
        document.body.classList.remove('logger-open');
        isOpen = false;
      }
    });
  }

  return { open, close };
}
