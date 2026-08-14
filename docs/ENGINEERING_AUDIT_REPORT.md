# Growth Compass engineering audit report

Status: in progress for **Growth Compass — Version 1 Beta**.

Audit baseline at start: `1b1eac0166b07656c020725c8053894cebda620d`.

This report records observed evidence rather than treating a green test suite as proof of production readiness. Findings use:

- **PASS** — implementation and enforcement match the intended contract;
- **CONCERN** — the system works, but an engineering contract or maintainability property is incomplete;
- **FAIL** — a required property is materially broken.

Severity is evaluated against the long-term product architecture and public-release target, not only the current single-user private Beta.

---

## Phase 1 — Architecture and modularity

### Overall status: CONCERN

The modular-monolith foundation is strong and substantially enforceable. Module ownership, dependency declarations, SQL boundaries, public contracts, compatibility containment, and graceful dependency removal are unusually well protected for the current Beta stage.

The main unresolved architecture gap is **real profile/user-owned module enablement**. Registries can calculate enabled dependency graphs, but the runtime does not yet persist or apply user/module preferences. This is a mandatory standard item and should be completed before public release or before optional-module proliferation.

### A1 — Module ownership and isolation

**Status:** PASS  
**Severity:** —  
**Release impact:** none

Evidence:

- Worker and frontend module catalogs are explicit composition roots.
- Worker registry validates IDs, contract versions, declared dependencies, cycles, route ownership, table ownership, published-event ownership and default enablement metadata.
- Frontend registry validates dependencies, slots, cycles and cross-module event ownership.
- `tests/architecture-gate.test.js`, module contract tests, and final architecture gates prohibit private cross-module imports.
- Worker SQL scanning prevents a module from reading/writing another module's private tables except explicit compatibility/platform exceptions.
- Migrations from `0006` onward must declare a module owner and are checked against module-owned/compatibility tables.
- shared Version 1 business implementations outside their module directories cannot silently expand.

Assessment:

The current Area → Goal → Activity → Progress chain is explicit and removable, while Daily Plan, Journal, Wellbeing and Wellness Boost remain independent where intended.

### A2 — Profile/user module enablement is not implemented end to end

**Status:** CONCERN  
**Severity:** HIGH  
**Release impact:** public-launch blocker; not a blocker for the current private single-user Beta

Evidence:

- The mandatory modularity standard requires module enablement to be a profile/user preference.
- Both registries implement `enabled(overrides)` and correctly cascade dependency disablement.
- `public/js/app.js` obtains top-level capabilities with `moduleRegistry.get(...)`, which returns installed manifests regardless of enablement state.
- `public/js/features/today.js` similarly obtains Today contributors with direct `.get(...)` calls.
- `worker/router.js` calls `moduleRegistry.match(method, path)` without profile-specific enablement overrides.
- `public/js/features/settings.js` has no module-preference controls.
- Current Version 1 migrations define profiles and business tables but no platform-owned module-preference persistence.

Risk:

Today the system proves that a module *could* be disabled in registry tests, but the installed application cannot actually express or enforce that preference consistently across frontend and Worker routing. Optional future capabilities could therefore become "optional in theory, always-on in runtime."

Required remediation design:

1. add a platform-owned profile module-preference store, not a business-module table;
2. expose a narrow platform API/read model for enabled-module overrides;
3. resolve the enabled set once through the profile/identity boundary;
4. apply the same dependency-resolved set to Worker route matching and frontend composition/navigation;
5. make disabled destinations disappear or degrade gracefully;
6. provide Settings controls only for capabilities that are user-disableable;
7. preserve required/platform modules and dependency rules;
8. add integration tests proving frontend and Worker agree on the enabled set.

Do not implement this as an isolated UI toggle. The data, identity, routing, navigation and dependency behavior must be designed together.

### A3 — Worker event subscription contract

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM  
**Release impact:** resolved

Observed issue:

- frontend registry rejected subscriptions to unpublished events and cross-module subscriptions without a declared dependency;
- Worker registry previously validated only the event string shape and unique publishers;
- `worker/platform/events.js` expected subscription objects with embedded handlers while Worker manifests define subscriptions as event ID strings;
- the dispatcher was not currently used, so the inconsistency was latent rather than a production behavior failure.

Remediation completed during audit:

- Worker registry now rejects unpublished subscriptions;
- a Worker subscriber to another module's event must declare that publisher as a dependency;
- Worker event dispatcher now consumes manifest event IDs and receives runtime handlers separately, keeping manifests side-effect free;
- tests cover unpublished subscriptions, missing dependency declarations, missing runtime handlers and factual dispatch.

Verified checkpoint for this remediation:

- feature SHA `88894ed54823d40e846b25274b55cf2bd56eb823`
- Quality run #287
- **259 / 259 passing**

