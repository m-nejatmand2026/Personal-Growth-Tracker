import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { toast } from '../../core/toast.js';

const HUMAN_MEASUREMENTS = Object.freeze(['time', 'count', 'boolean', 'milestone']);

export async function loadGoalsModel() {
  const response = await api('/api/v1/goals');
  return { goals: response.items || [] };
}

function measurementLabel(type) {
  if (type === 'time') return 'Time spent';
  if (type === 'count' || type === 'number') return 'Quantity';
  if (type === 'boolean') return 'Completed';
  if (type === 'milestone') return 'Milestones';
  return 'Progress';
}

function periodLabel(period) {
  return ({ daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year', custom: 'custom period', none: 'one-time goal' })[period] || period || 'period';
}

function goalTargetText(goal) {
  const method = measurementLabel(goal.measurement_type);
  if (goal.target_value == null) return `${escapeHtml(method)} · no numeric target`;
  const unit = goal.unit ? ` ${escapeHtml(goal.unit)}` : '';
  const period = goal.target_period === 'none' ? '' : ` per ${escapeHtml(periodLabel(goal.target_period))}`;
  return `${escapeHtml(method)} · ${escapeHtml(String(goal.target_value))}${unit}${period}`;
}

function measurementChoices() {
  const choices = [
    ['time', 'Time spent', 'e.g. 3 hours of guitar'],
    ['count', 'Quantity', 'e.g. 50 pages or 10 lessons'],
    ['boolean', 'Completed', 'e.g. submit the application'],
    ['milestone', 'Milestones', 'e.g. finish Level 1']
  ];
  return choices.map(([value, title, example], index) => `<label class="goal-measure-choice"><input type="radio" name="goalMeasureChoice" value="${value}" ${index === 0 ? 'checked' : ''}><span><strong>${title}</strong><small>${example}</small></span></label>`).join('');
}

export function goalsPanelHtml(model, areas) {
  const activeGoals = model.goals.filter((goal) => goal.status !== 'archived');
  const rows = activeGoals.length
    ? activeGoals.map((goal) => `<div class="manage-row goal-manage-row">
        <div class="manage-main"><div>
          <strong>${escapeHtml(goal.name)}</strong>
          <div class="small muted">${escapeHtml(goal.area_name || 'No area')} · ${goalTargetText(goal)} · ${escapeHtml(goal.status)}</div>
        </div></div>
        <div class="row-actions"><button class="text-action" data-edit-goal="${goal.id}">Edit</button><button class="text-action danger-text" data-archive-goal="${goal.id}">Archive</button></div>
      </div>`).join('')
    : '<div class="empty">No goals yet. Add one direction that matters now.</div>';

  const areaOptions = areas.map((area) => `<option value="${area.id}">${escapeHtml(area.name)}</option>`).join('');

  return `<div class="card plan-goals-card" id="goalsPanel">
    <div class="section-head"><div><span class="section-kicker">Goals</span><h2>Choose your direction</h2><p>Name what matters, place it in your life, then choose the simplest way to recognize progress.</p></div><span class="badge">${activeGoals.length} active</span></div>
    <div class="manage-list">${rows}</div>
    <details class="inline-editor goal-editor" id="goalEditor"><summary id="goalEditorSummary">＋ Add goal</summary>
      <form id="goalForm" class="stack-form" data-goal-id="">
        <label><span>What do you want to work toward?</span><input id="goalName" maxlength="120" required placeholder="e.g. Build a photography portfolio"></label>
        <div class="goal-area-field">
          <label><span>Which part of life does this belong to? <small>optional</small></span><select id="goalArea"><option value="">No life area</option>${areaOptions}</select></label>
          <button type="button" class="goal-new-area-toggle" id="goalNewAreaToggle" aria-expanded="false" aria-controls="goalNewAreaPanel">＋ New life area</button>
          <div class="goal-new-area-panel" id="goalNewAreaPanel" hidden>
            <label><span>New life area name</span><input id="goalNewAreaName" maxlength="80" placeholder="e.g. Relationships, Creativity, Home"></label>
            <p class="small muted">Create it here without leaving this Goal. You can rename or reorder it later.</p>
            <button type="button" class="btn soft" id="goalNewAreaConfirm">Create life area</button>
          </div>
        </div>

        <fieldset class="goal-measure-fieldset">
          <legend>How will you know you are making progress?</legend>
          <div class="goal-measure-grid">${measurementChoices()}</div>
          <input id="goalMeasurement" type="hidden" value="time">
        </fieldset>

        <section class="goal-target-builder" id="goalTargetBuilder" aria-labelledby="goalTargetTitle">
          <div><strong id="goalTargetTitle">Optional target</strong><small>Leave the amount empty if you only want to track progress without a target.</small></div>
          <div class="goal-target-sentence">
            <span>Aim for</span>
            <input id="goalTarget" type="number" min="0" step="any" inputmode="decimal" aria-label="Target amount" placeholder="3">
            <input id="goalUnit" maxlength="40" aria-label="Target unit" placeholder="hours, pages, lessons">
            <span id="goalTargetConnector">per</span>
            <select id="goalPeriod" aria-label="Target period"><option value="daily">day</option><option value="weekly" selected>week</option><option value="monthly">month</option><option value="yearly">year</option><option value="custom">custom period</option><option value="none">one-time goal</option></select>
          </div>
        </section>

        <details class="advanced-options goal-advanced" id="goalAdvancedOptions">
          <summary><span>More goal options</span><small>Good-enough minimum, priority, status, notes</small></summary>
          <div class="advanced-options-body goal-advanced-body">
            <label id="goalMinimumField"><span>Good-enough minimum <small>optional</small></span><input id="goalMinimum" type="number" min="0" step="any" placeholder="A smaller amount that still counts as enough"></label>
            <label><span>Priority</span><select id="goalPriority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></label>
            <label><span>Status</span><select id="goalStatus"><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label>
            <label class="full"><span>Why does this matter? <small>optional</small></span><textarea id="goalWhy" maxlength="1000" placeholder="A short reason you want to remember"></textarea></label>
            <label class="full"><span>Notes <small>optional</small></span><textarea id="goalDescription" maxlength="1000" placeholder="Anything else that helps define the goal"></textarea></label>
          </div>
        </details>
        <p class="small muted goal-editor-note">Targets are guidance, not debt. You can save a useful Goal without filling every field.</p>
        <div class="actions"><button class="btn primary" type="submit" id="saveGoalButton">Add goal</button><button class="btn soft" type="button" id="cancelGoalEdit">Clear</button></div>
      </form>
    </details>
  </div>`;
}

function closeNewAreaPanel() {
  const panel = $('#goalNewAreaPanel');
  const toggle = $('#goalNewAreaToggle');
  if (panel) panel.hidden = true;
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  if ($('#goalNewAreaName')) $('#goalNewAreaName').value = '';
}

function presentationMeasurement(type) {
  return HUMAN_MEASUREMENTS.includes(type) ? type : (type === 'number' ? 'count' : 'time');
}

function syncGoalPeriodUi(period = $('#goalPeriod')?.value) {
  const connector = $('#goalTargetConnector');
  if (connector) connector.textContent = period === 'none' ? 'for this' : 'per';
}

function syncMeasurementUi(type, { userChange = false } = {}) {
  const presentation = presentationMeasurement(type);
  const hidden = $('#goalMeasurement');
  if (hidden && userChange) hidden.value = presentation;
  const canonicalType = hidden?.value || type || presentation;

  $$('input[name="goalMeasureChoice"]').forEach((radio) => {
    radio.checked = radio.value === presentation;
  });

  const numeric = canonicalType === 'time' || canonicalType === 'count' || canonicalType === 'number';
  if ($('#goalTargetBuilder')) $('#goalTargetBuilder').hidden = !numeric;
  if ($('#goalMinimumField')) $('#goalMinimumField').hidden = !numeric;

  if (userChange && !numeric) {
    $('#goalTarget').value = '';
    $('#goalMinimum').value = '';
    $('#goalUnit').value = '';
    $('#goalPeriod').value = 'none';
  } else if (userChange && $('#goalPeriod').value === 'none') {
    $('#goalPeriod').value = 'weekly';
  }
}

function resetGoalEditor() {
  const form = $('#goalForm');
  if (!form) return;
  form.dataset.goalId = '';
  form.reset();
  $('#goalMeasurement').value = 'time';
  syncGoalPeriodUi();
  closeNewAreaPanel();
  syncMeasurementUi('time');
  $('#goalAdvancedOptions').open = false;
  $('#goalEditorSummary').textContent = '＋ Add goal';
  $('#saveGoalButton').textContent = 'Add goal';
}

function populateGoalEditor(goal) {
  const form = $('#goalForm');
  if (!form) return;
  form.dataset.goalId = String(goal.id);
  $('#goalName').value = goal.name || '';
  $('#goalArea').value = goal.area_id == null ? '' : String(goal.area_id);
  $('#goalMeasurement').value = goal.measurement_type || 'time';
  $('#goalPeriod').value = goal.target_period || 'weekly';
  syncGoalPeriodUi();
  $('#goalTarget').value = goal.target_value ?? '';
  $('#goalMinimum').value = goal.minimum_value ?? '';
  $('#goalUnit').value = goal.unit || '';
  $('#goalPriority').value = goal.priority || 'medium';
  $('#goalStatus').value = goal.status === 'archived' ? 'active' : (goal.status || 'active');
  $('#goalWhy').value = goal.why_text || '';
  $('#goalDescription').value = goal.description || '';
  closeNewAreaPanel();
  syncMeasurementUi(goal.measurement_type || 'time');
  $('#goalEditorSummary').textContent = `Edit: ${goal.name}`;
  $('#saveGoalButton').textContent = 'Save changes';
  $('#goalEditor').open = true;
  $('#goalAdvancedOptions').open = true;
  $('#goalName').focus();
}

export function bindGoalsPanel(model, { reloadPlatform }, { areasCapability = null } = {}) {
  $$('[data-edit-goal]').forEach((button) => button.addEventListener('click', () => {
    const goal = model.goals.find((item) => item.id === Number(button.dataset.editGoal));
    if (goal) populateGoalEditor(goal);
  }));

  $('#cancelGoalEdit')?.addEventListener('click', resetGoalEditor);

  $$('input[name="goalMeasureChoice"]').forEach((radio) => radio.addEventListener('change', () => {
    syncMeasurementUi(radio.value, { userChange: true });
    syncGoalPeriodUi();
  }));

  $('#goalPeriod')?.addEventListener('change', (event) => syncGoalPeriodUi(event.currentTarget.value));

  $('#goalNewAreaToggle')?.addEventListener('click', () => {
    const panel = $('#goalNewAreaPanel');
    const toggle = $('#goalNewAreaToggle');
    if (!panel || !toggle) return;
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    if (!panel.hidden) $('#goalNewAreaName')?.focus();
  });

  $('#goalNewAreaConfirm')?.addEventListener('click', async () => {
    const name = $('#goalNewAreaName')?.value.trim() || '';
    if (!name) return toast('Add a life area name');
    if (!areasCapability?.create) return toast('Life area creation is temporarily unavailable');

    try {
      const created = await areasCapability.create({
        name,
        template_key: null,
        sort_order: 100
      });
      const select = $('#goalArea');
      if (select && created?.id) {
        const existing = [...select.options].find((option) => option.value === String(created.id));
        if (!existing) select.add(new Option(created.name || name, String(created.id)));
        select.value = String(created.id);
      }
      closeNewAreaPanel();
      toast('Life area created');
      $('#goalName')?.focus();
    } catch (error) {
      toast(error.message || 'Could not create life area');
    }
  });

  $('#goalForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const goalId = Number(form.dataset.goalId || 0);
    const payload = {
      name: $('#goalName').value.trim(),
      area_id: $('#goalArea').value || null,
      measurement_type: $('#goalMeasurement').value,
      target_period: $('#goalPeriod').value,
      target_value: $('#goalTarget').value === '' ? null : Number($('#goalTarget').value),
      minimum_value: $('#goalMinimum').value === '' ? null : Number($('#goalMinimum').value),
      unit: $('#goalUnit').value.trim() || null,
      priority: $('#goalPriority').value,
      status: $('#goalStatus').value,
      why_text: $('#goalWhy').value.trim() || null,
      description: $('#goalDescription').value.trim() || null
    };
    if (!payload.name) return toast('Add a goal name');
    try {
      await api(goalId ? `/api/v1/goals/${goalId}` : '/api/v1/goals', {
        method: goalId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      toast(goalId ? 'Goal updated' : 'Goal added');
      resetGoalEditor();
      await reloadPlatform();
    } catch (error) {
      toast(error.message || 'Could not save goal');
    }
  });

  $$('[data-archive-goal]').forEach((button) => button.addEventListener('click', async () => {
    const goal = model.goals.find((item) => item.id === Number(button.dataset.archiveGoal));
    if (!goal || !window.confirm(`Archive “${goal.name}”? Progress stays in history.`)) return;
    try {
      await api(`/api/v1/goals/${goal.id}`, { method: 'DELETE' });
      toast('Goal archived');
      await reloadPlatform();
    } catch (error) {
      toast(error.message || 'Could not archive goal');
    }
  }));
}
