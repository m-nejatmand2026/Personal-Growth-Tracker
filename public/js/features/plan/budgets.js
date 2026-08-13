import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { formatMinutes } from '../../core/format.js';
import { toast } from '../../core/toast.js';

export async function loadBudgetModel(date) {
  return api(`/api/v1/plan?date=${date}`);
}

function valueForGoal(model, goalId) {
  return (model.values || []).find((value) => Number(value.goal_id) === Number(goalId)) || null;
}

function budgetText(value) {
  if (!value || value.time_target_minutes == null) return 'No time budget';
  const minimum = value.time_minimum_minutes == null ? 'none' : formatMinutes(value.time_minimum_minutes);
  return `${formatMinutes(value.time_target_minutes)} target · ${minimum} minimum · ${escapeHtml(value.period)}`;
}

export function budgetPanelHtml(model, goals) {
  const activeGoals = goals.filter((goal) => goal.status !== 'archived');
  const rows = activeGoals.length ? activeGoals.map((goal) => {
    const value = valueForGoal(model, goal.id);
    return `<div class="manage-row"><div class="manage-main"><div><strong>${escapeHtml(goal.name)}</strong><div class="small muted">${budgetText(value)}</div></div></div><button class="text-action" data-edit-budget="${goal.id}">Edit time</button></div>`;
  }).join('') : '<div class="empty">Add a goal before setting time budgets.</div>';

  return `<div class="card" id="budgetPanel">
    <div class="section-head"><div><h2>Goal time budgets</h2><p>Outcome targets and time allocation are separate. Changing time creates an effective-dated plan version.</p></div><span class="badge">${escapeHtml(model.version?.label || 'No active plan')}</span></div>
    <div class="manage-list">${rows}</div>
    <details class="inline-editor" id="budgetEditor"><summary id="budgetEditorSummary">Edit a goal above</summary>
      <form id="budgetForm" class="stack-form" data-goal-id="">
        <div class="form-grid-2"><label><span>Target hours</span><input id="budgetTargetHours" type="number" min="0" max="8760" step="1" value="0"></label><label><span>Target minutes</span><input id="budgetTargetMinutes" type="number" min="0" max="59" step="1" value="0"></label></div>
        <div class="form-grid-2"><label><span>Minimum hours</span><input id="budgetMinimumHours" type="number" min="0" max="8760" step="1" value="0"></label><label><span>Minimum minutes</span><input id="budgetMinimumMinutes" type="number" min="0" max="59" step="1" value="0"></label></div>
        <label><span>Repeats</span><select id="budgetPeriod"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="none">No repeating budget</option></select></label>
        <label><span>Effective from</span><input id="budgetEffectiveFrom" type="date"><small class="muted">Leave blank for today. Future dates are allowed; backdating is disabled during beta.</small></label>
        <div class="actions"><button class="btn primary" type="submit">Save time budget</button><button class="btn soft" id="cancelBudgetEdit" type="button">Clear</button></div>
      </form>
    </details>
  </div>`;
}

function splitMinutes(minutes) {
  const value = Math.max(0, Number(minutes) || 0);
  return { hours: Math.floor(value / 60), minutes: value % 60 };
}

function totalMinutes(hoursSelector, minutesSelector) {
  return Math.round(Number($(hoursSelector).value || 0) * 60 + Number($(minutesSelector).value || 0));
}

function resetBudgetEditor() {
  const form = $('#budgetForm');
  if (!form) return;
  form.dataset.goalId = '';
  form.reset();
  $('#budgetEditorSummary').textContent = 'Edit a goal above';
}

function populateBudgetEditor(goal, value) {
  const target = splitMinutes(value?.time_target_minutes);
  const minimum = splitMinutes(value?.time_minimum_minutes);
  $('#budgetForm').dataset.goalId = String(goal.id);
  $('#budgetTargetHours').value = target.hours;
  $('#budgetTargetMinutes').value = target.minutes;
  $('#budgetMinimumHours').value = minimum.hours;
  $('#budgetMinimumMinutes').value = minimum.minutes;
  $('#budgetPeriod').value = value?.period || 'weekly';
  $('#budgetEffectiveFrom').value = '';
  $('#budgetEditorSummary').textContent = `Time budget: ${goal.name}`;
  $('#budgetEditor').open = true;
  $('#budgetTargetHours').focus();
}

function normalizedPlanValues(model, goals) {
  return goals.filter((goal) => goal.status !== 'archived').map((goal) => {
    const existing = valueForGoal(model, goal.id);
    return {
      goal_id: goal.id,
      time_target_minutes: existing?.time_target_minutes ?? null,
      time_minimum_minutes: existing?.time_minimum_minutes ?? null,
      quantity_target: existing?.quantity_target ?? null,
      quantity_minimum: existing?.quantity_minimum ?? null,
      period: existing?.period || 'weekly'
    };
  });
}

export function bindBudgetPanel(model, goals, { reloadPlatform }) {
  $$('[data-edit-budget]').forEach((button) => button.addEventListener('click', () => {
    const goal = goals.find((item) => item.id === Number(button.dataset.editBudget));
    if (goal) populateBudgetEditor(goal, valueForGoal(model, goal.id));
  }));
  $('#cancelBudgetEdit')?.addEventListener('click', resetBudgetEditor);

  $('#budgetForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const goalId = Number(event.currentTarget.dataset.goalId || 0);
    if (!goalId) return toast('Choose a goal to edit');
    const target = totalMinutes('#budgetTargetHours', '#budgetTargetMinutes');
    const minimum = totalMinutes('#budgetMinimumHours', '#budgetMinimumMinutes');
    if (minimum > target) return toast('Minimum cannot exceed target');

    const values = normalizedPlanValues(model, goals);
    const selected = values.find((value) => Number(value.goal_id) === goalId);
    if (!selected) return toast('Goal not found');
    selected.time_target_minutes = target;
    selected.time_minimum_minutes = minimum;
    selected.period = $('#budgetPeriod').value;

    const payload = {
      label: 'Plan update',
      goal_values: values
    };
    const effectiveFrom = $('#budgetEffectiveFrom').value;
    if (effectiveFrom) payload.effective_from = effectiveFrom;

    try {
      await api('/api/v1/plan/versions', { method:'POST', body:JSON.stringify(payload) });
      toast('Time budget updated');
      resetBudgetEditor();
      await reloadPlatform();
    } catch (error) {
      toast(error.message || 'Could not update time budget');
    }
  });
}
