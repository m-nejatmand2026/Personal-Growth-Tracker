import {
  bindBudgetPanel,
  budgetPanelHtml,
  loadBudgetModel
} from './ui.js';

export const plansModule = Object.freeze({
  id: 'plans',
  contractVersion: 1,
  dependsOn: ['goals'],
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([{ name: 'plan', order: 40 }]),
  async load({ date }) {
    return loadBudgetModel(date);
  },
  render({ model, models }) {
    return budgetPanelHtml(model, models.goals?.goals || []);
  },
  bind({ model, models, reload }) {
    bindBudgetPanel(model, models.goals?.goals || [], { reloadPlatform: reload });
  }
});
