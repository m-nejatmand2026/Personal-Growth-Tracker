#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="${RUNNER_TEMP:-/tmp}/growth-compass-browser-d1-${GITHUB_RUN_ID:-local}-$$"
WORKER_LOG="${RUNNER_TEMP:-/tmp}/growth-compass-browser-worker-$$.log"
WORKER_PID=""

cleanup() {
  if [[ -n "$WORKER_PID" ]]; then
    kill "$WORKER_PID" 2>/dev/null || true
    wait "$WORKER_PID" 2>/dev/null || true
  fi
  rm -rf "$STATE_DIR"
}
trap cleanup EXIT

assert_contains() {
  local label="$1"
  local body="$2"
  local expected="$3"
  if ! grep -F -- "$expected" <<<"$body" >/dev/null; then
    echo "Preview 2 route smoke failed: $label did not contain: $expected" >&2
    printf '%s\n' "$body" | head -c 2400 >&2
    printf '\n' >&2
    cat "$WORKER_LOG" >&2 || true
    exit 1
  fi
}

rm -rf "$STATE_DIR"

./node_modules/.bin/wrangler d1 migrations apply DB \
  --local \
  --persist-to "$STATE_DIR"

./node_modules/.bin/wrangler dev \
  --persist-to "$STATE_DIR" \
  --port 8787 \
  --log-level error \
  >"$WORKER_LOG" 2>&1 &
WORKER_PID=$!

ready=0
for _ in $(seq 1 45); do
  if curl --fail --silent --show-error http://127.0.0.1:8787/api/health >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    cat "$WORKER_LOG"
    exit 1
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  cat "$WORKER_LOG"
  echo "Local Growth Compass Worker did not become ready for browser tests."
  exit 1
fi

base='http://127.0.0.1:8787'

selector="$(curl --fail --silent --show-error "$base/")"
assert_contains 'selector /' "$selector" 'Current / Recovered'
assert_contains 'selector /' "$selector" 'New / Ambient Luxury'
assert_contains 'selector /' "$selector" 'href="/experience/1/"'
assert_contains 'selector /' "$selector" 'href="/experience/2/"'
echo 'Preview 2 selector route smoke passed.'

e1="$(curl --fail --silent --show-error "$base/experience/1/")"
assert_contains 'Experience 1 /experience/1/' "$e1" '/experience/1/manifest.webmanifest'
assert_contains 'Experience 1 /experience/1/' "$e1" '/experience/1/bootstrap.js'
echo 'Preview 2 Experience 1 adapter route smoke passed.'

e2="$(curl --fail --silent --show-error "$base/experience/2/")"
assert_contains 'Experience 2 /experience/2/' "$e2" 'Growth Compass Preview 2 — Ambient Luxury experience.'
assert_contains 'Experience 2 /experience/2/' "$e2" '/experience/2/js/app.js'
echo 'Preview 2 Experience 2 route smoke passed.'

GC_E2E_BASE_URL=http://127.0.0.1:8787/experience/1/ npm run test:browser
GC_E2E_BASE_URL=http://127.0.0.1:8787/experience/2/ node --test tests/browser/experience2-logger.browser.js tests/browser/experience2-goals.browser.js
