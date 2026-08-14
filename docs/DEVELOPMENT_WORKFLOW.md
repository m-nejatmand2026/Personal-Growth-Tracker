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
preview smoke test passes
```

Local clones are optional backups and troubleshooting tools, not a required part of normal delivery.

## Trusted branches

- `main` is the production/release baseline.
- `feature/experience-refinement` is the active preview-validation branch.
- Product work remains on the feature branch until explicit production acceptance.
- The preview deployment workflow is anchored on `main` because GitHub `workflow_run` workflows must exist on the default branch to receive completed workflow events.

## Quality gate

`.github/workflows/quality.yml` runs the unit, contract, modularity, accessibility and regression suite for the active pull request.

Preview deployment is permitted only when all of the following are true:

1. workflow name is `Quality`;
2. Quality conclusion is `success`;
3. the triggering event was `pull_request`;
4. the tested head branch is exactly `feature/experience-refinement`;
5. the head repository is exactly this repository, not a fork.

## Preview deployment gate

`.github/workflows/deploy-preview.yml` uses the privileged `workflow_run` event only after the unprivileged Quality gate completes.

The deploy job:

- checks out `github.event.workflow_run.head_sha`, the exact feature commit reported by the successful Quality run;
- disables persisted checkout credentials;
- uses read-only GitHub repository permissions;
- verifies the branch, repository and checked-out SHA again before deployment;
- verifies Wrangler still has an explicit `preview` environment;
- verifies the preview DB binding is exactly `personal-growth-tracker-preview`;
- verifies preview D1 ID is exactly `1937971c-f2f2-4dad-bc65-3d22952584bb`;
- explicitly rejects production D1 ID `a182d8c8-c009-461e-ac7e-04694c1047ab`;
- pins deployment tooling to Wrangler `4.123.0` inside the workflow;
- lists remote preview migrations and refuses deployment if any migration is pending;
- never applies a D1 migration automatically;
- runs a preview dry run;
- deploys only with `--env preview`;
- smoke-tests the preview workers.dev URL for `Growth Compass` after deployment.

Automatic preview deployment does **not** merge `main`, deploy production, or mutate production D1.

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

## One-time Cloudflare CI bootstrap

Cloudflare Wrangler is non-interactive in CI and requires an API token plus account ID. These values must never be committed to the repository.

Create these GitHub repository Actions secrets once:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The token should be scoped to the single Cloudflare account used by Growth Compass and should grant only the permissions needed by this preview workflow:

- **Workers Scripts Write** — required to deploy the preview Worker;
- **D1 Read** — required to inspect the preview migration state;
- account/resource scope limited to the Growth Compass Cloudflare account wherever Cloudflare permits resource scoping.

Do not grant D1 Write to the CI token. Automatic CI is intentionally unable to apply migrations.

Do not place the token in source files, `.env`, workflow YAML, issues, PR comments, or chat history.

After these two repository secrets exist, no local device action is required for ordinary preview iterations.

## Normal working agreement

For an ordinary change:

1. user describes the desired change in ChatGPT;
2. repository work happens on `feature/experience-refinement`;
3. full Quality must be green;
4. preview deploys automatically from the exact tested SHA;
5. ChatGPT verifies Quality and deployment state in GitHub;
6. user evaluates the preview when human UX validation is needed.

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
- smoke tests and rollback readiness.

The preview automation must never be generalized into production deployment merely for convenience.

## Optional local backup

A local clone may be kept when requested, but it is optional. The canonical mutable source is GitHub, and the preview deployment path is cloud-hosted.
