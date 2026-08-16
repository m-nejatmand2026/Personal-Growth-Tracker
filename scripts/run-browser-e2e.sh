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

base='http://127.0.0.1:8787'

selector="$(curl --fail --silent --show-error "$base/")"
printf '%s' "$selector" | grep -F 'Current / Recovered' >/dev/null
printf '%s' "$selector" | grep -F 'New / Ambient Luxury' >/dev/null
printf '%s' "$selector" | grep -F 'href="/experience/1/"' >/dev/null
printf '%s' "$selector" | grep -F 'href="/experience/2/"' >/dev/null

e1="$(curl --fail --silent --show-error "$base/experience/1/")"
printf '%s' "$e1" | grep -F '/experience/1/manifest.webmanifest' >/dev/null
printf '%s' "$e1" | grep -F '/experience/1/bootstrap.js' >/dev/null

e2="$(curl --fail --silent --show-error "$base/experience/2/")"
printf '%s' "$e2" | grep -F 'Growth Compass Preview 2 — Ambient Luxury experience.' >/dev/null
printf '%s' "$e2" | grep -F '/experience/2/js/app.js' >/dev/null

GC_E2E_BASE_URL=http://127.0.0.1:8787/experience/1/ npm run test:browser
