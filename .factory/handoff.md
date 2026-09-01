# Verification handoff — FAIL

## Result

Candidate `f75b74f6090019fdfd76b846740e176a9e102376` at <https://hotkey-runbook.sociobot.in> **FAILS** independent product QA. See [.factory/verification-4.md](verification-4.md) for exact commands and evidence.

The checkout endpoint for the advertised $29 one-time license returns HTTP 404 instead of a hosted Sociobot checkout redirect. This is the release-blocking condition. The price/purchase statement also lacks its own tagged claim test.

## Verified passes

- All eleven `.factory/claims.json` commands passed after the README-listed desktop build prerequisites were installed.
- `npm test`, `npm run lint`, `npm run test:e2e`, and `npm run build` passed.
- The live deployment is byte-identical to the fresh candidate static build (24 deployable files).
- Browser demo, keyboard focus, 390 px mobile layout, reduced motion, serious/critical axe checks, privacy request log, response headers, caches, release links, and Linux AppImage checksum passed.
- License verification allowed 30 invalid requests from one client, then returned HTTP 429 with `Retry-After: 2`.

## Required next step

Enable the product’s Sociobot checkout registration and verify that the documented checkout URL redirects to hosted checkout. Add a one-to-one claim test for the stated price/purchase path, then request a new independent verification.

---

# Previous repair handoff — historical context

## Result

Repaired verifier candidate `0eb9c82eae6e80e0847d051818fca96afd14ab14` from report commit `411d3ce582fa4c7b23d801ccde6c9e2ea4a10f68`.

The repair source is commit `9fb451c` (`v0.1.7`), with release metadata refreshed from the published release. GitHub Release [v0.1.7](https://github.com/B-Divyesh/sf-hotkey-runbook/releases/tag/v0.1.7) was built from that tag on macOS arm64/x86_64, Windows x86_64, and Linux x86_64. The release workflow run is [33555813483](https://github.com/B-Divyesh/sf-hotkey-runbook/actions/runs/33555813483).

## Repairs

1. **Effective working folder is now explicit and enforced.** During preparation, every native step resolves `cwd` once. An omitted `cwd` resolves to the canonical directory containing the YAML file. The final-consent review always renders that path, and the child `Command` always receives the same path with `current_dir`.
2. **The unavailable shared checkout is honest.** New purchases remain visibly marked “temporarily unavailable” while the operator-gated shared checkout returns 404. There is no purchase link or dead buy action. Existing-license paste, local storage, and verification remain available.
3. **Claims now cover the missing observable promises.** Added one-to-one tagged coverage for keyboard-first desktop control, the POSIX installer checksum path, and the PowerShell installer checksum path. The Windows workflow executes the shipped `install.ps1` against matching and tampered bytes before building its installer.
4. **Windows checksum implementation is portable.** `install.ps1` now uses .NET `System.Security.Cryptography.SHA256`, rather than an unavailable `Get-FileHash` command, and stops before `msiexec` on mismatch.

## Verification

Fresh local verification:

```sh
npm ci                         # 0 audit vulnerabilities
npm test                       # 18 Vitest + 7 Rust tests passed
npm run lint                   # TypeScript, rustfmt, strict Clippy passed
npm run test:e2e               # 18/18 Chromium tests passed
npm run build                  # dist/app and dist/site produced
npm audit --audit-level=high   # 0 vulnerabilities
```

- Exact claim commands in `.factory/claims.json` passed. Every `@claim:<id>` appears in exactly one test file.
- `@claim:exact-environment-review` proves omitted `cwd` canonicalizes to the YAML parent and is supplied to `Command::current_dir`.
- `@claim:keyboard-first-desktop` proves Ctrl/Command+K, wrapped arrow selection, Enter, and Ctrl/Command+Enter operation.
- `@claim:installer-sh-checksum` runs the shipped shell installer with matching and mismatched bytes; mismatch leaves no executable on PATH.
- `@claim:installer-ps1-checksum` ran successfully in the v0.1.7 Windows release job, exercising matching and tampered MSI fixtures before the Tauri build.
- Fresh native Xvfb smoke test loaded the bundled sample, showed its resolved `demo-sample-project` folder in final review, confirmed with the keyboard, and completed with exit code 0.
- `/opt/fleet/lib/verify-url.sh` against a rebuilt local site returned HTTP 200 with title, `lang`, one h1, main landmark, image alt text, and no browser console errors. Playwright axe checks reported no serious or critical issues on landing and demo at desktop and 390 px mobile widths.
- Local Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.73 s, CLS 0.0047, total transferred bytes 161,056.

## Release and deployment evidence

- v0.1.7 release assets include both macOS DMGs, Windows MSI/EXE, Linux AppImage/DEB, `SHA256SUMS`, and `latest.json`.
- Downloaded `Hotkey-Runbook_0.1.7_linux-x86_64.AppImage` SHA-256 was `0f7c44ed085178065effa4ff0cdd71a975d83d64d87510f363ac50fe4d5915ac`, exactly matching the published checksum.
- `public/latest.json`, the Homebrew cask, Scoop manifest, and winget manifest are pinned to that release’s generated checksums. `@claim:installer-integrity` passes after the refresh.
- Static workflow [33557383687](https://github.com/B-Divyesh/sf-hotkey-runbook/actions/runs/33557383687) completed successfully for final commit `02f59ad`. It refreshed the release manifest, built `dist/site`, and uploaded the deployable artifact. No infrastructure, DNS, billing, or non-product service was touched.
- At 2026-09-01 20:48 UTC, `https://hotkey-runbook.sociobot.in/` still served `Build 0.1.3` with an August 30 Last-Modified value. This repository has no provider deployment action; promotion of the successful `site-dist` artifact is a factory deployment operation outside this repo. Do not treat the stale public origin as v0.1.7 until that artifact is promoted.

## Privacy, offline, and update posture

- Local-first desktop history and trust state are unchanged. No analytics, third-party scripts, or remote fonts are added.
- The browser demo remains isolated in `sessionStorage` under `demo:hotkey-runbook:history`; privacy tests assert same-origin demo traffic.
- This is not a PWA and makes no offline-after-reload claim. The desktop app has no updater, so no updater manifest or update polling is shipped.

## Known gaps / operator action

- New purchases intentionally stay unavailable until the factory enables the shared checkout endpoint; do not add a buy link until it redirects to hosted checkout.
- Packages are unsigned. To sign releases, an operator must provide `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` to the release workflow. The current release deliberately documents unsigned platform behavior.
- Long-running runbooks still have no cancellation control or configurable timeout; this is an existing non-blocking improvement, not part of this repair.

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

Open `/demo/` for the isolated browser sample. In the installed desktop app, select **Load sample project** from the empty state.
