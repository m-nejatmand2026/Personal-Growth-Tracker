import {
  capacitySummaryRoute,
  createCapacityCommitmentRoute,
  listCapacityCommitmentsRoute,
  updateCapacityCommitmentRoute
} from '../../routes/capacity.js';

export const capacityModule = Object.freeze({
  id: 'capacity',
  contractVersion: 1,
  dependsOn: ['plans'],
  defaultEnabled: true,
  routes: Object.freeze([
    { method: 'GET', pattern: '/api/v1/capacity', handler: capacitySummaryRoute },
    { method: 'GET', pattern: '/api/v1/capacity/commitments', handler: listCapacityCommitmentsRoute },
    { method: 'POST', pattern: '/api/v1/capacity/commitments', handler: createCapacityCommitmentRoute },
    { method: 'PUT', pattern: /^\/api\/v1\/capacity\/commitments\/\d+$/, handler: updateCapacityCommitmentRoute }
  ]),
  publishes: Object.freeze(['capacity.commitment-created','capacity.commitment-updated']),
  subscribes: Object.freeze([])
});
