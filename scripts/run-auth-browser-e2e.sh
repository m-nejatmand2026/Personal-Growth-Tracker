#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="${RUNNER_TEMP:-/tmp}/growth-compass-auth-browser-d1-${GITHUB_RUN_ID:-local}-$$"
WORKER_LOG="${RUNNER_TEMP:-/tmp}/growth-compass-auth-browser-worker-$$.log"
WORKER_PID=""
PORT="${GC_AUTH_E2E_PORT:-8788}"
BASE="http://127.0.0.1:${PORT}"

cleanup() {
  if [[ -n "$WORKER_PID" ]]; then
    kill "$WORKER_PID" 2>/dev/null || true
    wait "$WORKER_PID" 2>/dev/null || true
  fi
  rm -rf "$STATE_DIR"
}
trap cleanup EXIT

rm -rf "$STATE_DIR"

./node_modules/.bin/wrangler d1 migrations apply DB \
  --local \
  --persist-to "$STATE_DIR" \
  --config wrangler.auth-test.jsonc

./node_modules/.bin/wrangler dev \
  --config wrangler.auth-test.jsonc \
  --persist-to "$STATE_DIR" \
  --port "$PORT" \
  --log-level error \
  >"$WORKER_LOG" 2>&1 &
WORKER_PID=$!

ready=0
for _ in $(seq 1 45); do
  if status="$(curl --fail --silent --show-error "$BASE/api/account/status" 2>/dev/null)"; then
    if grep -F '"mode":"enforced"' <<<"$status" >/dev/null \
      && grep -F '"configured":true' <<<"$status" >/dev/null; then
      ready=1
      break
    fi
  fi
  if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    cat "$WORKER_LOG"
    exit 1
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  cat "$WORKER_LOG"
  echo 'Local Growth Compass enforced-auth Worker did not become ready for browser tests.'
  exit 1
fi

GC_AUTH_E2E_BASE_URL="$BASE/experience/2/" \
  node --test --test-concurrency=1 tests/browser/experience2-auth.browser.js
