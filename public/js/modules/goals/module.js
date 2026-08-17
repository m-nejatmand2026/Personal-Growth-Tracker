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

function workingSummary(model) {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return Object.freeze((model?.goals || [])
    .filter((goal) => goal.status !== 'archived' && goal.status !== 'completed')
    .sort((a, b) => (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1) || Number(a.id) - Number(b.id))
    .slice(0, 6)
    .map((goal, index) => Object.freeze({
      id: `goals.focus.${goal.id}`,
      order: 10 + index,
      label: goal.name || 'Goal',
      value: goal.area_name || 'Goal',
      detail: goal.priority ? `${goal.priority} priority` : 'Active',
      actionLabel: 'Open'
    })));
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
  planWorkingSummary({ model }) {
    return workingSummary(model);
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