### A4 — Plan composition surface knows contributor model shapes

**Status:** CONCERN  
**Severity:** MEDIUM  
**Release impact:** not a current Beta blocker; address before the Plan surface gains many more independent contributors

Evidence:

`public/js/features/plan.js` is correctly a host rather than a persistence/API owner, but its overview directly knows details such as:

- `models.areas.areas`;
- `models.goals.goals` and Goal status semantics;
- `models.capacity.timeFit.week`;
- hard-coded presentation order for Goals, Areas, Plans and Capacity.

Risk:

A contributor can remain SQL/private-code isolated while still causing Plan-host churn whenever its internal frontend load-model shape changes. That is a softer form of coupling than a private import, but it increases blast radius as modules evolve.

Recommended remediation:

Introduce explicit composition-facing contribution/read-model contracts for summary data. Plan may know stable contribution contracts and ordering metadata, but should not infer business rules from contributor-private model shapes.

### A5 — Recursive frontend isolation is uneven

**Status:** CONCERN  
**Severity:** MEDIUM  
**Release impact:** maintainability debt, not current Beta blocker

Evidence at the audited checkpoint includes several growing single frontend files:

- Logger UI ≈20 KB;
- Capacity UI ≈17 KB;
- Daily Plan frontend module ≈16 KB;
- Wellness Boost frontend module ≈14 KB plus separate content;
- Goals UI ≈14 KB;
- Journal frontend module ≈10 KB.

Worker modules generally show stronger recursive splitting into `module`, `public`, `routes`, `domain`, and `data` files.

Risk:

A module can satisfy cross-module isolation yet become difficult to change safely internally. This conflicts with the recursive-isolation intent of the modularity standard.

Recommended remediation:

Split only when a real internal responsibility boundary is visible. Prefer private internal contracts such as renderer/controller/player/form/validation pieces over arbitrary line-count splitting. Do this incrementally as each module is next modified; avoid a large cosmetic file shuffle.

### A6 — Route conflict enforcement is exact-registration based

**Status:** CONCERN  
**Severity:** LOW  
**Release impact:** no current conflict found

Evidence:

The Worker registry prevents duplicate route registration based on method plus the literal string/regex representation. It does not prove that two different regular expressions can never overlap.

Current route patterns are small and constrained, and no conflicting runtime path was found in the registered Version 1 surface.

Recommended remediation:

As route count grows, add stable route IDs and/or a table of representative concrete paths used to verify single ownership. Do not attempt a general regex-intersection solver.

### A7 — Architecture documentation contains future examples that can read as current state

**Status:** CONCERN  
**Severity:** LOW  
**Release impact:** documentation debt only

Evidence:

`docs/ARCHITECTURE.md` and the modularity standard still contain illustrative future Today/module examples involving Sleep, Energy and AI Planner terminology while the live catalog now contains Wellbeing, Daily Plan, Journal and Wellness Boost.

Recommended remediation:

Keep useful future examples but label them explicitly as examples/future capabilities, and add the current live catalog/read-model picture during the documentation audit phase.

### Phase 1 decision

**Architecture direction: continue.** No evidence supports rewriting the application or moving to microservices/framework churn. The modular-monolith choice remains appropriate.

Before public/global release, A2 must be resolved. A4 and A5 should be reduced progressively as the relevant surfaces/modules are next changed. A6/A7 are low-risk hardening/documentation items.

Production remains untouched.

---

## Phase 2 — CI/CD and supply-chain safety

### Overall status: CONCERN

The preview delivery path has strong environment separation, least-privilege Cloudflare credentials, migration refusal, dry-run deployment and smoke testing. The audit nevertheless found one important correctness flaw in the original chain and several reproducibility/hardening issues.

### C1 — Quality and Preview were not using the same tested commit

**Status:** PASS after remediation  
**Severity before remediation:** HIGH  
**Release impact:** resolved before production use

Observed evidence from the real GitHub logs:

- `pull_request` Quality used the default `actions/checkout` behavior and checked out GitHub's synthetic `refs/pull/6/merge` commit;
- `workflow_run.head_sha` identified the feature-branch head;
- Deploy Preview then checked out and deployed that head SHA;
- therefore the previous statement "deploy the exact tested SHA" was not literally true.

GitHub documents that pull-request workflows normally test the merge commit. The deployment contract, however, is intentionally a branch-head preview contract.

Remediation:

- Quality now explicitly checks out `${{ github.event.pull_request.head.sha || github.sha }}`;
- checkout credentials are not persisted;
- preview continues to check out `workflow_run.head_sha`;
- release-blocking tests require the two workflows to use the same head-SHA contract.

### C2 — Action references used movable major-version tags

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM  
**Release impact:** resolved

