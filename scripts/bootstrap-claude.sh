#!/usr/bin/env bash

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/utils/lib.sh"

# Skill catalog and edit gate for skills shipped by the `intent.skills`
# packages in `node_modules`.
step npx --yes @tanstack/intent@latest hooks install \
    --scope project \
    --agents claude

# Design skill and slash commands, into the gitignored `.claude/skills`.
step npx --yes impeccable@latest install \
    --providers=claude \
    --scope=project
