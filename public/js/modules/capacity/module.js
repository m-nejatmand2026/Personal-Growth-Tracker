import { api } from '../../core/api.js';
import {
  bindCapacityPanel,
  capacityPanelHtml,
  loadCapacityModel
} from './ui.js';

export const capacityModule = Object.freeze({
  id: 'capacity',
  contractVersion: 1,
  dependsOn: ['plans'],
  defaultEnabled: true,
  slots: Object.freeze([
    { name: 'plan', order: 10 },
    { name: 'today-capacity', order: 20 }
  ]),
  async load({ date }) {
    return loadCapacityModel(date);
  },
  render({ model }) {
    return capacityPanelHtml(model);
  },
  bind({ model, reload }) {
    bindCapacityPanel(model, { reloadPlatform: reload });
  },
  async loadToday({ date }) {
    const summary = await api(`/api/v1/capacity?date=${encodeURIComponent(date)}&period=day`);
    const planLoad = summary.plan_load == null ? null : Number(summary.plan_load);
    return Object.freeze({
      id: 'capacity.today',
      title: 'Time reality today',
      status: planLoad == null ? 'Not available' : `${Math.round(planLoad * 100)}% plan load`,
      description: 'Flexible time is context, not a performance score.',
      metrics: Object.freeze([
        Object.freeze({ label: 'Total', minutes: Number(summary.total_minutes || 0) }),
        Object.freeze({ label: 'Committed', minutes: Number(summary.committed_minutes || 0) }),
        Object.freeze({ label: 'Flexible', minutes: Number(summary.flexible_minutes || 0) }),
        Object.freeze({ label: 'Goals', minutes: Number(summary.planned_goal_minutes || 0) })
      ])
    });
  }
});
