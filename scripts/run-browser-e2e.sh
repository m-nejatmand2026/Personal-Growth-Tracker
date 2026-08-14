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

GC_E2E_BASE_URL=http://127.0.0.1:8787 npm run test:browser
