import { api } from '../../core/api.js';
import { $, escapeHtml } from '../../core/dom.js';
import { state } from '../../core/state.js';
import { toast } from '../../core/toast.js';
import { activateModal } from '../../platform/modal.js';

const PRESETS = [15, 30, 45, 60];

function addDays(dateText, amount) {
  const d = new Date(`${dateText}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}

function repeatKey(item) {
  return [item.activity_key, item.subtype || '', Number(item.minutes) || 0].join('|');
}

function recentRepeats(items) {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const key = repeatKey(item);
    if (!item.activity_key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length === 4) break;
  }
  return out;
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
      hint: 'Plan adds an intention to your day — not Progress.'
    };
  }
  if (mode === 'in_progress') {
    return {
      button: 'Start now',
      hint: 'Start now creates an in-progress intention. Progress waits until Done.'
    };
  }
  return {
    button: 'Save progress',
    hint: 'Done records factual Progress. Planned work is never counted automatically.'
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
    return `<option value="">Choose a goal</option>${activityContext.goals.map((goal) => `<option value="${Number(goal.id)}">${escapeHtml(goal.name)}</option>`).join('')}`;
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

  function currentMode() {
    return host.querySelector('input[name="loggerEntryMode"]:checked')?.value || 'planned';
  }

  function selectedSummary(item) {
    const selected = $('#loggerSelectedActivity');
    if (!selected) return;
    if (!item) {
      selected.hidden = true;
      selected.innerHTML = '';
      return;
    }
    const goal = goalName(item.goal_id);
    selected.hidden = false;
    selected.innerHTML = `<span class="logger-selected-mark" aria-hidden="true">${escapeHtml((item.name || item.key || 'A').slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(item.name || item.key)}</strong>${goal ? `<small>${escapeHtml(goal)}</small>` : ''}</div><b>Selected</b>`;
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
    const key = item.key || item.activity_key || '';
    const selected = activities.find((activity) => activity.key === key) || item;
    if ($('#loggerActivityQuery')) $('#loggerActivityQuery').value = selected.name || selected.activity_name || key;
    if ($('#loggerActivityKey')) $('#loggerActivityKey').value = key;
    if ($('#loggerActivitySuggestions')) $('#loggerActivitySuggestions').innerHTML = '';
    hideActivityCreate();
    selectedSummary(selected);
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
      return `<button type="button" class="logger-activity-option" data-activity-key="${escapeHtml(activity.key)}"><span class="logger-activity-mark" aria-hidden="true">${escapeHtml((activity.name || activity.key).slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(activity.name || activity.key)}</strong>${goal ? `<small>${escapeHtml(goal)}</small>` : ''}</span><b>Select</b></button>`;
    }).join('');

    suggestions.querySelectorAll('[data-activity-key]').forEach((button) => {
      button.addEventListener('click', () => {
        selectActivity(activities.find((activity) => activity.key === button.dataset.activityKey));
        $('#loggerDuration')?.focus();
      });
    });

    const exact = exactActivities(query);
    if (exact.length === 1 && $('#loggerActivityKey')) $('#loggerActivityKey').value = exact[0].key;

    const canCreate = exact.length === 0;
    create.hidden = !canCreate;
    if (createLabel && canCreate) createLabel.textContent = `Create “${String(query).trim()}”`;
    if (!canCreate && createPanel) createPanel.hidden = true;
  }

  function renderRecent() {
    const root = $('#loggerRecentActivities');
    if (!root) return;
    if (!repeats.length) {
      root.innerHTML = activities.slice(0, 4).map((activity) => `<button type="button" class="logger-recent-choice" data-recent-activity="${escapeHtml(activity.key)}"><span class="logger-activity-mark" aria-hidden="true">${escapeHtml((activity.name || activity.key).slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(activity.name || activity.key)}</strong>${goalName(activity.goal_id) ? `<small>${escapeHtml(goalName(activity.goal_id))}</small>` : ''}</span></button>`).join('') || '<p class="logger-empty">Create your first Activity by typing its name above.</p>';
      root.querySelectorAll('[data-recent-activity]').forEach((button) => button.addEventListener('click', () => {
        selectActivity(activities.find((activity) => activity.key === button.dataset.recentActivity));
        $('#loggerDuration')?.focus();
      }));
      return;
    }
    root.innerHTML = repeats.map((item, index) => `<button type="button" class="logger-recent-choice" data-repeat-index="${index}"><span class="logger-activity-mark" aria-hidden="true">${escapeHtml((item.activity_name || item.activity_key || 'A').slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(item.activity_name || item.activity_key)}</strong><small>${item.subtype ? `${escapeHtml(item.subtype)} · ` : ''}${Number(item.minutes) || 0} min recent</small></span></button>`).join('');
    root.querySelectorAll('[data-repeat-index]').forEach((button) => button.addEventListener('click', () => {
      const item = repeats[Number(button.dataset.repeatIndex)];
      if (!item) return;
      fill(item);
      $('#loggerDuration')?.focus();
    }));
  }

  function updateModeUi() {
    const date = $('#loggerDate')?.value || state.date;
    const mode = currentMode();
    const copy = modeCopy(mode, date);
    if ($('#loggerSaveButton')) $('#loggerSaveButton').textContent = copy.button;
    if ($('#loggerModeHint')) $('#loggerModeHint').textContent = copy.hint;
    host.querySelectorAll('[data-logger-when]').forEach((node) => { node.hidden = mode !== 'planned'; });
    host.querySelectorAll('.logger-mode-choice').forEach((label) => {
      label.classList.toggle('selected', label.querySelector('input')?.checked === true);
    });
    if (mode === 'in_progress' && $('#loggerDate')) $('#loggerDate').value = state.date;
  }

  function fill(item = {}) {
    if (item.activity_key) ensureActivity(item);
    const selected = activities.find((activity) => activity.key === item.activity_key);
    if (selected) selectActivity(selected);
    else if ($('#loggerActivityQuery')) $('#loggerActivityQuery').value = item.activity_name || '';
    if ($('#loggerSubtype')) $('#loggerSubtype').value = item.subtype || '';
    if ($('#loggerDuration')) $('#loggerDuration').value = Number(item.minutes || item.duration || 30);
    if ($('#loggerDate')) $('#loggerDate').value = item.occurred_on || item.date || state.date;
    if ($('#loggerStartTime')) $('#loggerStartTime').value = item.planned_time || timeFromStartedAt(item.started_at);
    if ($('#loggerNote')) $('#loggerNote').value = item.note || '';
    updateModeUi();
  }

  function render(prefill = {}) {
    const mode = ['planned', 'in_progress', 'done'].includes(prefill.entryMode) ? prefill.entryMode : 'planned';
    const date = prefill.date || prefill.occurred_on || state.date;
    const advancedOpen = Boolean(prefill.subtype || prefill.note || prefill.started_at || prefill.planned_time || date !== state.date);
    const tomorrow = addDays(state.date, 1);

    host.innerHTML = `
      <div class="logger-backdrop" data-logger-close></div>
      <section class="logger-panel gc-add-activity-sheet" role="dialog" aria-modal="true" aria-labelledby="loggerTitle" tabindex="-1">
        <header class="logger-head gc-add-head">
          <div><h2 id="loggerTitle">Add activity</h2><p>Plan it, start now, or record what actually happened.</p></div>
          <button class="logger-close" type="button" data-logger-close aria-label="Close Add activity">×</button>
        </header>

        <form id="loggerForm" class="logger-form gc-add-form">
          <fieldset class="logger-mode-fieldset gc-intent-fieldset" aria-describedby="loggerModeHint">
            <legend class="gc-sr-only">What do you want to do with this Activity?</legend>
            <div class="logger-mode-grid gc-intent-tabs">
              <label class="logger-mode-choice ${mode === 'planned' ? 'selected' : ''}"><input type="radio" name="loggerEntryMode" value="planned" ${mode === 'planned' ? 'checked' : ''}><span>Plan</span></label>
              <label class="logger-mode-choice ${mode === 'in_progress' ? 'selected' : ''}"><input type="radio" name="loggerEntryMode" value="in_progress" ${mode === 'in_progress' ? 'checked' : ''}><span>Start now</span></label>
              <label class="logger-mode-choice ${mode === 'done' ? 'selected' : ''}"><input type="radio" name="loggerEntryMode" value="done" ${mode === 'done' ? 'checked' : ''}><span>Done</span></label>
            </div>
            <p id="loggerModeHint" class="logger-mode-hint gc-mode-consequence">${escapeHtml(modeCopy(mode, date).hint)}</p>
          </fieldset>

          <section class="gc-add-section gc-activity-picker" aria-labelledby="activityPickerTitle">
            <h3 id="activityPickerTitle" class="gc-sr-only">Choose an Activity</h3>
            <label class="logger-activity-search" for="loggerActivityQuery"><span aria-hidden="true">⌕</span><input id="loggerActivityQuery" type="text" autocomplete="off" maxlength="120" placeholder="Search or type an activity" aria-describedby="loggerActivityHelp" aria-controls="loggerActivitySuggestions loggerActivityCreate"></label>
            <input id="loggerActivityKey" type="hidden">
            <small id="loggerActivityHelp" class="gc-sr-only">Choose an existing Activity or type a new one.</small>
            <div id="loggerActivitySuggestions" class="logger-activity-suggestions"></div>
            <div id="loggerActivityCreate" class="logger-create-activity" hidden>
              <button type="button" class="logger-create-activity-toggle" id="loggerCreateActivityToggle"><span aria-hidden="true">＋</span><strong id="loggerActivityCreateLabel">Create as a new Activity</strong><small>Stay in this flow</small></button>
              <div class="logger-create-activity-panel" id="loggerActivityCreatePanel" hidden>
                <label class="logger-field"><span>What does this support?</span><select id="loggerCreateGoal">${goalOptions()}</select><small>Activities are Goal-linked in the current Beta.</small></label>
                ${activityContext.goals.length ? '<button type="button" class="gc-button gc-button--secondary logger-create-confirm" id="loggerCreateActivityConfirm">Create & continue</button>' : '<p class="logger-create-help">Create an active Goal in Plan first, or use a one-off Daily Plan item.</p>'}
              </div>
            </div>
            <div id="loggerSelectedActivity" class="logger-selected-activity" hidden></div>
          </section>

          <section class="logger-recent gc-add-section" aria-labelledby="recentActivitiesTitle">
            <div class="logger-section-head"><h3 id="recentActivitiesTitle">Recent</h3></div>
            <div class="logger-recent-grid" id="loggerRecentActivities"></div>
          </section>

          <section class="gc-add-section gc-duration-section" aria-labelledby="durationTitle">
            <div class="logger-section-head"><h3 id="durationTitle">How long?</h3></div>
            <div class="duration-presets" aria-label="Duration presets">${PRESETS.map((minutes) => `<button type="button" data-duration-preset="${minutes}">${minutes}m</button>`).join('')}<label class="logger-custom-duration"><input id="loggerDuration" type="number" min="1" max="1440" step="1" inputmode="numeric" value="${Number(prefill.minutes || prefill.duration || 30)}" required aria-label="Duration in minutes"><span>min</span></label></div>
          </section>

          <section class="gc-add-section gc-when-section" data-logger-when ${mode === 'planned' ? '' : 'hidden'} aria-labelledby="whenTitle">
            <div class="logger-section-head"><h3 id="whenTitle">When?</h3></div>
            <div class="logger-date-presets"><button type="button" data-logger-date="${state.date}" class="${date === state.date ? 'selected' : ''}">Today</button><button type="button" data-logger-date="${tomorrow}" class="${date === tomorrow ? 'selected' : ''}">Tomorrow</button><button type="button" id="loggerPickDate">Pick date</button></div>
          </section>

          <details class="logger-advanced gc-add-more" ${advancedOpen ? 'open' : ''}>
            <summary><span><strong>More details</strong><small>date · time · focus · note</small></span><span aria-hidden="true">›</span></summary>
            <div class="logger-advanced-grid">
              <label class="logger-field"><span>Date</span><input id="loggerDate" type="date" value="${escapeHtml(date)}" required></label>
              <label class="logger-field"><span>Start time <small>optional</small></span><input id="loggerStartTime" type="time"></label>
              <label class="logger-field logger-full"><span>Focus / variation <small>optional</small></span><input id="loggerSubtype" maxlength="80" placeholder="e.g. warm-up, review, chapter 2"></label>
              <label class="logger-field logger-full"><span>Note <small>optional</small></span><textarea id="loggerNote" maxlength="500" placeholder="Anything worth remembering?"></textarea></label>
            </div>
          </details>

          <button class="logger-save gc-add-save" id="loggerSaveButton" type="submit">${escapeHtml(modeCopy(mode, date).button)}</button>
        </form>
      </section>`;

    fill({
      activity_key: prefill.activityKey || prefill.activity_key || '',
      activity_name: prefill.activityName || prefill.activity_name || '',
      subtype: prefill.subtype || '',
      minutes: prefill.minutes || prefill.duration || 30,
      occurred_on: date,
      started_at: prefill.started_at || '',
      planned_time: prefill.planned_time || '',
      note: prefill.note || ''
    });

    renderRecent();
    host.querySelectorAll('[data-logger-close]').forEach((item) => item.addEventListener('click', close));
    host.querySelectorAll('[data-duration-preset]').forEach((button) => button.addEventListener('click', () => {
      $('#loggerDuration').value = button.dataset.durationPreset;
      host.querySelectorAll('[data-duration-preset]').forEach((node) => node.classList.toggle('selected', node === button));
    }));
    host.querySelectorAll('input[name="loggerEntryMode"]').forEach((item) => item.addEventListener('change', updateModeUi));
    host.querySelectorAll('[data-logger-date]').forEach((button) => button.addEventListener('click', () => {
      $('#loggerDate').value = button.dataset.loggerDate;
      host.querySelectorAll('[data-logger-date]').forEach((node) => node.classList.toggle('selected', node === button));
      updateModeUi();
    }));
    $('#loggerPickDate')?.addEventListener('click', () => {
      const details = host.querySelector('.logger-advanced');
      if (details) details.open = true;
      $('#loggerDate')?.focus();
    });
    $('#loggerDate')?.addEventListener('change', () => {
      host.querySelectorAll('[data-logger-date]').forEach((node) => node.classList.toggle('selected', node.dataset.loggerDate === $('#loggerDate').value));
      updateModeUi();
    });
    $('#loggerActivityQuery')?.addEventListener('input', (event) => {
      if ($('#loggerActivityKey')) $('#loggerActivityKey').value = '';
      selectedSummary(null);
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
      if (!Number.isInteger(goalId) || goalId <= 0) return toast('Choose what this Activity supports');
      try {
        const created = await activityCapability.create({ goal_id: goalId, name, description: null, sort_order: 100 });
        activities.push(created);
        selectActivity(created);
        renderRecent();
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
          toast(entryMode === 'in_progress' ? 'Started' : `Added to ${dayLabel(occurredOn)}`);
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

        if (prefill.dailyPlanId) await completeDailyPlanItem(prefill.dailyPlanId);

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