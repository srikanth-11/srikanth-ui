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
  kill "$SERVE_PID" 2>/dev/null || true
  rm -rf "$TMP"
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  curl -sf "http://localhost:$PORT/r/registry.json" >/dev/null && break
  sleep 1
done

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
