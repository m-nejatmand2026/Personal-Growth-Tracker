import { renderProgress } from './ui.js';

export const progressModule = Object.freeze({
  id: 'progress',
  contractVersion: 1,
  dependsOn: ['activities'],
  defaultEnabled: true,
  slots: [],
  render({ reload } = {}) {
    return renderProgress({ reload });
  }
});
