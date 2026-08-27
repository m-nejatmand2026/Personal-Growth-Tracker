# START HERE — Growth Compass Preview 2

You are taking over the **Growth Compass Preview 2 new-experience program**. Do not restart strategy from scratch.

## Current operational authority

Read these before infrastructure, schema, authentication, or structural work:

1. `docs/PREVIEW2_BOOTSTRAP.md`
2. `docs/PREVIEW2_INTERNAL_AUTH_ROLLOUT.md`
3. `docs/MODULARITY_STANDARD.md`
4. `docs/ARCHITECTURE.md`
5. `docs/EXPERIENCE_ARCHITECTURE.md`
6. the actual workflows under `.github/workflows/`

Older handoff documents remain design/architecture history but are superseded when they conflict with the current runbooks or workflows.

## Protected lane

Work only on `feature/experience-v2` and draft PR #7.

Do not modify or deploy:

- `main` / Production;
- `feature/experience-refinement` / Preview 1;
- Preview 1 Worker/D1 `personal-growth-tracker-preview`;
- Production Worker/D1.

PR #7 remains draft until explicit owner acceptance authorizes otherwise.

## Canonical Preview 2 runtime

- Worker: `personal-growth-tracker-preview2`
- D1: `personal-growth-tracker-preview2`
- Normal entry URL: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/`
- Experience 2 deep link: `https://personal-growth-tracker-preview2.m-nejatmand.workers.dev/experience/2/`

The root serves the Experience Selector and is the canonical authentication origin. Cloudflare Git-generated commit/branch URLs are deployment evidence only.

## Dual-experience requirement

Preview 2 keeps separate frontend implementations:

```text
/                  → Experience Selector
/experience/1/     → frozen current experience
/experience/2/     → new Experience 2
/api/*              → shared isolated Preview 2 backend
```

Experience 1 and Experience 2 must retain separate HTML/CSS/JS entrypoints, service-worker/PWA scopes, cache namespaces, and preference namespaces. Neither may use Preview 1 or Production D1.

## Product rules

- Daily Plan is intention.
- Progress is fact.
- Capacity is physical time arithmetic.
- unfinished work is not automatic shame/debt.
- Insights do not invent causation.
- private Journal reflection does not silently become Progress/Insights/Wellbeing evidence.
- Archive is reversible; permanent removal is explicit and destructive.
- unsupported forecasts, scheduling claims, AI claims, or health claims must not be fabricated.

## Current deployment authority

`Quality` is the sole guarded Preview 2 deploy authority for PR #7. It tests the exact PR head, captures rollback identity and a D1 Time Travel bookmark, verifies the exact authorized migration set, applies migrations only to the isolated Preview 2 D1, requires zero pending migrations, deploys only the exact tested head, and verifies the resulting Worker/D1.

`.github/workflows/deploy-preview2-branch.yml` is intentionally non-deploying. It is a branch safety gate only.

`.github/workflows/preview2-remote-smoke.yml` independently checks the staged auth boundary and isolated resources.

The currently authorized schema set contains **ten migrations**, through `0010_journal_archive.sql`.

## Internal authentication activation posture

```text
configure Preview 2 auth Worker secrets while GC_AUTH_MODE is legacy
→ verify all 10 authorized Preview 2 migrations are applied and none are pending
→ set GC_AUTH_MODE=enforced while Cloudflare Access remains ON
→ start at the canonical root and perform real owner acceptance
→ disposable tester isolation/reset/handoff acceptance
→ only then remove Cloudflare Access
→ set GC_PREVIEW2_INTERNAL_AUTH_ENABLED=true
→ rerun remote/public-boundary acceptance
```

All auth runtime bindings for this rollout are stored as Preview 2 Worker secrets so deployments do not erase them. Never enable `GC_AUTH_TEST_MODE` on the deployed Worker.

## Normal operating loop

```text
inspect exact PR head and current workflow state
→ if a prior gate failed, fix the exact failure
→ otherwise implement the next highest-value Preview 2 change
→ add/adjust tests without weakening them
→ Quality exact-head gate
→ guarded Preview 2 migration/deploy only after green tests
→ remote smoke and screenshot evidence
→ inspect rendered result
→ continue
```

Stop only for a genuine major product/domain decision, Preview 1/Production impact, external authorization, destructive data operations without an existing explicit product contract, or real owner/tester acceptance that cannot be simulated.
