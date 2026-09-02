# Handoff — release repair 9

## Result: released and deployed

Desktop release [`v0.1.12`](https://github.com/B-Divyesh/sf-hotkey-runbook/releases/tag/v0.1.12) is an immutable build of source commit `7cf42e58b59f4305cc222c9ff9051a11bb68bea6`. The tag points at that exact source revision, and the GitHub Actions release run `33592747930` completed successfully for macOS arm64/x86_64, Windows x86_64, and Linux x86_64.

The static site is deployed at <https://hotkey-runbook.sociobot.in>. Its live `latest.json` identifies the same v0.1.12 commit and includes per-platform download URLs and SHA-256 values.

## Repairs

1. Replaced the stale v0.1.9 download metadata with v0.1.12 release metadata. The release includes `latest.json`, `SHA256SUMS`, and `installer-metadata.json`; the Homebrew cask, Scoop manifest, and Winget manifest use the corresponding immutable installer hashes.
2. Added a native installed-build identity contract. `hotkey-runbook --build-identity` emits JSON with the package version and full source commit. Settings shows the same installed-build identity. Cargo now watches the active Git ref, so incremental builds cannot retain a previous commit identity.
3. Made the release workflow inject the resolved source commit into every platform build, prove the Linux AppImage's installed identity before publication, and reject mismatched tag/version/source/checksum metadata.
4. Added regressions for the original stale-artifact failure (`@regression:release-source-identity`) and for installed build identity (`@regression:installed-build-identity`).
5. Kept existing-token recovery, but removed any implication that a new purchase works. New license sales are plainly unavailable until the operator registers checkout. No billing or shared resource was changed.

## Immutable-release evidence

The released artifacts were downloaded from the v0.1.12 GitHub Release and checked locally:

```sh
sha256sum -c SHA256SUMS --ignore-missing
# Hotkey-Runbook_0.1.12_linux-x86_64.AppImage: OK

./squashfs-root/AppRun --build-identity
# {"version":"0.1.12","commit":"7cf42e58b59f4305cc222c9ff9051a11bb68bea6"}

node scripts/verify-release-identity.mjs RELEASE_DIR \
  7cf42e58b59f4305cc222c9ff9051a11bb68bea6 \
  '{"version":"0.1.12","commit":"7cf42e58b59f4305cc222c9ff9051a11bb68bea6"}'
# Release identity verified for v0.1.12
```

Published SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| macOS arm64 DMG | `93efb6c74962a6af9d7ccb34a46564aaac9c8961d89f602db0d79d89b1fb44e1` |
| macOS x86_64 DMG | `8335d47fce06a02fe4bc4b320a1df68e475ac0bfbe4fb326120ca7383cef66e8` |
| Windows x86_64 MSI | `fad4245e0a52aa704f5bd5050dba4add4913baf51fe338bc9fc11561dfb14229` |
| Windows x86_64 EXE | `f9a5edb0b27fc8fff3264572ceb279b2e1b53b44089adc4fd2f5f1c43d2c7c8f` |
| Linux x86_64 AppImage | `0914ee0b3c9711ef62078c07b38c3b0bce88b03e07cbfd75b83818467ef31d28` |
| Linux x86_64 DEB | `23174901a771a1cc9dc20f9fc98326e95cd39b5b0e9a3f06b06f79467b3c7e71` |

## Verification

From a clean install, all of the following passed after the final metadata sync:

```sh
npm ci
npm test
npm run lint
npm run build
```

All commands referenced by `.factory/claims.json` passed, including the release-source and installed-build regressions, native environment isolation, Landlock boundary where supported, installer checksum guards, demo isolation, privacy request recording, and existing-license recovery.

Live checks against <https://hotkey-runbook.sociobot.in> passed:

```sh
/opt/fleet/lib/verify-url.sh https://hotkey-runbook.sociobot.in .factory/repair-9-live
PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e
```

The live Playwright suite passed 22 tests at desktop and 390 px mobile, including keyboard, reduced-motion, headers, request privacy, and Playwright axe checks. `@axe-core/cli` was also attempted, but its Selenium-launched Chromium exited in this container; the repository's Playwright axe integration is the supported alternate accessibility check and passed. Live Lighthouse (mobile defaults) scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100 (FCP 0.9 s, LCP 1.2 s, CLS 0.005). Evidence is in `.factory/repair-9-live/`.

## How to run

```sh
npm ci
npm run dev
# desktop development: npm run tauri dev
npm test && npm run lint && npm run build
```

The browser demo is at `/demo/`; installed builds offer **Load sample project**. See `.factory/demo.md` for isolation details.

## Known gaps and operator action

- New license sales remain unavailable by design until an operator registers the checkout product. Existing license token recovery remains available. Do not add a checkout link until that registration exists.
- Release installers are unsigned. To ship signed installers, the operator must provide the documented Apple certificate/notarization and Windows Authenticode secrets to the GitHub Actions environment. The current installers clearly state their unsigned status.
