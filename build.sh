#!/usr/bin/env bash
# Packages the extension into a versioned zip for Chrome / Edge submission.
#
# Usage:  ./build.sh
# Output: dist/auto-refresh-v<version>.zip  (version read from manifest.json)
# Only files in $include are bundled, so dev files never leak into the package.

set -euo pipefail
cd "$(dirname "$0")"

include=(
  manifest.json
  background.js
  popup.html
  popup.js
  icons
)

missing=()
for f in "${include[@]}"; do
  [[ -e "$f" ]] || missing+=("$f")
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing files, aborting: ${missing[*]}" >&2
  exit 1
fi

version=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -n1)
if [[ -z "$version" ]]; then
  echo 'manifest.json has no "version" field.' >&2
  exit 1
fi

out="dist/auto-refresh-v${version}.zip"
mkdir -p dist
rm -f "$out"

# Git for Windows' bash usually has no `zip`; fall back to PowerShell, then Python.
if command -v zip >/dev/null 2>&1; then
  zip -rqX "$out" "${include[@]}"
elif command -v powershell.exe >/dev/null 2>&1; then
  joined=$(IFS=,; echo "${include[*]}")
  powershell.exe -NoProfile -Command \
    "Compress-Archive -Path $joined -DestinationPath '$out' -Force"
elif PYBIN=$(command -v python3 || command -v python); then
  "$PYBIN" - "$out" "${include[@]}" <<'PY'
import os, sys, zipfile
out, *items = sys.argv[1:]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for it in items:
        if os.path.isdir(it):
            for root, _, files in os.walk(it):
                for f in files:
                    p = os.path.join(root, f)
                    z.write(p, p.replace(os.sep, "/"))
        else:
            z.write(it, it)
PY
else
  echo "Need one of: zip, powershell.exe, or python to build the archive." >&2
  exit 1
fi

size=$(du -h "$out" | cut -f1)
echo "Built $out ($size)"
