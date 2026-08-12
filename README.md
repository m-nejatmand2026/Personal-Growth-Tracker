# Growth Compass - Cloudflare personal tracker

A mobile-first, single-user PWA for daily energy check-ins, progress tracking, Momente B1, weekly targets, a six-month plan, an editable long-term compass, history, and full JSON export.

## Deploy to Cloudflare

1. Install dependencies:
   `npm install`
2. Log in:
   `npx wrangler login`
3. Create the D1 database:
   `npx wrangler d1 create personal-growth-tracker`
4. Copy the returned database ID into `wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
5. Apply the schema/seed migration:
   `npm run db:migrate:remote`
6. Deploy:
   `npm run deploy`
7. After deployment, protect the `workers.dev` URL with Cloudflare Access before storing personal records.

For local development, apply the local migration first with `npm run db:migrate:local`, then run `npm run dev`.

## Privacy

This is intentionally single-user. Put the deployed hostname behind Cloudflare Access before entering personal records.

## Data model

- `energy_logs`: one energy-map selection per date
- `sessions`: immutable activity records
- `weekly_targets`: editable current targets
- `momente_lessons`: 24 lesson milestones
- `roadmap_items`: editable six-month plan and long-term compass
- `settings`: schedule-level preferences

Changing future targets does not rewrite historical session or energy records.
