# Hotkey Runbook

Hotkey Runbook is a keyboard-first desktop utility for operators and developers who repeat local maintenance procedures. It reads reviewed YAML runbooks from folders you choose, validates typed parameters, shows the exact executable and argument vector, asks for explicit consent, runs locally, and keeps a redacted local history with the rollback note attached.

It is intentionally not remote orchestration, a secret vault, or a shell-script builder. There is no account, telemetry, or cloud sync.

Live site: <https://hotkey-runbook.sociobot.in>

## Safety model

- A folder must be owned by the current Unix user (where the platform exposes ownership), must not be world-writable, and cannot contain symlinks.
- Adding a folder signs its canonical path and SHA-256 content digest with a random device-local HMAC key. Any YAML edit invalidates trust until the folder is reviewed and signed again.
- Each step names a fixed `program` plus an `args` array. Programs cannot be parameterized. The app never passes a generated string to a shell.
- Parameters support `text`, `integer`, `choice`, `boolean`, `path`, and `secret`, plus author-supplied regular-expression validation.
- Secret values are masked in review and redacted before output enters history. Authors can add `redactPatterns` for application-specific values.
- Execution requires reviewing the resolved command and typing the runbook name exactly. A rollback note stays visible before and after the run.

Runbooks still execute with the current operating-system user's permissions. Read unfamiliar YAML before trusting it.

## Runbook format

See [examples/restart-worker.yaml](examples/restart-worker.yaml) and [examples/inspect-endpoint.yaml](examples/inspect-endpoint.yaml).

```yaml
version: 1
id: clear-cache
name: Clear cache
description: Remove one approved application cache.
risk: medium
tags: [cache, maintenance]
parameters:
  - name: cache
    label: Cache
    type: choice
    required: true
    choices: [images, pages]
steps:
  - program: cachectl
    args: [clear, "{{cache}}"]
rollback: Warm the cache from the last snapshot.
```

YAML files may be nested up to three levels within a trusted folder. Each file is limited to 64 KB; a folder may contain up to 100 files; a runbook may contain up to 20 sequential steps.

## Develop

Requirements: Node.js 20+, Rust stable, and the [Tauri 2 system prerequisites](https://v2.tauri.app/start/prerequisites/). On Ubuntu/Debian:

```sh
sudo apt-get install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
npm ci
npm run tauri dev
```

Useful commands:

```sh
npm test            # Vitest + Rust tests
npm run test:e2e    # Chromium desktop/mobile + axe checks
npm run build       # app webview -> dist/app; static site -> dist/site
npm run build:site  # exact static deploy command -> dist/site
npm run tauri build # native bundle for the current OS
```

The static deployment root is `dist/site`; `index.html` is written directly there. No third-party scripts, fonts, or analytics are loaded at runtime.

## Install and releases

Tagged releases are built only by GitHub Actions on native macOS, Windows, and Linux runners. The release workflow publishes unsigned `.dmg`, `.msi`/`.exe`, `.AppImage`, and `.deb` artifacts, plus `SHA256SUMS` and `latest.json`. The landing page detects the visitor's OS and resolves the matching URL from that manifest.

One-line installers verify SHA-256 before installing:

```sh
curl -fsSL https://hotkey-runbook.sociobot.in/install.sh | sh
```

```powershell
irm https://hotkey-runbook.sociobot.in/install.ps1 | iex
```

Preview packages are unsigned. On macOS, right-click the app and choose **Open** on first launch. Windows may display SmartScreen. Install with Homebrew using `brew install --cask B-Divyesh/hotkey-runbook/hotkey-runbook`. Checksum-pinned Scoop and winget manifests are kept in `scoop-bucket/` and `winget/`; the winget manifest is ready for owner submission.

## License and privacy

The free field kit supports three runbooks and ten visible history entries. A $29 one-time license unlocks unlimited runbooks and the 100-entry logbook. Checkout and verification use only the Sociobot billing API. Core safety, accessibility, and data control are not gated.

See the deployed [privacy policy](https://hotkey-runbook.sociobot.in/privacy/) and [terms](https://hotkey-runbook.sociobot.in/terms/). The source is MIT licensed; see [LICENSE](LICENSE).
