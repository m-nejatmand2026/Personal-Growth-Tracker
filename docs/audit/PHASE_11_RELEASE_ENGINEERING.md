# Engineering audit — Phase 11: Release engineering

Status: **COMPLETE — PREVIEW/PRODUCTION SEPARATION HARDENED; MAIN PROTECTION REMAINS OPEN**

Audit context: Growth Compass — Version 1 Beta. Preview is continuously delivered after Quality; production remains an explicit owner-approved release action.

## Overall assessment

Release engineering is now appropriately conservative for an owner-only private Beta. Automatic GitHub workflows can test and deploy Preview, but cannot apply D1 migrations or deploy production. Preview CI has least-privilege Cloudflare credentials and no D1 Write permission. Production database and Worker steps are documented separately with compatibility/recovery checks.

This phase removes ambiguous local scripts where `npm run deploy` or `db:migrate:remote` implicitly meant production, adds repository-wide workflow safety gates, and introduces `docs/RELEASE_RUNBOOK.md`.

The primary remaining governance gap is GitHub branch protection: `main` is currently not protected. That is tolerable while the repository is controlled by one owner and production remains manual, but it must be addressed before broader collaboration/public release automation.

---

## R1 — Automatic deployment is Preview-only

**Status:** PASS

The trusted GitHub deploy workflow:

- triggers only after successful Quality for the trusted feature branch/repository;
- checks out the exact Quality-tested SHA;
- rejects production D1 identity;
- refuses deployment with pending Preview migrations;
- never applies migrations;
- deploys with explicit `--env preview --name personal-growth-tracker-preview`;
- verifies Cloudflare Access and data-free D1 health after deployment.

New release-safety tests scan **all GitHub workflow YAML files** and fail if:

- any workflow contains `d1 migrations apply`;
- any Wrangler deploy command is not explicitly `--env preview` and pinned to the Preview Worker.

This makes accidental production CI introduction a release-blocking code change rather than a convention.

## R2 — Preview database mutation authority is intentionally absent from CI

**Status:** PASS

The Cloudflare CI token has Workers Scripts Write + D1 Read and no D1 Write. Therefore normal automatic Preview deployment can inspect migration state but cannot apply schema changes.

This is a strong separation of duties for the current workflow: schema changes remain explicit reviewed operations even though Worker delivery is automatic.

Do not broaden the CI token just to make migrations more convenient.

## R3 — Ambiguous production npm commands existed

**Status:** PASS after remediation  
**Severity before remediation:** HIGH operational footgun

Previous scripts included:

- `npm run deploy` → production Worker;
- `npm run db:migrate:remote` → production D1;
- `npm run db:create` → create another remote production-named D1.

Those names are too easy to run by habit in a Preview-first repository.

Current explicit scripts are:

- `deploy:preview`;
- `deploy:production`;
- `db:migrate:preview`;
- `db:migrate:production`;
- `db:migrate:local`.

The generic production shortcuts and remote database-create shortcut are removed. Release-safety tests protect this contract.

## R4 — Production release sequence is now explicit

**Status:** PASS after remediation

`docs/RELEASE_RUNBOOK.md` now defines:

1. freeze exact accepted SHA;
2. require Quality + successful Preview deploy + human acceptance where applicable;
3. final PR/scope review;
4. review production migration state;
5. record D1 Time Travel checkpoint when migration is required;
6. apply/verify migrations explicitly;
7. production Worker dry-run;
8. explicit production deployment stamped with full Git SHA;
9. authenticated Access/UI/D1 health smoke validation;
10. record Worker Version ID + Git SHA + migration/recovery information;
11. choose Worker rollback vs D1 restore separately when recovery is needed.

The runbook does not authorize a release by itself; explicit product/release acceptance is still required.

## R5 — Production Worker rollback and D1 restore are correctly separated

**Status:** PASS

Release and operations runbooks explicitly reject treating code rollback and database recovery as one atomic action.

A prior Worker may be incompatible with a newer schema; a restored D1 schema may be incompatible with the current Worker. Recovery therefore chooses a compatible code/schema pair deliberately.

