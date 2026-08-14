import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { toast } from '../../core/toast.js';

export async function loadGoalsModel() {
  const response = await api('/api/v1/goals');
  return { goals: response.items || [] };
}

function goalTargetText(goal) {
  if (goal.target_value == null) return `${escapeHtml(goal.measurement_type)} · ${escapeHtml(goal.target_period)}`;
  return `${escapeHtml(String(goal.target_value))}${goal.unit ? ` ${escapeHtml(goal.unit)}` : ''} · ${escapeHtml(goal.target_period)}`;
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
    <div class="section-head"><div><span class="section-kicker">Goals</span><h2>Choose your direction</h2><p>Start simple: name the goal and place it in a life area. Add measurement details only when they help.</p></div><span class="badge">${activeGoals.length} active</span></div>
    <div class="manage-list">${rows}</div>
    <details class="inline-editor goal-editor" id="goalEditor"><summary id="goalEditorSummary">＋ Add goal</summary>
      <form id="goalForm" class="stack-form" data-goal-id="">
        <label><span>Goal name</span><input id="goalName" maxlength="120" required placeholder="e.g. Build a photography portfolio"></label>
        <div class="goal-area-field">
          <label><span>Life area <small>optional</small></span><select id="goalArea"><option value="">No area</option>${areaOptions}</select></label>
          <button type="button" class="goal-new-area-toggle" id="goalNewAreaToggle" aria-expanded="false" aria-controls="goalNewAreaPanel">＋ New life area</button>
          <div class="goal-new-area-panel" id="goalNewAreaPanel" hidden>
            <label><span>New life area name</span><input id="goalNewAreaName" maxlength="80" placeholder="e.g. Relationships, Creativity, Home"></label>
            <p class="small muted">Create it here without leaving this Goal. You can rename or reorder it later.</p>
            <button type="button" class="btn soft" id="goalNewAreaConfirm">Create life area</button>
          </div>
        </div>
        <details class="advanced-options goal-advanced" id="goalAdvancedOptions">
          <summary>Measurement and other details</summary>
          <div class="advanced-options-body goal-advanced-body">
            <label><span>Measure by</span><select id="goalMeasurement"><option value="time">Time</option><option value="count">Count</option><option value="milestone">Milestone</option><option value="boolean">Yes / No</option><option value="number">Number</option></select></label>
            <label><span>Period</span><select id="goalPeriod"><option value="daily">Daily</option><option value="weekly" selected>Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="custom">Custom</option><option value="none">No repeating period</option></select></label>
            <label><span>Target value</span><input id="goalTarget" type="number" step="any" placeholder="Optional"></label>
            <label><span>Unit</span><input id="goalUnit" maxlength="40" placeholder="minutes, lessons, books..."></label>
            <label><span>Priority</span><select id="goalPriority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></label>
            <label><span>Status</span><select id="goalStatus"><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label>
            <label class="full"><span>Description</span><textarea id="goalDescription" maxlength="1000" placeholder="What would meaningful progress look like?"></textarea></label>
          </div>
        </details>
        <p class="small muted goal-editor-note">You can create a useful goal without a numeric target. Time budgets are managed separately below.</p>
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

function resetGoalEditor() {
  const form = $('#goalForm');
  if (!form) return;
  form.dataset.goalId = '';
  form.reset();
  closeNewAreaPanel();
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
  $('#goalTarget').value = goal.target_value ?? '';
  $('#goalUnit').value = goal.unit || '';
  $('#goalPriority').value = goal.priority || 'medium';
  $('#goalStatus').value = goal.status === 'archived' ? 'active' : (goal.status || 'active');
  $('#goalDescription').value = goal.description || '';
  closeNewAreaPanel();
  $('#goalEditorSummary').textContent = `Edit: ${goal.name}`;
  $('#saveGoalButton').textContent = 'Save changes';
  $('#goalEditor').open = true;
  $('#goalAdvancedOptions').open = true;
  $('#goalName').focus();
}

export function bindGoalsPanel(model, { reloadPlatform, areasCapability = null }) {
  $$('[data-edit-goal]').forEach((button) => button.addEventListener('click', () => {
    const goal = model.goals.find((item) => item.id === Number(button.dataset.editGoal));
    if (goal) populateGoalEditor(goal);
  }));

  $('#cancelGoalEdit')?.addEventListener('click', resetGoalEditor);

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
      unit: $('#goalUnit').value.trim() || null,
      priority: $('#goalPriority').value,
      status: $('#goalStatus').value,
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
