# Hotkey Runbook v0.1.0 handoff

## What shipped

- A Tauri 2 desktop app for macOS, Windows, and Linux with a tray entry and responsive keyboard-first interface.
- Local YAML folder inspection and explicit trust. The Rust core canonicalizes paths, rejects symlinks and world-writable folders, checks Unix ownership, hashes all YAML content, and signs the path + digest with a device-local HMAC key. Edited folders stop loading until re-reviewed.
- Typed `text`, `integer`, `choice`, `boolean`, `path`, and `secret` parameters with optional regex validation.
- Direct executable + argv execution without a shell; program names cannot be parameterized. A final review shows masked resolved arguments and requires typing the runbook name exactly.
- Sequential output capture, secret/pattern redaction before persistence, 64 KB output cap, exit status, duration, local history, and persistent rollback notes.
- A useful free tier (3 runbooks, 10 visible history entries) and a $29 one-time Sociobot license unlock (unlimited runbooks, 100-entry history), including query-string receipt, daily cached verification, offline cached verdict, paste-to-restore, and quiet invalid/revoked state.
- A botanical field-guide product site with original reviewed artwork, OS-aware release links, install commands, product explanation, privacy policy, and terms.
- SHA-256-verifying POSIX and PowerShell installers; Scoop and winget templates; GitHub Actions native release matrix and static-site artifact workflow.

## Verification

Run from a clean clone with Node 20+ and Rust stable:

```sh
npm ci
npm test
PLAYWRIGHT_BROWSERS_PATH=/path/to/preinstalled/browsers npm run test:e2e
npm run build
npm run tauri -- build --bundles deb
```

Results on 2026-08-28:

- `npm test`: PASS — 4 Vitest assertions and 3 Rust safety tests.
- `npm run test:e2e`: PASS — 4 Playwright tests across desktop Chrome and a 390 × 844 mobile viewport. Axe reported 0 serious/critical violations; console error count was 0.
- `npm run build`: PASS. Static deploy root is `dist/site/index.html`; app webview root is `dist/app/index.html`.
- Bundle budgets: app JS 20.71 KB / CSS 12.98 KB; site JS 3.93 KB / CSS 8.45 KB (uncompressed), zero local font payload, 64 KB mobile hero WebP, 152 KB large hero WebP, and 232 KB JPEG fallback.
- Mobile Lighthouse against the production build: Performance 100, Accessibility 100, Best Practices 96, SEO 92; LCP 1.4 s, CLS 0, TBT 0 ms.
- Native Linux packaging: PASS — `Hotkey Runbook_0.1.0_amd64.deb`, about 4.2 MB.
- `npm audit --audit-level=high`: PASS, 0 vulnerabilities.
- Desktop empty/loading/error, folder-review, parameter validation, command review/consent, result, history, settings, license, light/dark, reduced-motion, keyboard, and 390 px layouts were inspected. The generated hero was reviewed at original resolution; no text artifacts, brands, people, or broken elements were found.

## Release verification

- GitHub Actions run: <https://github.com/B-Divyesh/sf-hotkey-runbook/actions/runs/33156855471> — PASS across test, macOS arm64, macOS x86_64, Windows x86_64, Linux x86_64, and release jobs.
- Release: <https://github.com/B-Divyesh/sf-hotkey-runbook/releases/tag/v0.1.0> — `.dmg` for both macOS architectures, `.msi`/`.exe`, `.AppImage`/`.deb`, `SHA256SUMS`, and `latest.json` present.
- `latest.json`: <https://github.com/B-Divyesh/sf-hotkey-runbook/releases/latest/download/latest.json> — parsed successfully with all four landing-page platform keys.
- Downloaded Linux AppImage: PASS — `61da3938e0d07096ab14bcb850b83922714e8ad3fdfc53ccf5793ee646da1899` matched both `latest.json` and `SHA256SUMS`.
- Homebrew tap: <https://github.com/B-Divyesh/homebrew-hotkey-runbook> — arm64/x86_64 cask URLs and checksums pinned to v0.1.0.

## Data and privacy

Runbooks are read in place. Trust records, the HMAC key, and redacted history are stored under the platform-local app-data directory `in.sociobot.hotkey-runbook`. The license token/verdict and theme are stored in webview local storage. No telemetry or third-party runtime scripts/fonts exist. The only application network request is license verification when a token exists; the site also fetches the public GitHub release manifest.

## Known gaps

- Runbooks execute with the current user's permissions. Direct argv execution prevents shell metacharacter interpretation, but full process sandboxing is platform-specific and is not claimed in v1.
- Running processes do not yet expose cancellation or a configurable timeout; long-running maintenance tasks finish or must be terminated through the operating system.
- Windows cannot use the same portable UID/mode checks as Unix. Explicit review, canonical paths, symlink rejection, and the device signature still apply.
- Release binaries are unsigned previews until the owner supplies platform certificates. The website and README state the macOS Gatekeeper and Windows SmartScreen implications.
- Billing unlocks need the factory to register the `hotkey-runbook` product/return URL in the Sociobot billing engine. The client contains no product UUID or payment-provider integration.

## Needs operator action

1. Register the one-time `$29` product and `https://hotkey-runbook.sociobot.in` return URL with the Sociobot billing factory.
2. Configure desktop signing before promoting beyond preview. Expected secret names: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`, `WINDOWS_CERT_PFX`, and `WINDOWS_CERT_PASSWORD`. The current workflow intentionally produces unsigned packages and does not consume these secrets yet.
3. Replace the preview release after signing, submit the checked-in winget manifest, and update the Homebrew/Scoop checksums if signed assets differ.
4. Deploy exactly `dist/site` through factory infrastructure; do not alter DNS or billing from this repository.
