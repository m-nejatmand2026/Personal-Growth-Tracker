import { api } from '../../core/api.js';
import { $, $$, escapeHtml } from '../../core/dom.js';
import { formatMinutes } from '../../core/format.js';
import { toast } from '../../core/toast.js';

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const KINDS = ['sleep','work','commute','life','family','recovery','exercise','other'];

export function capacityTimeFit(summary = {}) {
  const availableMinutes = Math.max(0, Number(summary.flexible_minutes) || 0);
  const plannedMinutes = Math.max(0, Number(summary.planned_goal_minutes) || 0);
  const remainingMinutes = Math.max(0, availableMinutes - plannedMinutes);
  const overByMinutes = Math.max(0, plannedMinutes - availableMinutes);
  const overcommittedMinutes = Math.max(0, Number(summary.overcommitted_minutes) || 0);
  const plannedPct = availableMinutes > 0
    ? Math.round((plannedMinutes / availableMinutes) * 100)
    : (plannedMinutes > 0 ? null : 0);

  return Object.freeze({
    availableMinutes,
    plannedMinutes,
    remainingMinutes,
    overByMinutes,
    overcommittedMinutes,
    plannedPct
  });
}

export async function loadCapacityModel(date) {
  const [day, week, month, commitments] = await Promise.all([
    api(`/api/v1/capacity?date=${date}&period=day`),
    api(`/api/v1/capacity?date=${date}&period=week`),
    api(`/api/v1/capacity?date=${date}&period=month`),
    api(`/api/v1/capacity/commitments?date=${date}`)
  ]);
  return {
    day,
    week,
    month,
    timeFit: Object.freeze({
      day: capacityTimeFit(day),
      week: capacityTimeFit(week),
      month: capacityTimeFit(month)
    }),
    commitments: commitments.items || [],
    selectedDate: date
  };
}

