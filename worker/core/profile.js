export const DEFAULT_PROFILE_ID = 'default';

// Beta authentication boundary. All Version 1 platform routes resolve a profile
// through this function so real authentication can replace the implementation
// later without rewriting feature/data modules.
export function resolveProfileId() {
  return DEFAULT_PROFILE_ID;
}