This is essential for effective-dated/history-preserving domain data.

## R6 — `main` is not protected

**Status:** CONCERN  
**Severity:** MEDIUM current owner-only Beta; HIGH before collaborators/public production flow  
**Release impact:** broader-collaboration/public-release blocker

GitHub reports:

- `main.protected = false`;
- required status checks enforcement off.

Consequences:

- direct pushes are technically possible;
- force-push/deletion protection is not guaranteed by a repository rule;
- Quality/PR review is an engineering convention rather than enforced branch governance for product code.

Current mitigating context:

- repository is owner-controlled;
- PR #6 remains draft;
- automatic production deploy does not exist;
- post-baseline `main` changes during this audit are intentionally limited to the trusted Preview workflow required for `workflow_run`.

Required before broader collaboration/public release:

Configure a GitHub ruleset/branch protection for `main` that requires the intended PR/Quality path, prevents force-push/deletion and limits bypass to deliberate administrators.

The connected GitHub toolset used by this audit cannot modify branch-protection settings, so no pretend repository change was made.

## R7 — No immutable production tags/releases exist yet

**Status:** ACCEPTED CURRENT BETA / FUTURE REQUIREMENT

GitHub currently has no tags and no GitHub Releases.

That is acceptable because the project has not declared a stable/public release series and Preview deployments are already traced by Git SHA + Cloudflare Worker Version ID.

Before public/general release:

- create immutable version tags for accepted production checkpoints;
- create a GitHub Release containing the release record/known constraints;
- do not tag every Preview deployment.

Choose a versioning policy when the product actually begins a supported release line rather than inventing SemVer commitments prematurely.

## R8 — PR #6 remains intentionally draft

**Status:** PASS / governance decision

Engineering audit progress does not equal product acceptance. The active experience/architecture PR must remain draft until:

- human UX acceptance is complete;
- unresolved release blockers relevant to the release are addressed/accepted;
- production migration/release plan is approved.

Do not auto-mark the PR ready merely because Quality passes.

## R9 — Supply-chain release provenance is improved but not complete

**Status:** CONCERN  
**Severity:** MEDIUM before broader/public release

Positive controls:

- GitHub Actions are pinned to immutable full SHAs;
- Wrangler version is pinned in CI;
- Quality does not install browser/runtime dependencies because none are needed for tests;
- deploy records exact tested SHA in Cloudflare version metadata.

Remaining concern from Phase 2:

There is no npm lockfile, so local/dev dependency resolution around Wrangler is not captured as a full transitive dependency snapshot.

Before broader contributor/release use, decide whether to commit a lockfile and use a deterministic dependency-install convention for local/tooling work. Do not add dependencies merely to justify a lockfile.

## R10 — Production release automation is intentionally absent

**Status:** PASS for current Beta

There is no GitHub production-deploy workflow. This is deliberate.

The repository first needs:

- product/UX acceptance;
- branch governance;
- public identity/data readiness where relevant;
- mature integration/browser tests;
- practiced recovery.

Only then should production automation be designed, with a distinct production credential/security boundary and explicit approval/environment gate. Never reuse the Preview service token as production authority.

## Verification checkpoint

Phase 11 repository changes include:

- explicit production/Preview npm script names;
- removal of remote database-create shortcut;
- `tests/release-safety.test.js` workflow/command guards;
- `docs/RELEASE_RUNBOOK.md`;
- documentation-map integration.

Quality passed on the Phase 11 implementation head before this audit record was added. The audit-record head must also pass the full Quality gate before Phase 11 is frozen.

## Phase 11 decision

**Release-engineering direction: continue.** Preview delivery is strongly isolated from production and production actions are explicit enough for the current private Beta.

Before broader collaboration/public production release:

1. protect `main` with GitHub ruleset/branch protection (R6);
2. decide deterministic dependency-lock strategy (R9);
3. execute the controlled Preview D1 recovery drill from Phase 6;
4. add the Worker+D1 integration and browser E2E layers;
5. create immutable production tags/releases when a supported release line begins.

Production Worker code and production D1 were not changed by this phase.