function hoursLabel(minutes) {
  const hours = Number(minutes || 0) / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function periodCard(label, summary) {
  const fit = capacityTimeFit(summary);
  const headline = fit.overcommittedMinutes > 0
    ? `${hoursLabel(fit.overcommittedMinutes)} beyond total time`
    : fit.overByMinutes > 0
      ? `${hoursLabel(fit.overByMinutes)} over available time`
      : `${hoursLabel(fit.remainingMinutes)} still flexible`;
  const context = fit.overcommittedMinutes > 0
    ? 'Recurring commitments exceed the total time in this period.'
    : fit.overByMinutes > 0
      ? 'Planned goal time is higher than the time currently available.'
      : fit.plannedPct == null
        ? 'No flexible time is available for this plan.'
        : `${fit.plannedPct}% of available time is planned.`;

  return `<div class="capacity-card">
    <div class="small muted">${escapeHtml(label)}</div>
    <strong>${escapeHtml(headline)}</strong>
    <div class="capacity-line"><span>Available</span><b>${hoursLabel(fit.availableMinutes)}</b></div>
    <div class="capacity-line"><span>Planned</span><b>${hoursLabel(fit.plannedMinutes)}</b></div>
    <div class="capacity-line"><span>Committed</span><b>${hoursLabel(summary.committed_minutes)}</b></div>
    <div class="capacity-load"><span>${escapeHtml(context)}</span></div>
  </div>`;
}

function maskLabel(mask) {
  const value = Number(mask ?? 127);
  if (value === 127) return 'Every day';
  if (value === 31) return 'Mon–Fri';
  const names = DAY_NAMES.filter((_, index) => value & (1 << index));
  return names.length ? names.join(', ') : 'No days';
}

function customScheduleLabel(item) {
  const values = Array.isArray(item.daily_minutes) && item.daily_minutes.length === 7 ? item.daily_minutes : null;
  if (!values) return `${formatMinutes(item.minutes)} · ${maskLabel(item.weekday_mask)}`;

  const mask = Number(item.weekday_mask ?? 127);
  const pieces = [];
  let start = null;
  let previous = null;
  let currentMinutes = null;

  function flush(endIndex) {
    if (start == null || currentMinutes == null) return;
    const dayLabel = start === endIndex ? DAY_NAMES[start] : `${DAY_NAMES[start]}–${DAY_NAMES[endIndex]}`;
    pieces.push(`${dayLabel} ${formatMinutes(currentMinutes)}`);
  }

  for (let index = 0; index < 7; index += 1) {
    const enabled = (mask & (1 << index)) !== 0;
    const minutes = enabled ? Number(values[index] || 0) : null;
    if (!enabled) {
      flush(previous);
      start = null;
      previous = null;
      currentMinutes = null;
      continue;
    }
    if (start == null) {
      start = index;
      previous = index;
      currentMinutes = minutes;
      continue;
    }
    if (minutes === currentMinutes && index === previous + 1) {
      previous = index;
      continue;
    }
    flush(previous);
    start = index;
    previous = index;
    currentMinutes = minutes;
  }
  flush(previous);
  return pieces.length ? pieces.join(' · ') : 'Custom schedule';
}

function commitmentRows(items) {
  if (!items.length) return '<div class="empty">No recurring commitments yet.</div>';
  return items.map((item) => `<div class="manage-row">
    <div class="manage-main"><div><strong>${escapeHtml(item.name)}</strong><div class="small muted">${escapeHtml(item.kind)} · ${escapeHtml(customScheduleLabel(item))}</div></div></div>
    <button class="text-action" data-edit-commitment="${item.id}">Edit</button>
  </div>`).join('');
}

function kindOptions() {
  return KINDS.map((kind) => `<option value="${kind}">${kind[0].toUpperCase()+kind.slice(1)}</option>`).join('');
}

function weekdayInputs() {
  return DAY_NAMES.map((name, index) => `<label class="weekday-chip"><input type="checkbox" data-weekday-bit="${index}" checked><span>${name}</span></label>`).join('');
}

function advancedDayRows() {
  return DAY_NAMES.map((name, index) => `<div class="daily-schedule-row" data-daily-row="${index}">
    <label class="daily-enabled"><input type="checkbox" data-daily-enabled="${index}" checked><span>${name}</span></label>
    <label><span class="sr-only">${name} hours</span><input type="number" min="0" max="24" step="1" value="1" data-daily-hours="${index}" aria-label="${name} hours"></label>
    <span class="daily-unit">h</span>
    <label><span class="sr-only">${name} minutes</span><input type="number" min="0" max="59" step="1" value="0" data-daily-minutes="${index}" aria-label="${name} minutes"></label>
    <span class="daily-unit">m</span>
  </div>`).join('');
}

export function capacityPanelHtml(model) {
  const monthName = new Intl.DateTimeFormat('en', { month:'long', year:'numeric', timeZone:'UTC' })
    .format(new Date(`${model.month.start}T12:00:00Z`));
  return `<div class="card" id="capacityPanel">
    <div class="section-head"><div><h2>Life capacity</h2><p>See what time is already committed, what remains available, and how much of that available time you planned for your goals.</p></div><span class="badge">Time reality</span></div>
    <div class="capacity-grid">
      ${periodCard('Selected day', model.day)}
      ${periodCard('This week', model.week)}
      ${periodCard(`${monthName} · ${model.month.days} days`, model.month)}
    </div>
    <p class="small muted capacity-note">Available time means time left after recurring commitments. Planned goal time uses part of that available time; neither number is a productivity score.</p>
    <div class="subsection-head"><div><h3>Recurring commitments</h3><p>Easy by default. Customize individual days only when you need to.</p></div></div>
    <div class="manage-list">${commitmentRows(model.commitments)}</div>
    <details class="inline-editor" id="commitmentEditor"><summary id="commitmentEditorSummary">+ Add commitment</summary>
      <form id="commitmentForm" class="stack-form" data-commitment-id="">
        <div class="form-grid-2">
          <label><span>Name</span><input id="commitmentName" maxlength="100" required placeholder="e.g. Sleep"></label>
          <label><span>Type</span><select id="commitmentKind">${kindOptions()}</select></label>
        </div>

        <fieldset class="schedule-mode-fieldset">
          <legend>Schedule detail</legend>
          <label class="mode-choice"><input type="radio" name="commitmentScheduleMode" value="simple" checked><span>Easy</span><small>One duration for selected days</small></label>
          <label class="mode-choice"><input type="radio" name="commitmentScheduleMode" value="custom"><span>Customize by day</span><small>Different duration for each weekday</small></label>
        </fieldset>

        <div id="simpleScheduleFields">
          <div class="form-grid-2">
            <label><span>Hours</span><input id="commitmentHours" type="number" min="0" max="24" step="1" value="1"></label>
            <label><span>Minutes</span><input id="commitmentMinutes" type="number" min="0" max="59" step="1" value="0"></label>
          </div>
          <div><span class="field-label">Days</span><div class="weekday-grid">${weekdayInputs()}</div></div>
        </div>

        <div id="customScheduleFields" hidden>
          <div class="daily-schedule-head"><span>Day</span><span>Duration</span></div>
          <div class="daily-schedule-grid">${advancedDayRows()}</div>
          <p class="small muted">Set each day independently. Disable a day if this commitment does not apply.</p>
        </div>

        <details class="advanced-options" id="commitmentAdvancedOptions">
          <summary>Advanced plan options</summary>
          <div class="advanced-options-body">
            <label><span>Changes effective from</span><input id="commitmentVersionFrom" type="date" value="${escapeHtml(model.selectedDate)}"></label>
            <label><span>Optional end date</span><input id="commitmentEffectiveTo" type="date"></label>
            <p class="small muted">Editing an existing schedule creates a new effective version from this date so earlier capacity history stays unchanged.</p>
          </div>
        </details>

        <label class="check-row"><input id="commitmentProtected" type="checkbox" checked><span>Protected / fixed time</span></label>
        <label class="check-row"><input id="commitmentActive" type="checkbox" checked><span>Active</span></label>
        <div class="actions"><button class="btn primary" type="submit" id="saveCommitmentButton">Add commitment</button><button class="btn soft" type="button" id="cancelCommitmentEdit">Clear</button></div>
      </form>
    </details>
  </div>`;
}

function selectedScheduleMode() {
  return document.querySelector('input[name="commitmentScheduleMode"]:checked')?.value || 'simple';
}

function currentWeekdayMask() {
  if (selectedScheduleMode() === 'custom') {
    return $$('[data-daily-enabled]').reduce((mask, checkbox) => checkbox.checked ? mask | (1 << Number(checkbox.dataset.dailyEnabled)) : mask, 0);
  }
  return $$('[data-weekday-bit]').reduce((mask, checkbox) => checkbox.checked ? mask | (1 << Number(checkbox.dataset.weekdayBit)) : mask, 0);
}

function simpleMinutes() {
  const hours = Number($('#commitmentHours').value || 0);
  const minutes = Number($('#commitmentMinutes').value || 0);
  return Math.round(hours * 60 + minutes);
}

function customDailyMinutes() {
  return DAY_NAMES.map((_, index) => {
    const enabled = $(`[data-daily-enabled="${index}"]`)?.checked;
    if (!enabled) return 0;
    const hours = Number($(`[data-daily-hours="${index}"]`)?.value || 0);
    const minutes = Number($(`[data-daily-minutes="${index}"]`)?.value || 0);
    return Math.round(hours * 60 + minutes);
  });
}

function setMode(mode, copyFromSimple = false) {
  const target = document.querySelector(`input[name="commitmentScheduleMode"][value="${mode}"]`);
  if (target) target.checked = true;
  const custom = mode === 'custom';
  $('#simpleScheduleFields').hidden = custom;
  $('#customScheduleFields').hidden = !custom;
  if (custom && copyFromSimple) {
    const minutes = simpleMinutes();
    $$('[data-daily-enabled]').forEach((checkbox) => {
      const index = Number(checkbox.dataset.dailyEnabled);
      const simpleDay = $(`[data-weekday-bit="${index}"]`);
      checkbox.checked = Boolean(simpleDay?.checked);
      $(`[data-daily-hours="${index}"]`).value = Math.floor(minutes / 60);
      $(`[data-daily-minutes="${index}"]`).value = minutes % 60;
    });
  }
}

function resetCommitmentEditor(model) {
  const form = $('#commitmentForm');
  if (!form) return;
  form.dataset.commitmentId = '';
  form.reset();
  $('#commitmentHours').value = 1;
  $('#commitmentMinutes').value = 0;
  $$('[data-weekday-bit]').forEach((checkbox) => { checkbox.checked = true; });
  $$('[data-daily-enabled]').forEach((checkbox) => { checkbox.checked = true; });
  DAY_NAMES.forEach((_, index) => {
    $(`[data-daily-hours="${index}"]`).value = 1;
    $(`[data-daily-minutes="${index}"]`).value = 0;
  });
  $('#commitmentVersionFrom').value = model.selectedDate;
  $('#commitmentEffectiveTo').value = '';
  $('#commitmentProtected').checked = true;
  $('#commitmentActive').checked = true;
  $('#commitmentAdvancedOptions').open = false;
  setMode('simple');
  $('#commitmentEditorSummary').textContent = '+ Add commitment';
  $('#saveCommitmentButton').textContent = 'Add commitment';
}

function populateCommitmentEditor(item, model) {
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

  const daily = Array.isArray(item.daily_minutes) && item.daily_minutes.length === 7 ? item.daily_minutes : null;
  if (daily) {
    DAY_NAMES.forEach((_, index) => {
      const enabled = (Number(item.weekday_mask) & (1 << index)) !== 0;
      const minutes = Number(daily[index] || 0);
      $(`[data-daily-enabled="${index}"]`).checked = enabled;
      $(`[data-daily-hours="${index}"]`).value = Math.floor(minutes / 60);
      $(`[data-daily-minutes="${index}"]`).value = minutes % 60;
    });
    setMode('custom');
  } else {
    setMode('simple');
  }

  $('#commitmentVersionFrom').value = model.selectedDate;
  $('#commitmentEffectiveTo').value = item.effective_to || '';
  $('#commitmentProtected').checked = Boolean(item.protected);
  $('#commitmentActive').checked = Boolean(item.active);
  $('#commitmentAdvancedOptions').open = false;
  $('#commitmentEditorSummary').textContent = `Edit: ${item.name}`;
  $('#saveCommitmentButton').textContent = 'Save changes';
  $('#commitmentEditor').open = true;
  $('#commitmentName').focus();
}

export function bindCapacityPanel(model, { reloadPlatform }) {
  $$('[data-edit-commitment]').forEach((button) => button.addEventListener('click', () => {
    const item = model.commitments.find((commitment) => commitment.id === Number(button.dataset.editCommitment));
    if (item) populateCommitmentEditor(item, model);
  }));

  $$('input[name="commitmentScheduleMode"]').forEach((radio) => radio.addEventListener('change', () => {
    setMode(radio.value, radio.value === 'custom');
  }));

  $('#cancelCommitmentEdit')?.addEventListener('click', () => resetCommitmentEditor(model));

  $('#commitmentForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = Number(form.dataset.commitmentId || 0);
    const mode = selectedScheduleMode();
    const dailyMinutes = mode === 'custom' ? customDailyMinutes() : null;
    const totalMinutes = mode === 'custom'
      ? Math.max(...dailyMinutes)
      : simpleMinutes();
    const weekdayMask = currentWeekdayMask();
    const versionFrom = $('#commitmentVersionFrom').value || model.selectedDate;
    const effectiveTo = $('#commitmentEffectiveTo').value || null;

    const payload = {
      name: $('#commitmentName').value.trim(),
      kind: $('#commitmentKind').value,
      minutes: mode === 'custom' ? Number(dailyMinutes.find((value) => value > 0) || 0) : totalMinutes,
      weekday_mask: weekdayMask,
      daily_minutes: dailyMinutes,
      effective_from: id ? undefined : versionFrom,
      effective_to: effectiveTo,
      version_from: id ? versionFrom : undefined,
      protected: $('#commitmentProtected').checked,
      active: $('#commitmentActive').checked
    };
    if (!payload.name) return toast('Add a commitment name');
    if (weekdayMask === 0) return toast('Choose at least one day');
    if (totalMinutes < 0 || totalMinutes > 1440) return toast('Duration must fit within 24 hours');
    if (dailyMinutes?.some((value) => value < 0 || value > 1440)) return toast('Each day must fit within 24 hours');

    try {
      const response = await api(id ? `/api/v1/capacity/commitments/${id}` : '/api/v1/capacity/commitments', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      toast(response?.versioned ? 'New schedule version saved' : (id ? 'Commitment updated' : 'Commitment added'));
      resetCommitmentEditor(model);
      await reloadPlatform();
    } catch (error) {
      toast(error.message || 'Could not save commitment');
    }
  });
}
