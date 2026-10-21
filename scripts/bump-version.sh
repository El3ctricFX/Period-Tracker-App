#!/usr/bin/env bash
# Bumps the version across every file that needs it.
#
# Usage:
#   ./scripts/bump-version.sh 0.1.2
#
# Files updated:
#   - package.json
#   - package-lock.json
#   - src-tauri/tauri.conf.json
#   - src-tauri/Cargo.toml
#   - flatpak/io.github.el3ctricfx.periodtracker.yml  (deb filename, appears twice)
#
# After running, review the changes in GitHub Desktop, commit, push,
# then create your tag.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 <version>"
  echo "example: $0 0.1.2"
  exit 1
fi

NEW="$1"

if ! [[ "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "error: version must look like X.Y.Z (got: $NEW)"
  exit 1
fi

if [ ! -f package.json ] || [ ! -d src-tauri ]; then
  echo "error: run this from the repo root"
  exit 1
fi

OLD=$(grep -m1 '"version"' package.json | sed -E 's/.*"version": *"([^"]+)".*/\1/')

PRODUCT=$(node -p "require('./src-tauri/tauri.conf.json').mainBinaryName || require('./src-tauri/tauri.conf.json').productName")
if [ -z "$PRODUCT" ]; then
  echo "error: could not read mainBinaryName or productName from src-tauri/tauri.conf.json"
  exit 1
fi

echo "Bumping $OLD -> $NEW  (binary: $PRODUCT)"
echo

npm version "$NEW" --no-git-tag-version --allow-same-version > /dev/null
echo "  ✓ package.json"
echo "  ✓ package-lock.json"

sed -i "s/\"version\": *\"[^\"]*\"/\"version\": \"$NEW\"/" src-tauri/tauri.conf.json
echo "  ✓ src-tauri/tauri.conf.json"

sed -i "0,/^version = \".*\"/s//version = \"$NEW\"/" src-tauri/Cargo.toml
echo "  ✓ src-tauri/Cargo.toml"

ESCAPED_PRODUCT=$(printf '%s' "$PRODUCT" | sed -E 's/[][\\.^$*+?(){}|]/\\&/g')
sed -i -E "s/${ESCAPED_PRODUCT}_[0-9]+\\.[0-9]+\\.[0-9]+_amd64\\.deb/${PRODUCT}_${NEW}_amd64.deb/g" \
  flatpak/io.github.el3ctricfx.periodtracker.yml
echo "  ✓ flatpak/io.github.el3ctricfx.periodtracker.yml"

echo
echo "Verify with:"
echo "  grep '\"version\"' package.json"
echo "  grep '\"version\"' src-tauri/tauri.conf.json"
echo "  grep '^version' src-tauri/Cargo.toml"
echo "  grep '${PRODUCT}_.*deb' flatpak/io.github.el3ctricfx.periodtracker.yml"
echo
echo "Then: commit + push in GitHub Desktop, create tag v$NEW."