import {
  bindGoalsPanel,
  goalsPanelHtml,
  loadGoalsModel
} from './ui.js';

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
