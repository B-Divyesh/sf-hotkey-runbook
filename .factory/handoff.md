# Hotkey Runbook repair handoff

## Result

Repaired the release blocker from verifier report commit `71bf3aafad082512624733424eb947b27449e03b` for candidate `f75b74f6090019fdfd76b846740e176a9e102376`.

The public Sociobot checkout was reproduced first on 2026-09-01 UTC. `GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout` returned HTTP 404 with `{"error":"enabled factory product","status":404}`. This public check did not read or change billing configuration, secrets, or unrelated Sociobot resources.

Hotkey Runbook now states exactly: “The license price is $29 once. New purchases are unavailable.” The landing site and installed app contain no checkout link, buy action, or build-time switch that can expose the unavailable route. Existing-license paste and verification remain available.

## Repair

- Added `.factory/claims.json` entry `purchase-availability` with exactly one tagged regression test.
- Added the exact price/availability sentence to the landing license panel, desktop Settings, README, and terms.
- Removed `VITE_CHECKOUT_ENABLED` and both dormant checkout URLs from the site and desktop source.
- Kept the unavailable message in static HTML so it remains honest before JavaScript loads or if JavaScript fails.
- Updated the copy audit and versioned the product as 0.1.8.

The regression was run before implementation and failed on desktop and 390 px mobile because the exact sentence was absent. After the repair, `npm run test:e2e -- --grep @claim:purchase-availability` passes in both projects and proves the exact copy, absence of checkout/buy links, the terms copy, and existing-license recovery.

## Local verification

The documented Linux prerequisites were installed, followed by a clean `npm ci` (65 packages, 0 vulnerabilities).

```sh
npm test
npm run lint
npm run test:e2e
npm run build
npm audit --audit-level=high
CI=false npm run tauri build -- --bundles deb,appimage
```

Results:

- Vitest: 18/18 passed.
- Rust: 7/7 passed.
- TypeScript, rustfmt, and strict Clippy: passed.
- Playwright: 18/18 passed across desktop Chromium and 390 × 844 mobile.
- Every command in `.factory/claims.json` passed; every claim ID occurs in exactly one test.
- Production output: `dist/app` and `dist/site` produced.
- Initial site assets: 3.53 KB JavaScript (1.69 KB gzip) and 12.88 KB CSS (3.58 KB gzip).
- Native packaging produced the 0.1.8 Linux `.deb` and AppImage. The release binary stayed open under Xvfb with an isolated `XDG_DATA_HOME` until the intentional smoke-test timeout.
- `/opt/fleet/lib/verify-url.sh` reported HTTP 200, no console errors, one h1, `lang=en`, a main landmark, and no missing image alt text. Evidence is in `.factory/repair-4-local/`.
- Playwright axe checks found no serious or critical accessibility issues. Keyboard focus, dialog trapping, Escape return, reduced motion, 44 px targets, desktop layout, and 390 px layout passed.
- Local Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.59 s, CLS 0.0047, TBT 0 ms, 143,045 transferred bytes. Evidence: `.factory/repair-4-lighthouse.json`.
- Demo privacy recorded same-origin requests only. The browser demo remains isolated in `sessionStorage` under `demo:hotkey-runbook:history`.

## Release and deployment

- Repair commit: `e3ac8f7790624805125e41580c188039ec097455`; annotated tag `v0.1.8` resolves to that exact commit.
- GitHub Actions release run [33563691723](https://github.com/B-Divyesh/sf-hotkey-runbook/actions/runs/33563691723) passed its test job and all macOS arm64, macOS x86_64, Windows x86_64, and Linux x86_64 build jobs.
- Public release: [v0.1.8](https://github.com/B-Divyesh/sf-hotkey-runbook/releases/tag/v0.1.8), published 2026-09-01T22:07:14Z. It contains both macOS DMGs, Windows MSI/EXE, Linux AppImage/DEB, `SHA256SUMS`, and `latest.json`.
- The downloaded Linux AppImage matched the published checksum: `77d35d83e8860e5fc21c59d7ab5ce069c223ccb41295a05c416500af7c13d303`.
- `public/latest.json`, the Homebrew cask, Scoop manifest, and winget manifest are pinned to the v0.1.8 release bytes. The installer-integrity claim passes after the refresh.
- `/opt/fleet/lib/deploy-static.sh hotkey-runbook dist/site` deployed to the existing authorized `sf-hotkey-runbook` Static Web App in `centralus`; deployment ID `c725ec1f-a765-46bf-bc77-cb7f7d21f330` succeeded. The custom domain remained `Ready`.

Live verification at `https://hotkey-runbook.sociobot.in`:

- The site reports Build 0.1.8 and `/latest.json` reports v0.1.8.
- Live `index.html` SHA-256 `54a779ba15cc3265daa0640aa99f5d01f15aec024024c26102d45ba2961767bb` exactly matches `dist/site/index.html`; live `latest.json` also matches the repository byte for byte.
- `/opt/fleet/lib/verify-url.sh` returned HTTP 200 with no console errors and passed title, language, landmark, heading, and image-alt checks. Evidence is in `.factory/repair-4-live/`.
- All 18 Playwright tests passed against the public domain across desktop and 390 px mobile, including the isolated demo, keyboard/dialog behavior, axe, privacy, and exact purchase-availability claim.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` return 200. An unknown route returns the designed 404 with HTTP 404.
- HTML returns CSP with `frame-ancestors 'none'`, HSTS, `nosniff`, Referrer Policy, `X-Frame-Options: DENY`, and Permissions Policy. Hashed JavaScript returns `public, max-age=31536000, immutable`.
- Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.20 s, CLS 0.0047, TBT 59 ms, 141,042 transferred bytes. Evidence: `.factory/repair-4-live-lighthouse.json`.
- The public checkout still returns the reproduced HTTP 404, while the live page renders the exact unavailable sentence and exposes no purchase action.

## Offline and update posture

- This is a local desktop app, not a PWA. Runbooks, trust state, and history stay usable without a network; only explicit license verification needs the Sociobot API.
- The browser sample needs its first page load and makes only same-origin requests during use. No offline-reload claim is made.
- The desktop app has no updater and publishes no updater manifest. New versions are installed from checksum-pinned release assets.

## Known gaps and operator action

- New purchases intentionally remain unavailable until the public Sociobot product checkout returns a verified hosted-checkout redirect. Do not restore a buy link based only on configuration.
- macOS and Windows packages are unsigned. Signing requires the operator’s `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` secrets.
- Long-running runbooks have no cancellation control or configurable timeout. This is an existing non-blocking improvement.

## Reproduce

```sh
sudo apt-get install -y file libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
npm ci
npm test
npm run lint
npm run test:e2e
npm run build
CI=false npm run tauri build -- --bundles deb,appimage
```

Open `/demo/` for the isolated browser sample. In the installed app, select **Load sample project** from the empty state.
