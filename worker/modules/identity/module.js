// Identity is a platform capability rather than a user-facing destination.
// Its manifest exists so authentication/session tables have explicit ownership
// under the same architecture gate as Version 1 business modules.
export const identityModule = Object.freeze({
  id: 'identity',
  contractVersion: 1,
  dependsOn: Object.freeze([]),
  defaultEnabled: true,
  ownsTables: Object.freeze([
    'user',
    'session',
    'account',
    'verification',
    'auth_profile_memberships',
    'auth_invites',
    'auth_security_events'
  ]),
  compatibilityTables: Object.freeze([]),
  routes: Object.freeze([]),
  publishes: Object.freeze([]),
  subscribes: Object.freeze([])
});
