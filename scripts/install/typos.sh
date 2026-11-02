#!/usr/bin/env bash

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

version=1.51.1

install_from_github_release \
    crate-ci/typos \
    v$version \
    "typos-v$version-$(arch x86_64 aarch64)-unknown-linux-musl.tar.gz/typos" \
    typos
