# Independent product verification 3 — FAIL

Verified independently on 2026-09-01 UTC.

- Candidate: `0eb9c82eae6e80e0847d051818fca96afd14ab14`
- Branch: `main`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Artifact: Tauri 2 desktop app plus static download site
- Result: **FAIL — do not promote this candidate**

The local app, browser demo, release packages, deployment identity, privacy checks, accessibility checks, and build gates are healthy. The candidate still does not meet the acceptance contract because a new customer cannot buy the advertised one-time license, the installed sample does not show the working folder it will use, and visitor-facing keyboard/installer claims are missing from the claim manifest.

No product code, infrastructure, DNS, billing configuration, database, key vault, or unrelated resource was modified during verification.

## Mandatory first checks

### Claims

`.factory/claims.json` exists and lists eight claims. The commands were invoked literally before other product inspection. The clean clone initially had no `node_modules`, so Node-based commands could not load Playwright/Vitest; the initial Rust command also reported the documented missing WebKit/GLib host libraries. After the mandatory clean `npm ci` and documented Tauri Linux prerequisites were installed, every exact claim command passed:

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-isolated` | `npm run test:e2e -- --grep @claim:demo-isolated` | PASS — 2 projects |
| `exact-environment-review` | `npm run test:e2e -- --grep @claim:exact-environment-review` | PASS — 2 projects |
| `demo-privacy` | `npm run test:e2e -- --grep @claim:demo-privacy` | PASS — 2 projects |
| `native-demo-controls` | `npm run test:unit -- --testNamePattern @claim:native-demo-controls` | PASS — 1 test |
| `native-safety-contract` | `cargo test --manifest-path src-tauri/Cargo.toml claim_native_safety_contract` | PASS — 1 test |
| `local-privacy` | `npm run test:unit -- --testNamePattern @claim:local-privacy` | PASS — 1 test |
| `free-tier-limits` | `npm run test:unit -- --testNamePattern @claim:free-tier-limits` | PASS — 1 test |
| `installer-integrity` | `npm run test:unit -- --testNamePattern @claim:installer-integrity` | PASS — 1 test |

Each claim ID occurs in exactly one `@claim:<id>` test. Passing the commands does not resolve the two claim-contract defects described under Findings: the browser-only exact-review test does not catch the installed sample's missing working folder, and some visitor-facing claims are unlisted.

### Cold first read

PASS at 1440×900 and 390×844.

- What it does: “Run reviewed local YAML safely.”
- Who it is for: operators and developers repeating maintenance steps who want fewer copy/paste mistakes.
- First action: “Try it with sample data,” followed by “The demo opens a safe sample project. It never saves to your folders.”

The action is visible on the first screen and opens a populated sample in one click. The live first load returned 200 with no console or page errors. Evidence: `verification-3-verify-url/screenshot-desktop.png`, `verification-3-verify-url/screenshot-mobile.png`, and `verification-3-live-mobile.png`.

## Clean candidate gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 65 packages installed; 0 vulnerabilities |
| `npm test` | PASS | 15 Vitest tests and 6 Rust tests |
| `npm run lint` | PASS | TypeScript, rustfmt, and Clippy with warnings denied |
| `npm run test:e2e` | PASS | 18/18 desktop/mobile tests |
| `PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e` | PASS | 18/18 live tests |
| `npm run build` | PASS | `dist/app` and `dist/site` produced |
| `npm audit --audit-level=high` | PASS | 0 vulnerabilities |
| `CI=false npm run tauri build -- --bundles deb,appimage` | PASS | Optimized binary, DEB, and AppImage produced |
| `/opt/fleet/lib/verify-url.sh` | PASS | 200; title/lang/main/alt/button/console checks clean |

Production bundle sizes are within contract: desktop webview JS 22.73 KB and CSS 13.49 KB uncompressed; landing JS totals 4.49 KB and CSS is 12.88 KB uncompressed; the mobile hero is 64.17 KB. The native build produced a 4.77 MB DEB and 79.73 MB AppImage.

## End-to-end product exercise

The optimized native binary was run under Xvfb with a fresh isolated `XDG_DATA_HOME`.

- Empty state offered **Load sample project**.
- Loading created only `demo-sample-project`, its trust record, and the device-local signing key under the isolated app-data directory.
- The demo banner persisted and exposed **Reset demo** and **Start for real**.
- Clearing the required token produced the visible, field-bound error “Sample access token is required.” Entering a value recovered without restart.
- Review showed `printf`, each direct argument, `HOTKEY_SAMPLE_TOKEN=[SECRET]`, and the rollback note. A wrong confirmation created no history; the exact name enabled execution.
- Execution completed with exit 0. History contained the printed output and no submitted secret.
- **Reset demo** removed demo history and restored the sample. **Start for real** removed the demo directory and its trust record.
- A real folder selection of `/work/repo/examples` found two runbooks. The acknowledgement and **Sign and add folder** flow worked by keyboard. The signed folder and runbooks remained available after restart.
- The Rust claim test independently covered owned/world-writable/symlink roots, three-level nesting, 64 KB files, 100 files, 20 steps, parameter types, patterns, fixed programs, direct argv/environment construction, digest change, masking, redaction, and rollback retention.

Fresh evidence: `verification-3-native-initial.png`, `verification-3-native-sample.png`, `verification-3-native-validation.png`, `verification-3-native-review.png`, `verification-3-native-result.png`, and `verification-3-native-restart.png`.

The installed sample's review does not show a working folder. Its YAML has no `cwd`; the UI emits a folder line only when `cwd` is present, and process execution otherwise inherits the launch directory. This conflicts with the exact-working-folder claim and is safety-relevant for commands whose behavior depends on their current directory.

## Live browser, privacy, and accessibility

- The landing page, browser demo, privacy page, and terms page return 200. A fresh unknown route returns the designed page with HTTP 404.
- The landing, 390px mobile, dark, and reduced-motion states have one `h1`, a `main`, `lang="en"`, complete image alt text, no horizontal overflow at normal text size, and no interactive target below 44 CSS px.
- The first Tab focuses the skip link with a visible 3 px outline in light and dark themes.
- Axe reported zero serious or critical findings on the landing and demo review dialog.
- The 390×844 demo dialog fits inside the viewport. Initial focus moves to confirmation; focus wraps; Escape closes; focus returns to the opener.
- Wrong confirmation remains disabled. Exact confirmation completes the sample. Reset clears `demo:hotkey-runbook:history`; the normal history key remains absent.
- The entire live demo flow requested only its same-origin document, JS, and CSS. The landing requested only same-origin assets plus the documented GitHub Releases API. There were no failed requests, console errors, page errors, analytics, remote fonts, or third-party scripts.
- Playwright observed CSP, HSTS, `nosniff`, Referrer Policy, frame denial, Permissions Policy, and a 30-second HTML cache. Hashed JS and hero assets return `public, max-age=31536000, immutable`.
- All 31 deployable files other than the platform-only `staticwebapp.config.json` are byte-identical between the fresh `dist/site` build and live responses.

Fresh mobile Lighthouse: Performance 94, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 280 ms, CLS 0.005, Speed Index 1.2 s, total transfer 138 KiB. Evidence: `verification-3-lighthouse.json` and `verification-3-live-demo-mobile.png`.

No service worker is present and no offline/PWA claim is made. The product has no product-owned backend and requires no sign-in, so backend persistence/concurrency/health and Entra checks are not applicable.

## Release and installer evidence

- Public release `v0.1.3` exists with two macOS DMGs, Windows MSI/EXE, Linux AppImage/DEB, `latest.json`, and `SHA256SUMS` (8 assets total).
- Release workflow run `33301993470` completed successfully on commit `e8475773a09da0584be6ce97573ea16c38772ecf`.
- Every binary asset name appears exactly once in the published checksum file.
- A fresh Linux AppImage download is a valid x86-64 ELF/AppImage and matches published SHA-256 `d03d92b1bbfee1719dbacbc290f4115221488ab6365d4a89a9fc320f5f0ecfe9`.
- The landing's detected Linux link resolves to that real asset. Homebrew, Scoop, winget, and deployed `latest.json` are pinned to v0.1.3.
- The release tag predates candidate-only tests, release/package metadata, and evidence. Native executable and site UI sources are unchanged; the candidate's rebuilt static output, including updated release metadata, matches live byte-for-byte.

## Product service checks

The product has no server-side application endpoint. The documented license service was checked because the app calls it:

- `GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout` returned **404**, body `{"error":"enabled factory product","status":404}`, and no redirect.
- Invalid license verification requests 1–30 returned the normal HTTP 200 invalid verdict. Request 31 returned HTTP 429 with `Retry-After: 4`. Observed allowance: **30 requests per client/window**.

## Findings

### Release blockers

1. **The advertised $29 one-time license cannot be purchased.** The live site says “New purchases are temporarily unavailable,” provides no buy link, and the documented product checkout returns 404. This fails the researched one-time monetization scope and the paid-unlock contract. Existing-license recovery does not let a new customer purchase.
2. **The installed sample does not disclose the actual working folder before consent.** The listed `exact-environment-review` claim says the desktop review shows it, but the native sample review omits it and execution inherits an undisclosed launch directory when `cwd` is absent. The passing claim test checks a browser-only hard-coded folder line, so it is not evidence for the claimed native behavior.
3. **The claims manifest is still incomplete.** The landing/README describe a keyboard-first desktop workflow and one-line installers that verify SHA-256 before installation, but neither statement has its own `.factory/claims.json` entry and tagged observable test. The installer claim only verifies release manifest generation, not either installer script. Under the supplied claims contract, unlisted visitor-facing claims fail verification.

### Low / disclosed gap

1. Native processes have no cancellation control or configurable timeout. A long-running command can only be ended outside the app.

## Acceptance decision

**FAIL.** The core local workflow and all conventional quality gates pass, but the checkout, exact-review truthfulness, and claim inventory are release-blocking acceptance requirements. Reverify a new candidate after those three issues are resolved.
