#!/usr/bin/env bash

set -euo pipefail

. "$(dirname "${BASH_SOURCE[0]}")/../utils/lib.sh"

info "Running in shell: $SHELL ($BASH_VERSION)"

tools_dir=./tools

function install_from_github_release {
    local repo="$1"
    local tag="$2"

    # Can be just an uncompressed file or `archive.{ext}/path/to/file/in/archive`.
    # In the second case, the archive will be decompressed and the file will be extracted
    local asset="$3"

    # Name of the binary to be placed in the destination $tools_dir
    local bin="$4"

    local version_command="${5:---version}"

    local archive_subpath=""

    if [[ "$asset" == *"/"* ]]; then
        archive_subpath="${asset#*/}"
        asset="${asset%%/*}"
    fi

    local tmp="/tmp/$bin"

    step rm -rf "$tmp"
    step mkdir -p "$tmp"
    step pushd "$tmp" > /dev/null

    local digest
    digest=$( \
        fetch "https://api.github.com/repos/$repo/releases/tags/$tag" \
        | jq -r --arg asset_prefix "$asset" '.assets[] | select(.name==$asset_prefix) | .digest'
    )

    fetch "https://github.com/$repo/releases/download/$tag/$asset" --remote-name

    local checksum="${digest#sha256:} $asset"
    info "Checking file SHA256 hash: $checksum"
    echo "$checksum" | step sha256sum --check

    if [[ -n "$archive_subpath" ]]; then
        decompress "$asset"
        asset="$archive_subpath"
    fi

    step popd > /dev/null

    step mv "$tmp/$asset" "$tools_dir/$bin"
    step chmod +x "$tools_dir/$bin"

    # Sanity check: ensure the tool is executable
    step "$bin" "$version_command"

    step rm -rf "$tmp"
}

function decompress {
    local archive="$1"

    if [[ $archive == *.tar.* || $archive == *.tgz ]]; then
        step tar --extract --file "$archive"
    elif [[ $archive == *.gz ]]; then
        step gzip --decompress --stdout "$archive" > "$(basename "$archive" .gz)"
    elif [[ $archive == *.zip ]]; then
        step unzip -u "$archive" >&2
    else
        info "File isn't a known archive type, skipping decompression: $archive"
        return 0
    fi

    info "Decompressed: $(ls -lah --color=always)"
}


# `curl` wrapper with better defaults for readonly GET requests
function fetch {
    step curl \
        --silent \
        --show-error \
        --fail-with-body \
        --location \
        --retry 5 \
        --retry-all-errors \
        "$@"
}

# Get the current machine arch using the given architecture naming conventions.
function arch {
    local amd64="$1"
    local arm64="$2"
    local uname_output

    uname_output="$(uname -m)"

    case "$uname_output" in
        x86_64)  echo "$amd64" ;;
        aarch64) echo "$arm64" ;;
        arm64)   echo "$arm64" ;;
        *) bail "Unsupported architecture: $uname_output" ;;
    esac
}


step mkdir -p "$tools_dir"

if [[ ":$PATH:" != *":$tools_dir:"* ]]; then
    export PATH="$tools_dir:$PATH"

    # Update GITHUB_PATH on CI to persist the updated PATH for subsequent steps
    if [[ -n "${CI+x}" ]]; then
        step echo "$tools_dir" >> "$GITHUB_PATH"
    fi
fi
