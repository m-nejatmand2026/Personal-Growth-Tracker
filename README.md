# Growth Compass — Version 1 Beta

Growth Compass is a modular personal-development planning and progress application built as a Cloudflare Worker + D1 modular monolith with a native HTML/CSS/JavaScript frontend.

The current repository is an actively audited **private Beta**, not a public/multi-user release.

## Product model

The canonical generic lifecycle is:

```text
Area → Goal → Activity → Progress Record
```

Supporting capabilities include:

- Today composition;
- Plans and effective-dated Capacity;
- Daily Plan intentions;
- Journal;
- Wellbeing observations;
- Progress history;
- evidence-gated Insights;
- Universal Logger;
- Wellness Boost, with Meditation as its first practice type.

Important product rules include:

- planned intention is not factual Progress;
- no automatic catch-up debt or streak pressure;
- historical facts are preserved;
- Wellbeing changes interpretation, not historical records;
- Insights are association/descriptive evidence, not causal claims;
- Capacity is concrete time math, not a productivity or moral score;
- Journal remains separate from Progress/Insights/AI unless an explicit future contract says otherwise;
- Wellness Boost does not silently write Progress or Wellbeing data.

## Architecture

Growth Compass is deliberately a **modular monolith**. Business capabilities own their routes, validation, domain rules, persistence and UI. Cross-module interaction uses declared public contracts/events; private cross-module imports/table reads are release-blocking architecture violations.

Read these first:

1. [`docs/MODULARITY_STANDARD.md`](docs/MODULARITY_STANDARD.md) — mandatory isolation rules; wins architecture conflicts.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — current system architecture.
3. [`docs/EXPERIENCE_ARCHITECTURE.md`](docs/EXPERIENCE_ARCHITECTURE.md) — shared product/experience architecture.
4. [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) — Version 1 HTTP boundary rules.
5. [`docs/DOCUMENTATION_MAP.md`](docs/DOCUMENTATION_MAP.md) — document categories and precedence.

## Stack

- Cloudflare Workers + Workers Assets
- Cloudflare D1
- native HTML/CSS/JavaScript ES modules
- PWA metadata/install experience
- Node built-in test runner
- GitHub Actions
- Wrangler `4.123.0`
- no frontend framework and no browser runtime dependency

## Environments

Production Worker:

`personal-growth-tracker.m-nejatmand.workers.dev`

Preview Worker:

`personal-growth-tracker-preview.m-nejatmand.workers.dev`

Both stable Worker URLs are protected by Cloudflare Access during the owner-only private Beta.

Preview D1 and production D1 are separate databases. Never infer the target database from a Worker name alone; deployment/migration procedures verify the exact configured database ID.

## Normal development workflow

The normal workflow is cloud/device-independent:

```text
feature/experience-refinement change
        ↓
GitHub Quality on the exact PR head SHA
        ↓
automatic guarded Preview deployment
        ↓
Cloudflare Access boundary check
        ↓
UI + data-free D1 health smoke test
```

A local clone, PowerShell, Wrangler login or manual deploy is **not required** for normal Preview iteration.

See [`docs/DEVELOPMENT_WORKFLOW.md`](docs/DEVELOPMENT_WORKFLOW.md).

### Local development is optional

If a local troubleshooting/dev environment is intentionally needed:

```sh
npm install
npm test
npm run dev
```

Do not create or replace remote D1 databases from README instructions. Remote migration/deployment actions use the reviewed runbooks and exact environment configuration.

## Database changes

Automatic Preview deployment never applies D1 migrations. Pending Preview migrations intentionally stop deployment until they are reviewed/applied explicitly.

Use [`docs/D1_MIGRATION_RUNBOOK.md`](docs/D1_MIGRATION_RUNBOOK.md) for every remote schema/data migration. Production migrations require explicit release approval and a recorded recovery checkpoint.

## Operations and security

- [`docs/PRIVATE_BETA_ACCESS.md`](docs/PRIVATE_BETA_ACCESS.md) — current Cloudflare Access perimeter.
- [`docs/OPERATIONS_RUNBOOK.md`](docs/OPERATIONS_RUNBOOK.md) — incidents, Worker versions/rollback, health checks and operational evidence.
- API JSON is private/no-store by default.
- Preview CI has no D1 Write permission and no production deployment authority.
- The current application still uses the seeded single/default profile internally; do not onboard unrelated users until application-level identity/profile authorization is intentionally implemented.

Never commit API tokens, Access service-token secrets, `.dev.vars`, `.env` secrets or private user data.

## Tests and engineering audit

Run the complete fast gate with:

```sh
npm test
```

The suite protects domain behavior, modularity boundaries, migration ownership, API namespace contracts, accessibility/source contracts, preview deployment safety and other regression rules.

The repository is undergoing a systematic 12-phase engineering audit. Audit records live under [`docs/audit/`](docs/audit/) and the plan is [`docs/ENGINEERING_AUDIT_PLAN.md`](docs/ENGINEERING_AUDIT_PLAN.md).

Passing source/unit/contract tests do not replace the planned real Worker+D1 integration layer or browser E2E/accessibility/performance validation required before public release.

## Release posture

`feature/experience-refinement` remains the active Preview-validation branch and PR #6 remains a draft until product/UX and engineering acceptance are complete.

Production is not continuously deployed from feature work. A production release requires explicit acceptance, reviewed migrations where applicable, integrity checks, production dry-run/deploy, authenticated smoke validation and rollback readiness.
