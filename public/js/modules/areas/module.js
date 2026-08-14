import {
  areasPanelHtml,
  bindAreasPanel,
  loadAreasModel
} from './ui.js';

export const areasModule = Object.freeze({
  id: 'areas',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([{ name: 'plan', order: 20 }]),
  async load() {
    return loadAreasModel();
  },
  render({ model }) {
    return areasPanelHtml(model);
  },
  bind({ model, reload }) {
    bindAreasPanel(model, { reloadPlatform: reload });
  }
});
