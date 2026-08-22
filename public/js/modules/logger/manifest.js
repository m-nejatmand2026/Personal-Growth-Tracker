import { createLogger } from './ui.js';

export const loggerModule = Object.freeze({
  id: 'logger',
  contractVersion: 1,
  dependsOn: ['activities', 'progress', 'daily-plan'],
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([]),
  create(options = {}) {
    return createLogger(options);
  }
});
