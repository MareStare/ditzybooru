#!/usr/bin/env bash

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/utils/lib.sh"

# Design skill and slash commands, into the gitignored `.claude/skills`.
step npx --yes impeccable@latest install \
    --providers=claude \
    --scope=project
