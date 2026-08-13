import { api } from '../../core/api.js';

export const wellbeingModule = Object.freeze({
  id: 'wellbeing',
  contractVersion: 1,
  dependsOn: [],
  defaultEnabled: true,
  slots: Object.freeze([]),

  async getDay(date) {
    return api(`/api/v1/wellbeing/day?date=${encodeURIComponent(date)}`);
  },

  async listEnergy({ from = null, to = null, limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (limit) params.set('limit', String(limit));
    const response = await api(`/api/v1/wellbeing/energy?${params.toString()}`);
    return response.items || [];
  }
});
