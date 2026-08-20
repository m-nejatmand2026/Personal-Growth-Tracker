# START HERE — Growth Compass Preview 2

You are taking over the **Growth Compass Preview 2 new-experience program**.

Do not restart strategy from scratch.

## Current operational authority

For infrastructure, migration and authentication rollout, the current authority is:

1. `docs/PREVIEW2_BOOTSTRAP.md`
2. `docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md`
3. the actual workflows under `.github/workflows/`

Older handoff documents remain valuable architecture/design history, but their original bootstrap/deployment details are superseded when they conflict with those current runbooks or the actual workflows.

## Required first actions

1. Read `docs/PREVIEW2_BOOTSTRAP.md` completely.
2. Read `docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md` completely.
3. Read `docs/PREVIEW2_MASTER_HANDOFF.md` and `docs/PREVIEW2_FIGMA_MCP_CODEX_FULL_HANDOFF.md` for architecture/design history.
4. Read `docs/MODULARITY_STANDARD.md`, `docs/ARCHITECTURE.md`, and `docs/EXPERIENCE_ARCHITECTURE.md` before structural code changes.
5. Inspect draft PR #7 and verify the live head of `feature/experience-v2` before modifying code.
6. Confirm Preview 1 and Production remain untouched.
7. When design work resumes, use the current Figma sources referenced by the handoff documents.

## Branch authority

Work only on:

`feature/experience-v2`

Do not use `feature/experience-refinement` for Preview 2 changes.

Do not deploy Production.

PR #7 remains draft until explicit owner acceptance authorizes otherwise.

## Canonical Preview 2 runtime

Worker:

`personal-growth-tracker-preview2`

Canonical origin:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev`

Experience 2:

`https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/experience/2/`

D1:

`personal-growth-tracker-preview2`

Cloudflare Git-generated commit/branch preview URLs are deployment evidence only. They are not the canonical authentication origin and must not be used for `BETTER_AUTH_URL`, OAuth callbacks, tester invitations or the final Access policy.

## Preview 1 protection

Do not modify:

- `feature/experience-refinement`;
- Preview 1 Worker `personal-growth-tracker-preview`;
- Preview 1 D1 `personal-growth-tracker-preview`;
- Preview 1 deployment workflow.

Frozen recovered reference:

`baseline/preview1-recovered-2026-08-16`

at SHA:

`3cf2a65b5918f73e4f182abfdce8589c98d85277`

## Preview 2 dual-experience requirement

Preview 2 exposes one base entry URL.

Opening `/` shows:

- **Experience 1 — Current/Recovered**
- **Experience 2 — New**

Routes:

```text
/                 → Experience Selector
/experience/1/     → frozen current experience
/experience/2/     → new Experience 2
/api/*             → shared Preview 2 backend
```

Experience 1 and Experience 2 are separate frontend implementations, not one app with a theme class or giant conditional stylesheet.

They require separate HTML/CSS/JS entrypoints, service-worker/PWA scopes, cache namespaces and client preference namespaces.

Both may use the same isolated Preview 2 backend/D1. Neither may use Preview 1 D1 or Production D1.

Experience 1 remains protected by automated freeze validation. Quality also rejects direct frontend imports across Experience 1 and Experience 2.

## Product rules that must remain true

- Daily Plan is intention.
- Progress is fact.
- Capacity is real time arithmetic.
- unfinished work does not become shame/debt automatically.
- Insights do not invent causation.
- Wellness Boost remains independent from Wellbeing observations.
- Today and Plan remain composition surfaces.
- unsupported forecasts/scheduling/AI/health claims must not be fabricated.

## Current automation

### Quality

`Quality` runs automatically for PR #7.

### Preview 2 branch deployment

`.github/workflows/deploy-preview2-branch.yml` runs on pushes to exactly:

`feature/experience-v2`

It is the current guarded Preview 2 deployment path. It:

- validates the exact repository/branch;
- runs unit, contract, modularity, Worker/D1 and auth integration tests;
- runs browser acceptance;
- resolves the isolated Preview 2 D1;
- refuses Production/Preview 1 D1 overlap;
- requires the exact authorized Preview 2 migration count and blob pins;
- runs the guarded idempotent Preview 2 migration script;
- requires zero pending migrations afterward;
- deploys only Worker `personal-growth-tracker-preview2`;
- verifies the current auth boundary and isolated D1.

Do not reintroduce the obsolete assumption that normal Preview 2 branch deployment is manual-migration-only.

### PR remote smoke

`.github/workflows/preview2-remote-smoke.yml` independently verifies the staged Preview 2 boundary and isolated resources for PR #7.

Before internal-auth cutover it expects Cloudflare Access to block anonymous entry.

After Access is deliberately removed and Growth Compass auth is proven, GitHub repository variable:

`GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true`

changes the smoke expectation to a public account-status endpoint plus `401` for anonymous private APIs.

Do not use obsolete `GC_PREVIEW2_ENABLED` handoff/bootstrap instructions as the current deployment/auth control.

## Internal authentication activation posture

Current intended sequence:

```text
configure Preview 2 auth Worker secrets while GC_AUTH_MODE is legacy
→ verify all 8 Preview 2 migrations are applied and none are pending
→ set GC_AUTH_MODE=enforced while Cloudflare Access remains ON
→ real owner acceptance
→ disposable tester acceptance and isolation/reset/handoff tests
→ only then remove Cloudflare Access
→ set GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true
→ rerun remote/public-boundary acceptance
```

All auth runtime bindings for this rollout are stored as Preview 2 Worker secrets, including non-sensitive strings such as `GC_AUTH_MODE`, `BETTER_AUTH_URL` and `GC_OWNER_EMAIL`, so Wrangler deployments do not erase them.

Never enable `GC_AUTH_TEST_MODE` on the deployed Worker.

## Normal operating loop

For ordinary Preview 2 work:

```text
inspect current head
→ implement on feature/experience-v2
→ Quality + branch validation
→ guarded migration check/apply
→ deploy only Preview 2
→ remote smoke/evidence
→ inspect result
→ continue
```

Do not repeatedly ask for routine engineering approvals.

Stop only for genuine major product/domain choices, Production or Preview 1 impact, external authorization, destructive data operations, or when the owner must personally compare/test UX or real-account behavior.
