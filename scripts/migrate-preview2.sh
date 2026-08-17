#!/usr/bin/env bash
set -euo pipefail

readonly TARGET_NAME='personal-growth-tracker-preview2'
readonly TARGET_ENV='preview2'
readonly PRODUCTION_D1_ID='a182d8c8-c009-461e-ac7e-04694c1047ab'
readonly PREVIEW1_D1_ID='1937971c-f2f2-4dad-bc65-3d22952584bb'
readonly REQUIRED_CONFIRMATION='personal-growth-tracker-preview2'
readonly WRANGLER_VERSION='4.123.0'

fail() {
  printf 'Preview 2 migration refused: %s\n' "$*" >&2
  exit 1
}

[[ "${GC_PREVIEW2_MIGRATION_CONFIRM:-}" == "$REQUIRED_CONFIRMATION" ]] || \
  fail "set GC_PREVIEW2_MIGRATION_CONFIRM=$REQUIRED_CONFIRMATION for this explicit one-time operation"
[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || fail 'CLOUDFLARE_API_TOKEN is required'
[[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]] || fail 'CLOUDFLARE_ACCOUNT_ID is required'
[[ -f wrangler.jsonc ]] || fail 'run from the repository root; wrangler.jsonc was not found'
[[ -d migrations ]] || fail 'migrations directory was not found'

list_file="$(mktemp)"
config_file="$(mktemp --suffix=.json)"
trap 'rm -f "$list_file" "$config_file"' EXIT

npx --yes "wrangler@${WRANGLER_VERSION}" d1 list --json > "$list_file"

db_id="$(node - "$list_file" <<'NODE'
const fs = require('fs');
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const list = Array.isArray(raw) ? raw : (raw.result || raw.databases || []);
const matches = list.filter((item) => item && item.name === 'personal-growth-tracker-preview2');
if (matches.length !== 1) {
  throw new Error(`Expected exactly one Preview 2 D1 database, found ${matches.length}`);
}
const id = matches[0].uuid || matches[0].id || matches[0].database_id || '';
if (!id) throw new Error('Preview 2 D1 has no identifier');
process.stdout.write(id);
NODE
)"

[[ -n "$db_id" ]] || fail 'resolved Preview 2 D1 id is empty'
[[ "$db_id" != "$PRODUCTION_D1_ID" ]] || fail 'resolved D1 is Production'
[[ "$db_id" != "$PREVIEW1_D1_ID" ]] || fail 'resolved D1 is Preview 1'

node - "$db_id" "$config_file" <<'NODE'
const fs = require('fs');
const id = process.argv[2];
const out = process.argv[3];
const config = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
const prod = config.d1_databases?.find((item) => item.binding === 'DB');
const preview1 = config.env?.preview?.d1_databases?.find((item) => item.binding === 'DB');
if (config.name !== 'personal-growth-tracker') throw new Error(`Unexpected Worker base name: ${config.name}`);
if (!prod?.database_id || !preview1?.database_id) throw new Error('Production and Preview 1 D1 identities must stay explicit');
if (prod.database_id !== 'a182d8c8-c009-461e-ac7e-04694c1047ab') throw new Error('Production D1 identity changed; refusing migration');
if (preview1.database_id !== '1937971c-f2f2-4dad-bc65-3d22952584bb') throw new Error('Preview 1 D1 identity changed; refusing migration');
if (id === prod.database_id || id === preview1.database_id) throw new Error('Preview 2 D1 collides with an existing environment');
config.env ||= {};
config.env.preview2 = {
  name: 'personal-growth-tracker-preview2',
  observability: { enabled: true, head_sampling_rate: 1 },
  d1_databases: [{
    binding: 'DB',
    database_name: 'personal-growth-tracker-preview2',
    database_id: id,
    migrations_dir: 'migrations'
  }]
};
fs.writeFileSync(out, JSON.stringify(config, null, 2));
NODE

printf 'Target verified: %s (%s)\n' "$TARGET_NAME" "$db_id"

before="$(npx --yes "wrangler@${WRANGLER_VERSION}" d1 migrations list DB --remote --env "$TARGET_ENV" --config "$config_file" 2>&1)"
printf '%s\n' "$before"

if printf '%s\n' "$before" | grep -F 'No migrations to apply' >/dev/null; then
  printf 'Preview 2 schema is already current; no migration applied.\n'
else
  npx --yes "wrangler@${WRANGLER_VERSION}" d1 migrations apply DB --remote --env "$TARGET_ENV" --config "$config_file"
fi

after="$(npx --yes "wrangler@${WRANGLER_VERSION}" d1 migrations list DB --remote --env "$TARGET_ENV" --config "$config_file" 2>&1)"
printf '%s\n' "$after"
printf '%s\n' "$after" | grep -F 'No migrations to apply' >/dev/null || fail 'pending migrations remain after apply'

integrity="$(npx --yes "wrangler@${WRANGLER_VERSION}" d1 execute DB --remote --env "$TARGET_ENV" --config "$config_file" --command 'PRAGMA quick_check;' 2>&1)"
printf '%s\n' "$integrity"
printf '%s\n' "$integrity" | grep -E '(^|[^A-Za-z])ok([^A-Za-z]|$)' >/dev/null || fail 'PRAGMA quick_check did not report ok'

printf 'Preview 2 migrations and integrity verification completed successfully.\n'
