# Handoff — repair 10

## Status

The stale-desktop-artifact repair is released and deployed. Desktop release
[`v0.1.13`](https://github.com/B-Divyesh/sf-hotkey-runbook/releases/tag/v0.1.13)
is an immutable build of source commit
`57258e3f605881ef6cd2f677685bf2f695706d87` (tag `v0.1.13` resolves to that
commit). GitHub Actions run
[`33596086623`](https://github.com/B-Divyesh/sf-hotkey-runbook/actions/runs/33596086623)
passed its clean test job and all macOS arm64/x86_64, Windows x86_64, and Linux
x86_64 builds before publishing.

The production static site is deployed at <https://hotkey-runbook.sociobot.in>.
Its live `/latest.json` identifies the same v0.1.13 source commit and immutable
download URLs. The owned Azure Static Web App deployed successfully to
`https://proud-dune-0462c4310.7.azurestaticapps.net`.

Full acceptance still has one external blocker: new one-time sales cannot be
enabled until the Sociobot billing product is registered. See **Known gap**.

## Repairs

1. Preserved the release-identity work from the prior repair and published a
   fresh desktop release from the reviewed source. The release workflow verifies
   the tag/version, embeds the source revision, extracts the Linux AppImage, and
   rejects a mismatched installed-build identity before publication.
2. Added `npm run clean:build-caches`, invoked before every Rust test. It removes
   only disposable repository outputs (`src-tauri/target`, Vite cache, Playwright
   report/results) and the npm package cache, then refuses to start Cargo with
   less than 5 GiB free.
3. Added `@regression:disk-exhaustion` coverage. It deterministically models the
   reported low-space condition one byte below the preflight minimum, verifies
   the useful error, runs cleanup in an isolated fixture, and proves source files
   survive while only cache paths are removed. The first clean native test used
   3.5 GiB; native tests plus strict Clippy peaked at 4.2 GiB, validating the
   5 GiB headroom.
4. Synchronized `latest.json`, Homebrew, Scoop, and Winget with the v0.1.13
   immutable checksums before rebuilding and deploying the site.

The worker did not deliberately fill the shared filesystem. A constrained mount
is not permitted in this container and `/dev/shm` is `noexec`; the regression
therefore reproduces the capacity boundary deterministically without risking
other work. The real clean build then completed with the cache preflight.

## Immutable-release evidence

The downloaded public Linux artifact was verified after publication:

```sh
sha256sum -c SHA256SUMS --ignore-missing
# Hotkey-Runbook_0.1.13_linux-x86_64.AppImage: OK

./squashfs-root/AppRun --build-identity
# {"version":"0.1.13","commit":"57258e3f605881ef6cd2f677685bf2f695706d87"}

node scripts/verify-release-identity.mjs RELEASE_DIR \
  57258e3f605881ef6cd2f677685bf2f695706d87 \
  '{"version":"0.1.13","commit":"57258e3f605881ef6cd2f677685bf2f695706d87"}'
# Release v0.1.13 identifies 57258e3f605881ef6cd2f677685bf2f695706d87.
```

| Artifact | SHA-256 |
| --- | --- |
| macOS arm64 DMG | `298eda635fbedf45583c6f1f77bd61a16304d13e8ab65cd68d7eed015bb40837` |
| macOS x86_64 DMG | `8a21fe81cbae5b7e1ebaae35e51d97a3ab467a4880fe5d708f67499bdc5f5c7f` |
| Windows x86_64 MSI | `95fba1d542ffa7e09511cc8cc3992269868c4fec801b9bc7e408f81ba5aa501e` |
| Linux x86_64 AppImage | `2bfa7201801763c12532193993cb4f7e75806233582f9a88a746020c5004a020` |
| Linux x86_64 DEB | `05fd3ebe7fd0a04a380507622aaed36e0c83158f5ba3ee549ffc77c79bb46d27` |
| Windows x86_64 EXE | `c0a87eefdcec0f73d2f765b9732c1d43d2eda991d73dd2fc6ef60cf731e4b30a` |

## Verification

From a clean local install (after installing the documented GTK/WebKit host
packages), the following passed:

```sh
npm ci
npm run check
npm run test:e2e
```

`npm run check` passed 24 Vitest tests, 12 Rust tests, strict TypeScript,
rustfmt, strict Clippy, and both production web builds. The new regression is
covered by `npm run test:unit -- --testNamePattern @regression:disk-exhaustion`.
The release workflow independently reran clean install, tests, lint, browser
tests, and build before packaging.

Browser verification passed locally and against production:

```sh
PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e
# 22 passed: desktop and 390 px mobile, keyboard, focus management,
# reduced motion, privacy request recording, responsive text, and Axe checks.

/opt/fleet/lib/verify-url.sh https://hotkey-runbook.sociobot.in .factory/repair-10-live
# title/lang/one h1/main/alt/button labels, 0 console errors
```

The live mobile Lighthouse report at `.factory/repair-10-live/lighthouse.json`
scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100;
LCP was 1.21 s and CLS was 0.0047. Live headers include CSP with header-only
`frame-ancestors 'none'`, HSTS, `nosniff`, strict-origin referrer policy, frame
denial, and restrictive permissions policy.

## How to run

```sh
npm ci
npm run clean:build-caches
npm run check
npm run dev
# desktop development: npm run tauri dev
```

The browser demo is `/demo/`; installed builds offer **Load sample project**.
See `.factory/demo.md` for its separate storage namespaces.

## Known gap and required operator action

The independent verifier's checkout blocker cannot be repaired from this worker:

```text
GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The documented factory registrar (`fleet/new-paid-product.sh`) and a scoped
billing-registration credential are absent from this worker. Do not add a fake
checkout link. An authorized operator must register `hotkey-runbook` as the
approved $29 one-time product through the Sociobot billing engine, then update
the existing-license recovery copy and its claim test to the live checkout flow.
Installers remain unsigned pending the owner-provided Apple notarization and
Windows Authenticode secrets.
