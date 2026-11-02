#!/usr/bin/env bash
#
# Runs the screenshot suite against Chromium from the pinned Playwright image,
# so baselines are rendered identically on every machine and in CI.
#
#   scripts/e2e.sh            compare against the committed baselines
#   scripts/e2e.sh --update   write only new or changed baselines, then
#                             optimize them losslessly with oxipng

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/utils/lib.sh"

cd "$(dirname "${BASH_SOURCE[0]}")/.."
export PATH="$PWD/tools:$PATH"

shots=frontend/e2e/__screenshots__
port=3355

version=$(node -p "require('./frontend/node_modules/@playwright/test/package.json').version")
runtime=$(command -v docker || command -v podman || bail "Needs docker or podman")

update=false
args=()
if [[ "${1:-}" == "--update" ]]; then
    update=true
    shift
    # Rewrites a baseline only when it no longer matches. A passing one is left
    # alone, so git sees no churn.
    args+=(--update-snapshots=changed)
fi

# The browser runs in the container, the app and the tests stay on the host.
container=$("$runtime" run --detach --rm --network host --init \
    "mcr.microsoft.com/playwright:v$version-noble" \
    npx --yes "playwright@$version" run-server --port "$port" --host 127.0.0.1)
trap '"$runtime" stop "$container" > /dev/null' EXIT

# `run-server` prints its endpoint once ready. Wait on that, not on a timer.
# A process substitution, not a pipe: a pipe would keep waiting for `logs`,
# which only stops on its next write.
step timeout 120 grep --quiet --max-count=1 'Listening on' < <("$runtime" logs --follow "$container" 2>&1)

PW_TEST_CONNECT_WS_ENDPOINT="ws://127.0.0.1:$port/" \
    step pnpm --filter frontend exec playwright test "${args[@]}" "$@"

if [[ $update == true ]]; then
    # Only files git reports as new or modified, so settled ones stay untouched.
    mapfile -t changed < <(git ls-files --modified --others --exclude-standard -- "$shots" | grep '\.png$' || true)
    if [[ ${#changed[@]} -gt 0 ]]; then
        step oxipng --opt max --strip all --quiet "${changed[@]}"
    fi
fi
