#!/usr/bin/env bash
# Installs every built registry item into a fresh Next.js app and type-checks.
#
# Adaptation: `shadcn add <local-file-path>` is rejected ("unknown scheme" —
# shadcn treats the path as a URL and Windows drive letters like "C:" parse
# as a scheme). Brief's documented fallback: serve public/ over HTTP and
# install from there. Works both locally and in CI.
set -euo pipefail

PORT=8788
REGISTRY_DIR="$(pwd)/public/r"
TMP=$(mktemp -d)

npx serve public -l "$PORT" >"$TMP/serve.log" 2>&1 &
SERVE_PID=$!

cleanup() {
  # npx wraps the real `serve` (node) process, which reparents immediately
  # (not just on exit) — killing SERVE_PID or its tracked children misses it.
  # Kill whatever actually holds the port instead.
  pkill -P "$SERVE_PID" 2>/dev/null || true
  kill "$SERVE_PID" 2>/dev/null || true
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "$PORT/tcp" 2>/dev/null || true
  else
    # Git Bash/Windows has no fuser/lsof: find the PID via netstat, kill via taskkill.
    for pid in $(netstat -ano 2>/dev/null | grep LISTENING | grep ":$PORT " | awk '{print $NF}' | sort -u); do
      taskkill //F //PID "$pid" 2>/dev/null || true
    done
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  curl -sf "http://localhost:$PORT/r/registry.json" >/dev/null && break
  sleep 1
done
curl -sf "http://localhost:$PORT/r/registry.json" >/dev/null \
  || { echo "server on :$PORT never came up"; exit 1; }

npx create-next-app@latest "$TMP/app" --ts --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --use-npm --yes
cd "$TMP/app"
npx shadcn@latest init -d

for f in "$REGISTRY_DIR"/*.json; do
  name=$(basename "$f")
  [ "$name" = "registry.json" ] && continue
  [ "$name" = "index.json" ] && continue
  echo "--- installing $name"
  npx shadcn@latest add "http://localhost:$PORT/r/$name" --yes --overwrite
done

npx tsc --noEmit
echo "SMOKE OK"