GitHub's secure-use guidance states that a full-length commit SHA is the immutable way to reference an Action. Quality and Deploy Preview previously used `actions/checkout@v6` and `actions/setup-node@v6`.

Remediation:

- checkout pinned to `d23441a48e516b6c34aea4fa41551a30e30af803`;
- setup-node pinned to `249970729cb0ef3589644e2896645e5dc5ba9c38`;
- these SHAs were observed from successful GitHub-hosted runs before pinning;
- regression tests reject a return to mutable `@vN` references for these workflow actions.

### C3 — Quality installed dependencies it did not need

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM  
**Release impact:** resolved for Quality

The test suite uses Node's built-in test runner and local source modules. `npm install` was therefore an unnecessary network/supply-chain execution step in Quality and was also producing install-script warnings for Wrangler dependencies.

Remediation:

- Quality now runs `npm test` without installing external dependencies;
- Node remains pinned to major 24 through an immutable setup-node action reference;
- Wrangler is not needed to execute the release-blocking test suite.

### C4 — Preview Worker identity was inferred rather than explicitly guarded

**Status:** PASS after remediation  
**Severity before remediation:** MEDIUM  
**Release impact:** resolved

Cloudflare documents that a named Wrangler environment normally creates `<top-level-name>-<environment-name>`, and `wrangler deploy` supports an explicit `--name` option.

Remediation:

- the workflow verifies the top-level Worker name is exactly `personal-growth-tracker`;
- any explicit `env.preview.name` must be exactly `personal-growth-tracker-preview`;
- both dry-run and real deploy pass `--env preview --name personal-growth-tracker-preview`;
- the existing exact preview D1 ID/name guards remain in place.

### C5 — Preview smoke testing checked only static UI

**Status:** PASS after remediation  
**Severity before remediation:** LOW  
**Release impact:** resolved

The previous smoke test proved only that the root HTML contained `Growth Compass`. It did not prove Worker API routing plus D1 binding were operational.

Remediation:

- root UI smoke check remains;
- a read-only `/api/v1/areas` request is now also required to succeed after deployment.

### C6 — Dependency graph is not lockfile-reproducible

**Status:** CONCERN  
**Severity:** MEDIUM  
**Release impact:** fix before public release; preferable before broader contributor/developer use

Evidence:

- no `package-lock.json` is committed;
- npm documents `npm ci` as the clean/frozen install intended for automated environments and requires a lockfile;
- the direct Wrangler dev dependency previously used `^4.0.0` and could move across Wrangler 4 releases.

Partial remediation completed:

- `package.json` now pins the direct Wrangler dependency to exact `4.123.0`;
- deployment already invokes exact `wrangler@4.123.0`;
- Quality no longer installs dependencies.

Remaining remediation:

Generate and commit a reviewed lockfile from the pinned dependency graph, then use `npm ci` for any future CI job that actually needs project dependencies. This remains open because the current device-independent GitHub editing path does not need to fabricate a large lockfile by hand.

### C7 — Privileged `workflow_run` deliberately executes trusted branch content

**Status:** CONCERN / accepted constrained risk  
**Severity:** MEDIUM  
**Release impact:** keep under review as contributor model changes

GitHub explicitly warns that privileged `workflow_run` workflows must not execute untrusted pull-request code with secrets.

Current mitigations:

- the run must originate from this repository, not a fork;
- the head branch must be exactly `feature/experience-refinement`;
- GitHub permissions are read-only;
- Cloudflare token is limited to Workers Scripts Write + D1 Read and has no D1 Write;
- preview Worker and D1 identities are checked before credentials are used for deployment;
- automatic migrations are impossible through the workflow;
- deploy uses the exact Quality head SHA.

Assessment:

For the current owner-controlled branch this is a deliberate trusted-code deployment boundary. If external collaborators gain write access or arbitrary same-repository branches become deployable, this design must be revisited before expanding trust.

### C8 — Branch/ruleset enforcement could not be independently inspected

**Status:** EVIDENCE GAP  
**Severity:** LOW now; potentially higher before team/public contribution

The connected GitHub integration can read repository code and workflow runs but returned `403` when asked for branch-protection settings. Therefore this audit does not claim that required-review/required-status/ruleset settings are enabled.

Resolve during release-engineering/security audit using an account context that can inspect repository rules, or verify through GitHub Settings before opening contribution access.

### Phase 2 decision

**CI/CD direction: continue with hardening.** The automatic preview model remains appropriate and is substantially safer after the audit corrections. C6 is the main reproducibility debt. C7 is acceptable only while the deploy branch is trusted and owner-controlled.

No production Worker or production D1 deployment occurred during these corrections.

---

## Phase 3 — Automated tests

Status: **NEXT**.
