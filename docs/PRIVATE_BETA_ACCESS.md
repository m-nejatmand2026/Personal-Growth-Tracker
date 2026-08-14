# Growth Compass private Beta — Cloudflare Access

Status: required operational protection for the owner-only Beta.

This document defines the temporary authentication perimeter for the current single-profile Growth Compass Beta. It does **not** replace the future application-level user identity/profile authorization architecture.

## Why this exists

The current application identity boundary resolves every Version 1 request to the seeded `default` profile. Until public-user authentication exists, the deployed Workers must not be reachable anonymously.

Protect both current Worker URLs:

- production: `personal-growth-tracker.m-nejatmand.workers.dev`
- preview: `personal-growth-tracker-preview.m-nejatmand.workers.dev`

The two are separate Workers. Configure Access on each Worker's `workers.dev` route.

## Human access policy

For each Worker:

1. Open Cloudflare Dashboard → Workers & Pages.
2. Select the Worker.
3. Open Domains / Domains & Routes.
4. On the `workers.dev` route, choose **Enable Cloudflare Access**.
5. Open **Manage Cloudflare Access**.
6. Configure an Allow policy that permits only the owner's identity/email.
7. Use the account's existing identity provider, or Cloudflare One-Time PIN if that is the chosen identity method.
8. Do not add a broad `Everyone` allow rule.

Production needs only the owner human-access policy during the current Beta.

## Preview CI service identity

Automatic GitHub Preview smoke tests need non-browser authentication after Access is enabled.

Create one dedicated service token:

- name: `Growth Compass Preview CI`
- use only for Preview smoke testing
- choose a finite expiry and rotate it deliberately

Cloudflare Dashboard path:

Zero Trust → Access → Service Auth → Service Tokens.

Copy the Client ID and Client Secret immediately. Cloudflare displays the secret only when it is created/rotated.

On the Access application/policy protecting `personal-growth-tracker-preview.m-nejatmand.workers.dev`, add a **Service Auth** policy that includes this specific service token.

Do not grant the Preview service token access to the production Worker unless a future production automation explicitly requires it.

## GitHub Actions secrets

In the GitHub repository:

Settings → Secrets and variables → Actions → Repository secrets.

Add:

- `CLOUDFLARE_ACCESS_CLIENT_ID`
- `CLOUDFLARE_ACCESS_CLIENT_SECRET`

Never commit these values to the repository, `.env`, Wrangler config, documentation, issues, PR comments, or workflow logs.

The Preview workflow sends them only as:

- `CF-Access-Client-Id`
- `CF-Access-Client-Secret`

## CI enforcement behavior

`.github/workflows/deploy-preview.yml` supports a staged rollout:

- before the Access secrets exist, the existing unauthenticated smoke check remains temporarily available so CI does not break during configuration;
- the two Access secrets must always exist as a pair;
- once the pair exists, the workflow first checks that an anonymous request to `/api/v1/areas` does **not** receive a successful 2xx response;
- it then performs authenticated UI and API smoke tests using the service token;
- therefore adding the secrets turns Access protection into an automated release gate rather than a documentation-only expectation.

After Access has been configured successfully, the transitional unauthenticated path should be removed in a later hardening change so Preview CI requires Access credentials unconditionally.

## Verification checklist

### Production

From a signed-out/private browser session:

- production root must require Cloudflare Access authentication;
- `/api/v1/areas` must not expose data anonymously;
- `/api/export` must not expose data anonymously.

After authenticating with the approved owner identity:

- normal Growth Compass UI must load;
- API-backed screens must work;
- export must work only for the authenticated owner.

### Preview

From a signed-out/private browser session:

- preview root must require Cloudflare Access authentication;
- `/api/v1/areas` must not expose data anonymously;
- `/api/export` must not expose data anonymously.

GitHub Preview deployment must then pass its authenticated UI + API smoke checks using the dedicated Preview service token.

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
