export const wellbeingModule = Object.freeze({
  id: 'wellbeing',
  contractVersion: 1,
  dependsOn: Object.freeze([]),
  defaultEnabled: true,
  ownsTables: Object.freeze([
    'energy_logs_v1',
    'sleep_logs_v1',
    'day_context_logs_v1'
  ]),
  compatibilityTables: Object.freeze(['energy_logs']),
  routes: Object.freeze([]),
  publishes: Object.freeze(['wellbeing.energy-recorded']),
  subscribes: Object.freeze([])
});
