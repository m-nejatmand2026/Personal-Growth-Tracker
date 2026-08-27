import { api } from '../../core/api.js';
import { formatMinutes } from '../../core/format.js';
import {
  bindCapacityPanel,
  capacityPanelHtml,
  capacityTimeFit,
  loadCapacityModel
} from './ui.js';

function planSummary(model) {
  const fit = model?.timeFit?.week || null;
  const status = !fit
    ? { label: 'Still flexible', value: '—', detail: 'time fit unavailable' }
    : fit.overcommittedMinutes > 0
      ? { label: 'Schedule over by', value: formatMinutes(fit.overcommittedMinutes), detail: 'recurring commitments exceed total time' }
      : fit.overByMinutes > 0
        ? { label: 'Plan over by', value: formatMinutes(fit.overByMinutes), detail: 'planned goal time exceeds available time' }
        : { label: 'Still flexible', value: formatMinutes(fit.remainingMinutes), detail: 'not currently assigned to goal time' };

  return Object.freeze([
    Object.freeze({
      id: 'capacity.available-week',
      order: 20,
      label: 'Available this week',
      value: fit ? formatMinutes(fit.availableMinutes) : '—',
      detail: 'after recurring commitments'
    }),
    Object.freeze({
      id: 'capacity.planned-week',
      order: 30,
      label: 'Planned this week',
      value: fit ? formatMinutes(fit.plannedMinutes) : '—',
      detail: 'goal time currently planned'
    }),
    Object.freeze({
      id: 'capacity.time-fit-week',
      order: 40,
      ...status
    })
  ]);
}

export const capacityModule = Object.freeze({
  id: 'capacity',
  contractVersion: 1,
  dependsOn: ['plans'],
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([
    { name: 'plan', order: 10 },
    { name: 'today-capacity', order: 20 }
  ]),
  async load({ date }) {
    return loadCapacityModel(date);
  },
  planSummary({ model }) {
    return planSummary(model);
  },
  render({ model }) {
    return capacityPanelHtml(model);
  },
  bind({ model, reload }) {
    bindCapacityPanel(model, { reloadPlatform: reload });
  },
  timeFit(summary) {
    return capacityTimeFit(summary);
  },
  async loadToday({ date }) {
    const summary = await api(`/api/v1/capacity?date=${encodeURIComponent(date)}&period=day`);
    const fit = capacityTimeFit(summary);
    const status = fit.overcommittedMinutes > 0
      ? `${formatMinutes(fit.overcommittedMinutes)} beyond the time in this day`
      : fit.overByMinutes > 0
        ? `${formatMinutes(fit.overByMinutes)} more planned than available`
        : `${formatMinutes(fit.remainingMinutes)} still flexible today`;
    const description = fit.overcommittedMinutes > 0
      ? 'Recurring commitments exceed the total time in this day. Capacity is physical time math, not a productivity score.'
      : fit.overByMinutes > 0
        ? `${formatMinutes(fit.plannedMinutes)} planned from ${formatMinutes(fit.availableMinutes)} available after recurring commitments.`
        : `${formatMinutes(fit.plannedMinutes)} planned from ${formatMinutes(fit.availableMinutes)} available after recurring commitments.`;

    return Object.freeze({
      id: 'capacity.today',
      title: 'Time today',
      status,
      description,
      metrics: Object.freeze([
        Object.freeze({ label: 'Available', minutes: fit.availableMinutes }),
        Object.freeze({ label: 'Planned', minutes: fit.plannedMinutes }),
        Object.freeze({ label: fit.overByMinutes > 0 ? 'Over by' : 'Still flexible', minutes: fit.overByMinutes || fit.remainingMinutes })
      ])
    });
  }
});
