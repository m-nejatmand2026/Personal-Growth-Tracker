import { $, escapeHtml } from '../../core/dom.js';
import { toast } from '../../core/toast.js';

function goalName(goals, goalId) {
  return (goals || []).find((goal) => Number(goal.id) === Number(goalId))?.name || 'Goal unavailable';
}

function goalOptions(goals, selectedId = null) {
  if (!(goals || []).length) return '<option value="">Create an active Goal first</option>';
  return `<option value="">Choose a Goal</option>${goals.map((goal) => `<option value="${Number(goal.id)}" ${Number(goal.id) === Number(selectedId) ? 'selected' : ''}>${escapeHtml(goal.name)}</option>`).join('')}`;
}

function activityRow(item, goals) {
  const description = String(item.description || '').trim();
  return `<article class="activity-manage-row" data-activity-id="${Number(item.id)}">
    <span class="activity-manage-mark" aria-hidden="true">${escapeHtml((item.name || 'A').slice(0, 1).toUpperCase())}</span>
    <div class="activity-manage-copy"><strong>${escapeHtml(item.name || 'Activity')}</strong><small>${escapeHtml(goalName(goals, item.goal_id))}${description ? ` · ${escapeHtml(description)}` : ''}</small></div>
    <div class="activity-manage-actions"><button type="button" data-activity-edit="${Number(item.id)}">Edit</button><button type="button" data-activity-archive="${Number(item.id)}">Archive</button></div>
  </article>`;
}

export function activitiesPanelHtml(model = {}) {
  const items = model.activities || [];
  const goals = model.goals || [];
  return `<section class="activities-panel" id="activitiesPanel" aria-labelledby="activitiesPanelTitle">
    <div class="activities-panel-head"><div><span class="section-kicker">Action library</span><h2 id="activitiesPanelTitle">Activities</h2><p>Reusable things you actually do. Everyday logging stays in Add.</p></div><span>${items.length} active</span></div>
    <details class="activity-editor" id="activityEditor">
      <summary><span><strong>＋ Add activity</strong><small>Create it once, then reuse it in Plan, Start now and Done.</small></span><b aria-hidden="true">›</b></summary>
      <form id="activityManageForm" class="activity-manage-form">
        <input type="hidden" id="activityManageId">
        <label><span>Activity name</span><input id="activityManageName" maxlength="120" required autocomplete="off" placeholder="e.g. German practice"></label>
        <label><span>Supports Goal</span><select id="activityManageGoal" required>${goalOptions(goals)}</select></label>
        <label class="activity-manage-full"><span>Description <small>optional</small></span><input id="activityManageDescription" maxlength="1000" placeholder="A short reminder of what this Activity means"></label>
        <div class="activity-manage-form-actions"><button type="button" id="activityManageCancel" hidden>Cancel edit</button><button type="submit" id="activityManageSave" ${goals.length ? '' : 'disabled'}>Create activity</button></div>
        ${goals.length ? '' : '<p class="activity-manage-help">Activities support a Goal in this Beta. Create an active Goal above first.</p>'}
      </form>
    </details>
    <div class="activity-manage-list">${items.length ? items.map((item) => activityRow(item, goals)).join('') : '<div class="activity-manage-empty"><strong>No reusable Activities yet.</strong><span>Create one here or create it while using Add.</span></div>'}</div>
  </section>`;
}

export function bindActivitiesPanel(model = {}, { create, update, archive, reload } = {}) {
  const items = model.activities || [];
  const goals = model.goals || [];
  const editor = $('#activityEditor');
  const form = $('#activityManageForm');
  const idInput = $('#activityManageId');
  const nameInput = $('#activityManageName');
  const goalInput = $('#activityManageGoal');
  const descriptionInput = $('#activityManageDescription');
  const saveButton = $('#activityManageSave');
  const cancelButton = $('#activityManageCancel');

  const reset = () => {
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (goalInput) goalInput.innerHTML = goalOptions(goals);
    if (descriptionInput) descriptionInput.value = '';
    if (saveButton) saveButton.textContent = 'Create activity';
    if (cancelButton) cancelButton.hidden = true;
  };

  cancelButton?.addEventListener('click', reset);

  document.querySelectorAll('[data-activity-edit]').forEach((button) => button.addEventListener('click', () => {
    const item = items.find((candidate) => Number(candidate.id) === Number(button.dataset.activityEdit));
    if (!item) return;
    if (editor) editor.open = true;
    if (idInput) idInput.value = String(item.id);
    if (nameInput) nameInput.value = item.name || '';
    if (goalInput) goalInput.innerHTML = goalOptions(goals, item.goal_id);
    if (descriptionInput) descriptionInput.value = item.description || '';
    if (saveButton) saveButton.textContent = 'Save changes';
    if (cancelButton) cancelButton.hidden = false;
    nameInput?.focus();
  }));

  document.querySelectorAll('[data-activity-archive]').forEach((button) => button.addEventListener('click', async () => {
    const item = items.find((candidate) => Number(candidate.id) === Number(button.dataset.activityArchive));
    if (!item || !window.confirm(`Archive “${item.name}”? Existing Progress keeps its historical reference.`)) return;
    try {
      await archive?.(item.id);
      toast('Activity archived');
      await reload?.();
    } catch (error) {
      toast(error?.message || 'Could not archive Activity');
    }
  }));

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = Number(idInput?.value || 0);
    const name = nameInput?.value.trim() || '';
    const goalId = Number(goalInput?.value || 0);
    const description = descriptionInput?.value.trim() || null;
    if (!name) return toast('Name the Activity');
    if (!Number.isInteger(goalId) || goalId <= 0) return toast('Choose the Goal this Activity supports');
    try {
      if (id > 0) {
        await update?.(id, { goal_id: goalId, name, description });
        toast('Activity updated');
      } else {
        await create?.({ goal_id: goalId, name, description, sort_order: 100 });
        toast('Activity created');
      }
      reset();
      await reload?.();
    } catch (error) {
      toast(error?.message || 'Could not save Activity');
    }
  });
}
