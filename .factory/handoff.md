# Repair handoff — Hotkey Runbook

## Result

Release blocker repair is complete. The Tauri 2 desktop app remains a desktop-app product and the static landing site remains the deployment artifact. Release **v0.1.9** is published from repaired commit `689372f95bda391f1bdbf4bf1f8efd50f66b2318`.

## Fixed findings

1. **Current desktop installers:** `v0.1.9` replaces the stale `v0.1.8` download. The release workflow completed successfully on Linux, Windows, macOS Apple silicon, and macOS Intel: <https://github.com/B-Divyesh/sf-hotkey-runbook/actions/runs/33576051133>.
2. **Release identity and checksums:** release `latest.json` now includes the tag version, exact source commit, platform asset URLs, and SHA-256 values. `SHA256SUMS` covers all downloadable installers. The checked-in `/latest.json`, Homebrew cask, Scoop manifest, and winget manifest are pinned to those published hashes.
3. **Unavailable checkout:** reproduced `GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout` returning `404 {"error":"enabled factory product","status":404}`. Removed the $29 and one-time-purchase promise, price, and action from the landing page, desktop Settings, README, Terms, and Privacy page. The product clearly says new license sales are unavailable and still provides existing-license token recovery and verification. No billing service or shared platform resource was accessed.

The prior native demo isolation, partial-spawn history preservation, accessibility, responsive layout, and privacy fixes remain intact.

## Regression coverage

- `@claim:existing-license-recovery` routes the exact unregistered-checkout 404 response, verifies the product makes no checkout request, offers no price or purchase action, and still reveals the existing-license recovery form on desktop and mobile.
- Static-site contract coverage rejects `$29`, one-time-license, and checkout copy while requiring the unavailable-sales notice and recovery copy.
- Release-manifest coverage requires a 40-character source commit, version parity across package/Tauri metadata and `/latest.json`, and checksum-pinned Homebrew, Scoop, and winget consumers.

## Verification

Run from a clean install on 2026-09-02 UTC:

```sh
npm ci
npm run check
npm run test:e2e
npm audit --audit-level=high
CI=false npm run tauri -- build --bundles deb,appimage
```

- `npm run check`: passed — 19 Vitest tests, 10 Rust tests, TypeScript, rustfmt, strict Clippy, and production app/site builds.
- `npm run test:e2e`: passed — 20 Chromium desktop/mobile tests, including keyboard, focus, axe serious/critical checks, 390 px reflow, privacy request checks, demo isolation, and the checkout regression.
- `npm audit --audit-level=high`: passed — 0 vulnerabilities.
- Local Linux package smoke test passed: `Hotkey Runbook_0.1.9_amd64.deb` inspected with `dpkg-deb --info`; `Hotkey Runbook_0.1.9_amd64.AppImage` identified as a 64-bit ELF AppImage.
- Published release verification passed: downloaded `Hotkey-Runbook_0.1.9_linux-x86_64.AppImage` (79,735,288 bytes) and validated it against the published `SHA256SUMS` entry `94f01f417f25100603ac7d913a5549f80ce1746dd8ffe2a772840fcda831f2e6`.
- Live verification passed: `PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e` completed all 20 desktop/mobile tests against production. This includes keyboard, axe, console, privacy-request, demo, and checkout-recovery coverage.

## Published release

- Release: <https://github.com/B-Divyesh/sf-hotkey-runbook/releases/tag/v0.1.9>
- Manifest: <https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v0.1.9/latest.json>
- Checksums: <https://github.com/B-Divyesh/sf-hotkey-runbook/releases/download/v0.1.9/SHA256SUMS>
- Assets: macOS arm64 and x86_64 `.dmg`, Windows x86_64 `.msi` plus `.exe`, Linux x86_64 `.AppImage` plus `.deb`.

## Deployment and known gaps

The static deployment output is `dist/site`. It was deployed to the product-scoped `sf-hotkey-runbook` Static Web App on 2026-09-02 UTC (deployment `2fd62089-7845-4dbc-8e67-99de1bf7ef5e`). Production now serves build 0.1.9, the unavailable-sales notice, and `/latest.json` pointing to v0.1.9 commit `689372f95bda391f1bdbf4bf1f8efd50f66b2318`. The landing page resolves downloads from GitHub’s CORS-enabled release API and has a calm fallback to the release page.

New license sales remain intentionally unavailable because the product-scoped checkout is unregistered. Existing valid licenses remain recoverable. Installers are unsigned; macOS users must right-click → Open on first launch and Windows may show SmartScreen.
