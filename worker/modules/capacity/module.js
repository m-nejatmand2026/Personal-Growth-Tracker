import {
  archiveCapacityCommitmentRoute,
  capacitySummaryRoute,
  createCapacityCommitmentRoute,
  listCapacityCommitmentsRoute,
  removeCapacityCommitmentRoute,
  restoreCapacityCommitmentRoute,
  updateCapacityCommitmentRoute
} from './routes.js';

export const capacityModule = Object.freeze({
  id: 'capacity',
  contractVersion: 1,
  dependsOn: ['plans'],
  defaultEnabled: true,
  ownsTables: Object.freeze(['capacity_commitments']),
  compatibilityTables: Object.freeze([]),
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/capacity', handler: capacitySummaryRoute },
    { method: 'GET', pattern: '/api/v1/capacity/commitments', handler: listCapacityCommitmentsRoute },
    { method: 'POST', pattern: '/api/v1/capacity/commitments', handler: createCapacityCommitmentRoute },
    { method: 'POST', pattern: /^\/api\/v1\/capacity\/commitments\/\d+\/restore$/, handler: restoreCapacityCommitmentRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/capacity\/commitments\/\d+\/permanent$/, handler: removeCapacityCommitmentRoute },
    { method: 'DELETE', pattern: /^\/api\/v1\/capacity\/commitments\/\d+$/, handler: archiveCapacityCommitmentRoute },
    { method: 'PUT', pattern: /^\/api\/v1\/capacity\/commitments\/\d+$/, handler: updateCapacityCommitmentRoute }
  ]),
  publishes: Object.freeze(['capacity.commitment-created','capacity.commitment-updated','capacity.commitment-archived','capacity.commitment-restored','capacity.commitment-removed']),
  subscribes: Object.freeze([])
});
