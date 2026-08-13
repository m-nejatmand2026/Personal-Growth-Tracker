import { bindGoalsPanel, goalsPanelHtml, loadGoalsModel } from '../../features/plan/goals.js';

export const goalsModule = Object.freeze({
  id: 'goals',
  contractVersion: 1,
  dependsOn: ['areas'],
  defaultEnabled: true,
  slots: Object.freeze([{ name: 'plan', order: 30 }]),
  async load() {
    return loadGoalsModel();
  },
  render({ model, models }) {
    return goalsPanelHtml(model, models.areas?.areas || []);
  },
  bind({ model, models, reload }) {
    bindGoalsPanel(model, models.areas?.areas || [], { reloadPlatform: reload });
  }
});
