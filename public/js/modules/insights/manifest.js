import { renderInsights } from './ui.js';

export const insightsModule = Object.freeze({
  id: 'insights',
  contractVersion: 1,
  dependsOn: ['progress', 'wellbeing'],
  defaultEnabled: true,
  publishes: Object.freeze([]),
  subscribes: Object.freeze([]),
  slots: Object.freeze([]),
  render() {
    return renderInsights();
  }
});
