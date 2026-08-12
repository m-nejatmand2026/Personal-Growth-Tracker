import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { formatMinutes } from '../../core/format.js';
import { toast } from '../../core/toast.js';

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const KINDS = ['sleep','work','commute','life','family','recovery','exercise','other'];

export async function loadCapacityModel(date) {
  const [day, week, month, commitments] = await Promise.all([
    api(`/api/v1/capacity?date=${date}&period=day`),
    api(`/api/v1/capacity?date=${date}&period=week`),
    api(`/api/v1/capacity?date=${date}&period=month`),
    api('/api/v1/capacity/commitments')
  ]);
  return { day, week, month, commitments: commitments.items || [] };
}

function hoursLabel(minutes) {
  const hours = Number(minutes || 0) / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function planLoadLabel(summary) {
  if (summary.impossible_by_minutes) return 'Impossible';
  const load = Number(summary.plan_load || 0);
  if (load <= 0.5) return 'Spacious';
  if (load <= 0.7) return 'Balanced';
  if (load <= 0.85) return 'Full';
  return 'Very full';
}

function periodCard(label, summary) {
  const loadPct = summary.plan_load == null ? '—' : `${Math.round(Number(summary.plan_load) * 100)}%`;
  return `<div class="capacity-card">
    <div class="small muted">${escapeHtml(label)}</div>
    <strong>${hoursLabel(summary.total_minutes)}</strong>
    <div class="capacity-line"><span>Committed</span><b>${hoursLabel(summary.committed_minutes)}</b></div>
    <div class="capacity-line"><span>Flexible</span><b>${hoursLabel(summary.flexible_minutes)}</b></div>
    <div class="capacity-line"><span>Goals</span><b>${hoursLabel(summary.planned_goal_minutes)}</b></div>
    <div class="capacity-load"><span>${planLoadLabel(summary)}</span><b>${loadPct}</b></div>
  </div>`;
}

function maskLabel(mask) {
  const value = Number(mask ?? 127);
  if (value === 127) return 'Every day';
  if (value === 31) return 'Mon–Fri';
  const names = DAY_NAMES.filter((_, index) => value & (1 << index));
  return names.length ? names.join(', ') : 'No days';
}

function commitmentRows(items) {
  if (!items.length) return '<div class="empty">No recurring commitments yet.</div>';
  return items.map((item) => `<div class="manage-row">
    <div class="manage-main"><div><strong>${escapeHtml(item.name)}</strong><div class="small muted">${escapeHtml(item.kind)} · ${formatMinutes(item.minutes)} · ${escapeHtml(maskLabel(item.weekday_mask))}</div></div></div>
    <button class="text-action" data-edit-commitment="${item.id}">Edit</button>
  </div>`).join('');
}

function kindOptions() {
  return KINDS.map((kind) => `<option value="${kind}">${kind[0].toUpperCase()+kind.slice(1)}</option>`).join('');
}

function weekdayInputs() {
  return DAY_NAMES.map((name, index) => `<label class="weekday-chip"><input type="checkbox" data-weekday-bit="${index}" checked><span>${name}</span></label>`).join('');
}

export function capacityPanelHtml(model) {
  const monthName = new Intl.DateTimeFormat('en', { month:'long', year:'numeric', timeZone:'UTC' })
    .format(new Date(`${model.month.start}T12:00:00Z`));
  return `<div class="card" id="capacityPanel">
    <div class="section-head"><div><h2>Life capacity</h2><p>Time reality before ambition: 24 hours/day, 168 hours/week, and the exact selected calendar month.</p></div><span class="badge">Plan load</span></div>
    <div class="capacity-grid">
      ${periodCard('Selected day', model.day)}
      ${periodCard('This week', model.week)}
      ${periodCard(`${monthName} · ${model.month.days} days`, model.month)}
    </div>
    <p class="small muted capacity-note">Flexible time is not automatically productivity time. Plan Load only compares planned goal time with currently unallocated capacity.</p>
    <div class="subsection-head"><div><h3>Recurring commitments</h3><p>Sleep, work, commute and other protected time are editable.</p></div></div>
    <div class="manage-list">${commitmentRows(model.commitments)}</div>
    <details class="inline-editor" id="commitmentEditor"><summary id="commitmentEditorSummary">+ Add commitment</summary>
      <form id="commitmentForm" class="stack-form" data-commitment-id="">
        <div class="form-grid-2">
          <label><span>Name</span><input id="commitmentName" maxlength="100" required placeholder="e.g. Sleep"></label>
          <label><span>Type</span><select id="commitmentKind">${kindOptions()}</select></label>
        </div>
        <div class="form-grid-2">
          <label><span>Hours</span><input id="commitmentHours" type="number" min="0" max="24" step="1" value="1"></label>
          <label><span>Minutes</span><input id="commitmentMinutes" type="number" min="0" max="59" step="1" value="0"></label>
        </div>
        <div><span class="field-label">Days</span><div class="weekday-grid">${weekdayInputs()}</div></div>
        <label class="check-row"><input id="commitmentProtected" type="checkbox" checked><span>Protected / fixed time</span></label>
        <label class="check-row"><input id="commitmentActive" type="checkbox" checked><span>Active</span></label>
        <div class="actions"><button class="btn primary" type="submit" id="saveCommitmentButton">Add commitment</button><button class="btn soft" type="button" id="cancelCommitmentEdit">Clear</button></div>
      </form>
    </details>
  </div>`;
}

function currentWeekdayMask() {
  return $$('[data-weekday-bit]').reduce((mask, checkbox) => checkbox.checked ? mask | (1 << Number(checkbox.dataset.weekdayBit)) : mask, 0);
}

function resetCommitmentEditor() {
  const form = $('#commitmentForm');
  if (!form) return;
  form.dataset.commitmentId = '';
  form.reset();
  $('#commitmentHours').value = 1;
  $('#commitmentMinutes').value = 0;
  $$('[data-weekday-bit]').forEach((checkbox) => { checkbox.checked = true; });
  $('#commitmentProtected').checked = true;
  $('#commitmentActive').checked = true;
  $('#commitmentEditorSummary').textContent = '+ Add commitment';
  $('#saveCommitmentButton').textContent = 'Add commitment';
}

function populateCommitmentEditor(item) {
  const form = $('#commitmentForm');
  if (!form) return;
  form.dataset.commitmentId = String(item.id);
  $('#commitmentName').value = item.name || '';
  $('#commitmentKind').value = item.kind || 'other';
  $('#commitmentHours').value = Math.floor(Number(item.minutes || 0) / 60);
  $('#commitmentMinutes').value = Number(item.minutes || 0) % 60;
  $$('[data-weekday-bit]').forEach((checkbox) => {
    checkbox.checked = (Number(item.weekday_mask) & (1 << Number(checkbox.dataset.weekdayBit))) !== 0;
  });
  $('#commitmentProtected').checked = Boolean(item.protected);
  $('#commitmentActive').checked = Boolean(item.active);
  $('#commitmentEditorSummary').textContent = `Edit: ${item.name}`;
  $('#saveCommitmentButton').textContent = 'Save changes';
  $('#commitmentEditor').open = true;
  $('#commitmentName').focus();
}

export function bindCapacityPanel(model, { reloadPlatform }) {
  $$('[data-edit-commitment]').forEach((button) => button.addEventListener('click', () => {
    const item = model.commitments.find((commitment) => commitment.id === Number(button.dataset.editCommitment));
    if (item) populateCommitmentEditor(item);
  }));

  $('#cancelCommitmentEdit')?.addEventListener('click', resetCommitmentEditor);

  $('#commitmentForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = Number(form.dataset.commitmentId || 0);
    const hours = Number($('#commitmentHours').value || 0);
    const minutes = Number($('#commitmentMinutes').value || 0);
    const totalMinutes = Math.round(hours * 60 + minutes);
    const payload = {
      name: $('#commitmentName').value.trim(),
      kind: $('#commitmentKind').value,
      minutes: totalMinutes,
      weekday_mask: currentWeekdayMask(),
      protected: $('#commitmentProtected').checked,
      active: $('#commitmentActive').checked
    };
    if (!payload.name) return toast('Add a commitment name');
    if (totalMinutes < 0 || totalMinutes > 1440) return toast('Duration must fit within 24 hours');
    try {
      await api(id ? `/api/v1/capacity/commitments/${id}` : '/api/v1/capacity/commitments', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      toast(id ? 'Commitment updated' : 'Commitment added');
      resetCommitmentEditor();
      await reloadPlatform();
    } catch (error) {
      toast(error.message || 'Could not save commitment');
    }
  });
}
