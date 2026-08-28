#!/bin/sh
set -eu

manifest_url="https://github.com/B-Divyesh/sf-hotkey-runbook/releases/latest/download/latest.json"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT INT TERM

case "$(uname -s)" in
  Darwin)
    case "$(uname -m)" in arm64) platform="macos-arm64" ;; *) platform="macos-x86_64" ;; esac
    ;;
  Linux) platform="linux-x86_64" ;;
  *) echo "Hotkey Runbook supports macOS, Windows, and Linux." >&2; exit 1 ;;
esac

curl -fsSL "$manifest_url" -o "$work_dir/latest.json"
asset_data="$(python3 - "$work_dir/latest.json" "$platform" <<'PY'
import json, sys
asset = json.load(open(sys.argv[1], encoding="utf-8"))["platforms"][sys.argv[2]]
print(asset["url"])
print(asset["sha256"])
print(asset["file"])
PY
)"
asset_url="$(printf '%s\n' "$asset_data" | sed -n '1p')"
expected="$(printf '%s\n' "$asset_data" | sed -n '2p')"
filename="$(printf '%s\n' "$asset_data" | sed -n '3p')"
download="$work_dir/$filename"

echo "Downloading $filename…"
curl -fL "$asset_url" -o "$download"
if command -v sha256sum >/dev/null 2>&1; then actual="$(sha256sum "$download" | awk '{print $1}')"; else actual="$(shasum -a 256 "$download" | awk '{print $1}')"; fi
[ "$actual" = "$expected" ] || { echo "SHA-256 verification failed; nothing was installed." >&2; exit 1; }
echo "SHA-256 verified."

if [ "$(uname -s)" = "Darwin" ]; then
  install_dir="/Applications"
  [ -w "$install_dir" ] || { install_dir="$HOME/Applications"; mkdir -p "$install_dir"; }
  mount_dir="$work_dir/mount"; mkdir "$mount_dir"
  hdiutil attach "$download" -nobrowse -quiet -mountpoint "$mount_dir"
  app_path="$(find "$mount_dir" -maxdepth 1 -name '*.app' -print -quit)"
  [ -n "$app_path" ] || { hdiutil detach "$mount_dir" -quiet; echo "No app bundle found." >&2; exit 1; }
  cp -R "$app_path" "$install_dir/"
  hdiutil detach "$mount_dir" -quiet
  echo "Installed Hotkey Runbook in $install_dir. On first launch, right-click it and choose Open (the preview is unsigned)."
else
  install_dir="$HOME/.local/bin"; mkdir -p "$install_dir"
  install_path="$install_dir/hotkey-runbook"
  cp "$download" "$install_path"; chmod 0755 "$install_path"
  echo "Installed verified AppImage at $install_path. Add $install_dir to PATH if needed."
fi
