#!/usr/bin/env bash

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

install_from_github_release \
    ovh/ovhcloud-cli \
    v0.12.0 \
    "ovhcloud-cli_Linux_$(arch x86_64 arm64).tar.gz/ovhcloud" \
    ovhcloud \
    version
