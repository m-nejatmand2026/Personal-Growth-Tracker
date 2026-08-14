# Growth Compass private Beta — Cloudflare Access

Status: active operational protection for the owner-only Beta.

This document defines the temporary authentication perimeter for the current single-profile Growth Compass Beta. It does **not** replace the future application-level user identity/profile authorization architecture.

## Protected Workers

Both stable Worker URLs must be protected with Cloudflare Access using the Worker Access scope **All traffic**:

- production: `personal-growth-tracker.m-nejatmand.workers.dev`
- preview: `personal-growth-tracker-preview.m-nejatmand.workers.dev`

`Previews only` is insufficient because it leaves the stable Worker URL public. The private-Beta perimeter requires **All traffic** for both Workers.

For normal human use, the current Beta uses the Cloudflare account authentication policy. Account membership must remain restricted to trusted owner/admin identities.

## Preview CI service identity

Automatic GitHub Preview smoke tests use one dedicated Cloudflare Access service token:

- name: `Growth Compass Preview CI`
- action: `Service Auth`
- include rule: the specific `Growth Compass Preview CI` service token
- attached only to the Access application/policy protecting `personal-growth-tracker-preview.m-nejatmand.workers.dev`

Do not use `Any Access Service Token`, `Everyone`, a country/IP rule, or attach this CI token to the production Worker.

The service-token secret is shown only when created/rotated. Rotate it deliberately before expiry.

## GitHub Actions secrets

Repository secrets used by Preview automation:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CF_ACCESS_CLIENT_ID`
- `CF_ACCESS_CLIENT_SECRET`

The Cloudflare API token remains least privilege for deployment: Workers Scripts Write + D1 Read, with no D1 Write permission.

Never commit secret values to source, Wrangler config, documentation, issues, PR comments, workflow logs, `.env`, or `.dev.vars`.

The Access credentials are sent only as the standard headers:

- `CF-Access-Client-Id`
- `CF-Access-Client-Secret`

## CI enforcement behavior

`.github/workflows/deploy-preview.yml` treats Access as mandatory.

After successful Quality on the trusted feature branch, the workflow:

1. checks out the exact tested SHA;
2. verifies the trusted repository/branch and preview Worker/D1 identities;
3. requires all four Cloudflare/GitHub repository secrets;
4. refuses deployment when preview D1 migrations are pending;
5. runs a preview-only dry run and deployment;
6. requests `/api/v1/areas` without credentials and fails if that request receives a successful 2xx response;
7. sends the dedicated Access service-token headers and requires both the UI and `/api/v1/areas` to succeed.

There is no unauthenticated Preview smoke-test fallback after Access rollout.

## Verification checklist

### Production

From an unauthenticated/private browser session:

- production root must require Cloudflare Access authentication;
- `/api/v1/areas` must not expose data anonymously;
- `/api/export` must not expose data anonymously.

After authenticating as an approved Cloudflare account member:

- the Growth Compass UI must load;
- API-backed screens must work;
- export must work only after authentication.

### Preview

From an unauthenticated/private browser session:

- preview root must require Cloudflare Access authentication;
- `/api/v1/areas` must not expose data anonymously;
- `/api/export` must not expose data anonymously.

GitHub Preview deployment must then pass the automated anonymous-denial check and the authenticated UI/API smoke test using `Growth Compass Preview CI`.

## What Access does not solve

Cloudflare Access is only the current private-Beta perimeter. Before public/multi-user release Growth Compass still requires:

- server-side user authentication;
- authenticated principal → authorized profile mapping;
- horizontal authorization tests across at least two profiles;
- profile-owned module enablement integrated with identity;
- stronger same-profile database constraints;
- session/logout/recovery/revocation behavior;
- privacy/account deletion and retention rules.

The future public identity system should replace the hard-coded `default` profile boundary without forcing business modules to implement authentication individually.
