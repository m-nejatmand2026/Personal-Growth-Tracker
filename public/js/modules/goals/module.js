import {
  bindGoalsPanel,
  goalsPanelHtml,
  loadGoalsModel
} from './ui.js';

function planSummary(model, areas) {
  const activeGoals = (model?.goals || []).filter((goal) => goal.status !== 'archived');
  return Object.freeze([
    Object.freeze({
      id: 'goals.active',
      order: 10,
      label: 'Active goals',
      value: activeGoals.length,
      detail: `${areas.length} life areas`
    })
  ]);
}

export const goalsModule = Object.freeze({
  id: 'goals',
  contractVersion: 1,
  dependsOn: ['areas'],
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([{ name: 'plan', order: 30 }]),
  async load() {
    return loadGoalsModel();
  },
  planSummary({ model, models }) {
    return planSummary(model, models.areas?.areas || []);
  },
  render({ model, models }) {
    return goalsPanelHtml(model, models.areas?.areas || []);
  },
  bind({ model, reload, dependencies }) {
    bindGoalsPanel(
      model,
      { reloadPlatform: reload },
      { areasCapability: dependencies?.areas || null }
    );
  }
});
