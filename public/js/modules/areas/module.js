import { api } from '../../core/api.js';
import {
  areasPanelHtml,
  bindAreasPanel,
  loadAreasModel
} from './ui.js';

function areaPath(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) throw new Error('Invalid Area id.');
  return `/api/v1/areas/${numericId}`;
}

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
  async create(input) {
    const response = await api('/api/v1/areas', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return response.item;
  },
  async update(id, input) {
    const response = await api(areaPath(id), {
      method: 'PUT',
      body: JSON.stringify(input)
    });
    return response.item;
  },
  async archive(id) {
    const response = await api(areaPath(id), { method: 'DELETE' });
    return response.item;
  },
  render({ model }) {
    return areasPanelHtml(model);
  },
  bind({ model, reload }) {
    bindAreasPanel(model, { reloadPlatform: reload });
  }
});
