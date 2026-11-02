#!/usr/bin/env bash

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

version=10.2.1

install_from_github_release \
    oxipng/oxipng \
    v$version \
    "oxipng-$version-$(arch x86_64 aarch64)-unknown-linux-musl.tar.gz/oxipng-$version-$(arch x86_64 aarch64)-unknown-linux-musl/oxipng" \
    oxipng
