import { bindCapacityPanel, capacityPanelHtml, loadCapacityModel } from '../../features/plan/capacity.js';

export const capacityModule = Object.freeze({
  id: 'capacity',
  contractVersion: 1,
  dependsOn: ['plans'],
  defaultEnabled: true,
  slots: Object.freeze([{ name: 'plan', order: 10 }]),
  async load({ date }) {
    return loadCapacityModel(date);
  },
  render({ model }) {
    return capacityPanelHtml(model);
  },
  bind({ model, reload }) {
    bindCapacityPanel(model, { reloadPlatform: reload });
  }
});
