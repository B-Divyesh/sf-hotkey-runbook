# Hotkey Runbook v0.1.1 repair handoff

## Repair summary

This repair addresses the independent verification report recorded in commit `846ad8a35e369aabe696215141b6ae22682f8c63`.

- Added `.factory/claims.json` with three executable, isolated demo claims and exact Playwright test commands.
- Added `/demo/`, a one-click sample project with a persistent demo banner, exact review, masked environment value, reset, browser-tab isolation, and no third-party requests.
- Added **Load sample project** to the installed app’s empty state. Its files, trust record, and history use a separate app-data namespace; reset removes only demo state.
- The command review now includes every resolved `steps[].env` entry and masks secret values there as well as in arguments and paths.
- A selected symlinked root is rejected before canonicalisation. The old code canonicalised first and could accept the symlink target.
- Removed the false export statement. The landing copy now names its audience, repeated-maintenance situation, first action, and what happens next. `.factory/copy-audit.md` records the review.
- Added static-site metadata, canonical URLs, favicon, robots, sitemap, a designed 404, consistent legal headers/footers, build ID, security headers, immutable hashed-asset caching, and 44 px navigation/download/legal targets.
- The download resolver now uses the GitHub Releases API with a one-hour local cache and a calm offline/unavailable state; it does not fetch a GitHub redirect URL.
- Added a regression test proving `.deb` and `.exe` names copied into `SHA256SUMS` exactly match their uploaded files. Version metadata is now `0.1.1` across npm, Cargo, and Tauri.

## Verification

Run from a clean clone with Node 20+, Rust stable, and the Tauri Linux prerequisites:

```sh
npm ci
npm test
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npm run test:e2e
npm run build
CI=false npm run tauri -- build --bundles deb
npm audit --audit-level=high
```

Evidence from this repair:

- `npm ci`: PASS — 65 packages, 0 vulnerabilities.
- `npm test`: PASS — 5 Vitest assertions and 5 Rust safety assertions.
- `npm run test:e2e`: PASS — 12 checks across desktop Chrome and 390 × 844 mobile, including the three claims, keyboard confirmation, isolated sample reset, request privacy, and Axe serious/critical checks.
- `npm run build`: PASS — `dist/app` and `dist/site` produced. App JS is 22.25 KB and site JS is 3.56 KB uncompressed; site CSS is 10.55 KB.
- `/opt/fleet/lib/verify-url.sh` against local landing, `/demo/`, `/privacy/`, and `/terms/`: PASS — each returned 200 with one h1, a main landmark, `lang=en`, titles, no images missing `alt`, no unlabeled buttons, and no console errors.
- Playwright Axe reported zero serious or critical findings on the landing page and demo. The standalone Axe CLI was attempted but its system ChromeDriver only supports Chrome 152 while the preinstalled Playwright browser is Chrome 145; the equivalent pinned Playwright Axe integration is the passing accessibility evidence.
- `CI=false npm run tauri -- build --bundles deb`: PASS — Linux package `src-tauri/target/release/bundle/deb/Hotkey Runbook_0.1.1_amd64.deb` produced locally.
- `npm audit --audit-level=high`: PASS — 0 vulnerabilities.

## Release and deploy

The repair is versioned as `0.1.1`. Pushing tag `v0.1.1` runs the checked-in native GitHub Actions matrix, builds macOS, Windows, and Linux packages from the tagged repair commit, creates `SHA256SUMS`/`latest.json`, and publishes the release. The static-site workflow builds `dist/site`; the factory deploys that directory as the static artifact.

The previous `v0.1.0` binary set is intentionally not described as this repair’s artifact. Release provenance is restored only by the `v0.1.1` tag and its workflow-generated assets.

## Data and privacy

User-selected runbooks, trust records, secrets, and normal history remain local. The sample project uses only `demo:hotkey-runbook:*` browser-tab storage or the app’s separate `demo-sample-project` / `demo-history.json` namespace. The browser sample makes no third-party requests. The app has no telemetry or CDN dependencies.

## Remaining operator-owned dependency

The $29 checkout endpoint is owned by the Sociobot billing service, which this repair was explicitly prohibited from accessing or modifying. The product still uses the required Sociobot checkout and verification URLs. Before promoting the release, the factory must ensure `hotkey-runbook` and its return URL are enabled in that billing service; this repair does not claim to have changed that external resource.

Desktop packages remain unsigned previews. Platform signing requires the owner’s `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`, `WINDOWS_CERT_PFX`, and `WINDOWS_CERT_PASSWORD` secrets.
