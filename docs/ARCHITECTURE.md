# Growth Compass — Version 1 modular architecture

Status: beta development. “Version 1” is the product specification target, not a claim that the product is production-ready.

## Purpose
Growth Compass must be easy to change without editing one large frontend file or one large Worker file. The architecture is organized around stable boundaries so a future developer or AI agent can change one feature without understanding the entire application.

## Rules
1. Feature-specific UI, API routes and data access live in feature-oriented modules.
2. Shared `core/` code is generic only; business rules never drift into core utilities.
3. Database changes are sequential migrations; production schema is never changed manually during normal feature work.
4. Historical data is preserved; future plans/targets become effective-dated rather than rewriting the past.
5. Feature branch → isolated preview Worker + preview database → acceptance tests → PR → `main`.
6. No request-scoped mutable global state in the Worker; every Promise is awaited/returned.
7. Cloudflare services are accessed through bindings such as `env.DB`, not Cloudflare REST calls from the Worker.
8. Frontend talks to stable `/api/*` contracts; persistence logic remains server-side.
9. Modularity beats file count: create modules around real responsibilities, not arbitrary tiny wrappers.

## Frontend
```text
public/
  index.html
  styles.css
  js/
    app.js
    config/
      energy.js
      schedule.js
    core/
      api.js
      dom.js
      fallback.js
      format.js
      state.js
      toast.js
    features/
      today.js
      week.js
      plan.js
      history.js
      settings.js
```
Dependency direction: `features -> core/config`. `app.js` is the composition root. Core never imports features.

## Worker
```text
worker/
  index.js
  router.js
  core/
    http.js
    dates.js
  data/
    targets.js
    progress.js
    bootstrap.js
  routes/
    bootstrap.js
    week.js
    history.js
    energy.js
    sessions.js
    targets.js
    momente.js
    roadmap.js
    export.js
```
Dependency direction: `index -> router -> routes -> data/core`.

## Future Version 1 platform modules
As the canonical Version 1 specification is implemented, add feature modules for Areas, Goals, Activities, Capacity, Commitments, Sleep, Context, Plan Versions, Progress, Insights, Universal Logger and AI Planner. When a feature grows beyond one small screen/form, turn `features/foo.js` into `features/foo/` with meaningful submodules such as `view.js`, `model.js`, and `events.js`.

## Database and environment boundary
D1 remains the source of truth. Version 1 introduces generic Areas → Goals → Activities → Progress Records plus effective-dated plans/capacity through additive migrations. Existing beta data is migrated/preserved rather than discarded.

For deployed testing, use a named Wrangler `preview` environment with a separate Worker name and a separate D1 `DB` binding. Production and preview must never share writeable personal data once destructive/edit testing begins. `preview_database_id` is reserved for Wrangler development behavior (not as the production-vs-preview deployment isolation mechanism).

## Change examples
- “Add a goal measurement type” should touch the goal schema/domain, goal UI, calculation strategy, and tests—not Energy or Sleep.
- “Change the Energy UI” should primarily touch the frontend energy/today module; persistence/history should remain stable unless the contract changes.
- “Add another AI provider” must use an adapter; proposal schema, planning rules and approval flow may not depend on one vendor.

## First milestone
The first milestone is behavior-preserving modularization. The beta should look and behave the same while code moves behind clean boundaries. Product redesign starts only after this foundation previews successfully.
