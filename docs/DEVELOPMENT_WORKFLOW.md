# Growth Compass development workflow

Status: active engineering workflow for **Growth Compass — Version 1 Beta**.

## Goal

Normal development must not depend on a particular laptop, phone, local clone, shell, or manually installed toolchain.

The standard loop is:

```text
ChatGPT changes the trusted feature branch
        ↓
GitHub Quality runs automatically
        ↓
Quality passes
        ↓
GitHub Deploy Preview runs automatically
        ↓
exact tested SHA is deployed to Cloudflare preview
        ↓
Access boundary + UI + D1 health smoke test passes
```

Local clones are optional backups and troubleshooting tools, not a required part of normal delivery.

## Trusted branches

- `main` is the production/release baseline plus the trusted Preview deployment workflow required by GitHub `workflow_run`.
- `feature/experience-refinement` is the active preview-validation branch.
- Product work remains on the feature branch until explicit production acceptance.
- The preview deployment workflow is anchored on `main` because GitHub `workflow_run` workflows must exist on the default branch to receive completed workflow events.
- Changes to that trusted workflow are mirrored on the feature branch for regression testing before/while the `main` infrastructure copy is synchronized.

## Quality gate

`.github/workflows/quality.yml` runs the unit, contract, modularity, accessibility and regression suite for the active pull request.

Preview deployment is permitted only when all of the following are true:

1. workflow name is `Quality`;
2. Quality conclusion is `success`;
3. the triggering event was `pull_request`;
4. the tested head branch is exactly `feature/experience-refinement`;
5. the head repository is exactly this repository, not a fork.

Quality explicitly checks out the pull-request **head SHA**, not GitHub's synthetic merge commit. Preview later deploys that same head SHA.

## Preview deployment gate

`.github/workflows/deploy-preview.yml` uses the privileged `workflow_run` event only after the unprivileged Quality gate completes.

The deploy job:

- checks out `github.event.workflow_run.head_sha`, the exact feature commit reported by the successful Quality run;
- disables persisted checkout credentials;
- uses read-only GitHub repository permissions;
- verifies the branch, repository and checked-out SHA again before deployment;
- verifies Wrangler still has an explicit `preview` environment;
- verifies Workers Logs observability remains explicitly enabled for production and preview;
- verifies the preview DB binding is exactly `personal-growth-tracker-preview`;
- verifies preview D1 ID is exactly `1937971c-f2f2-4dad-bc65-3d22952584bb`;
- explicitly rejects production D1 ID `a182d8c8-c009-461e-ac7e-04694c1047ab`;
- pins deployment tooling to Wrangler `4.123.0` inside the workflow;
- lists remote preview migrations and refuses deployment if any migration is pending;
- never applies a D1 migration automatically;
- runs a preview dry run;
- deploys only with `--env preview --name personal-growth-tracker-preview`;
- stamps the Cloudflare Worker version with `git:<exact-tested-sha>`;
- proves an anonymous request cannot pass the Preview Access boundary;
- authenticates with the dedicated Preview CI Access service token;
- smoke-tests the root UI and the data-free `/api/health` endpoint, which verifies the D1 binding without reading profile/business data.

Automatic preview deployment does **not** merge product work to `main`, deploy production, or mutate production D1.

## Database rule

Database schema changes are deliberately excluded from automatic deployment.

If preview has pending migrations, the deployment workflow must stop. A migration requires an explicit engineering review of:

- module ownership;
- additive/backward-compatible behavior;
- preview target identity;
- backup/Time Travel state where relevant;
- migration application;
- `PRAGMA quick_check` or equivalent integrity verification.

Only after that explicit migration step may normal automatic preview deployment resume.

See `docs/D1_MIGRATION_RUNBOOK.md`.

## One-time Cloudflare CI bootstrap

Cloudflare Wrangler is non-interactive in CI and requires an API token plus account ID. Cloudflare Access also requires a dedicated service identity for the protected Preview smoke test. These values must never be committed to the repository.

The repository currently uses these GitHub Actions repository secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CF_ACCESS_CLIENT_ID
CF_ACCESS_CLIENT_SECRET
```

The Wrangler API token should be scoped to the single Cloudflare account used by Growth Compass and should grant only the permissions needed by this preview workflow:

- **Workers Scripts Write** — required to deploy the preview Worker;
- **D1 Read** — required to inspect the preview migration state;
- account/resource scope limited to the Growth Compass Cloudflare account wherever Cloudflare permits resource scoping.

Do not grant D1 Write to the CI token. Automatic CI is intentionally unable to apply migrations.

`CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` belong to the dedicated `Growth Compass Preview CI` Cloudflare Access service token. That service identity is for the Preview Access application only and is not production deployment authority.

Do not place any of these credential values in source files, `.env`, workflow YAML, issues, PR comments, documentation, or chat history.

After these repository secrets and the Access policies exist, no local device action is required for ordinary preview iterations.

## Normal working agreement

For an ordinary change:

1. user describes the desired change in ChatGPT;
2. repository work happens on `feature/experience-refinement`;
3. full Quality must be green on the exact feature head;
4. preview deploys automatically from that exact tested SHA;
5. Cloudflare Access + root UI + D1 health smoke tests must pass;
6. ChatGPT verifies Quality and deployment state in GitHub;
7. user evaluates the preview when human UX validation is needed.

No PowerShell, local `git pull`, local Wrangler login, manual GitHub Actions run, or local deploy command is part of the normal path.

## Production remains intentionally different

Production is not continuous deployment during Beta validation.

A production release requires explicit acceptance and a separate release checklist including:

- final PR review;
- production D1 Time Travel/backup checkpoint;
- reviewed production migrations;
- integrity checks;
- production dry run;
- explicit production deployment;
- authenticated production smoke tests;
- rollback readiness.

The preview automation must never be generalized into production deployment merely for convenience.

See `docs/OPERATIONS_RUNBOOK.md` for incident diagnosis/Worker rollback and `docs/D1_MIGRATION_RUNBOOK.md` for database recovery.

## Optional local backup

A local clone may be kept when requested, but it is optional. The canonical mutable source is GitHub, and the preview deployment path is cloud-hosted.
