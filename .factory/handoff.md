# Hotkey Runbook repair handoff

## Result

Repaired the release blocker from verifier report commit `71bf3aafad082512624733424eb947b27449e03b` for candidate `f75b74f6090019fdfd76b846740e176a9e102376`.

The public Sociobot checkout was reproduced first on 2026-09-01 UTC. `GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout` returned HTTP 404 with `{"error":"enabled factory product","status":404}`. No Sociobot resource, setting, or secret was read or changed.

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

Release and live-deployment evidence will be added after the 0.1.8 tag is built and the static artifact is promoted.

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
