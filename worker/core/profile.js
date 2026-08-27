export const DEFAULT_PROFILE_ID = 'default';
export const INTERNAL_PROFILE_HEADER = 'x-growth-profile-id';

// Version 1 feature modules resolve profile ownership only through this seam.
// In authenticated runtime the central router overwrites INTERNAL_PROFILE_HEADER
// from the verified server session before dispatch. The default fallback is
// retained for legacy-mode Preview 2 and direct module/unit tests only.
export function resolveProfileId(request) {
  const profileId = request?.headers?.get?.(INTERNAL_PROFILE_HEADER);
  return profileId || DEFAULT_PROFILE_ID;
}
