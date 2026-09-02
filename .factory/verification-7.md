# Independent product verification 7 — FAIL

Verified independently on 2026-09-02 UTC.

- Candidate: `43413fe38082e09e412fbb01c3c7ed22ac9e3338`
- Branch: `main`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Artifact: Tauri 2 desktop app plus static download/demo site
- Work order: `hotkey-runbook-verify-7`
- Decision: **FAIL — do not promote this candidate**

The core product, current installers, live deployment, accessibility, privacy behavior, and all declared test commands work. The release still fails the supplied acceptance contract because a declared claim test does not prove the promised recovery outcome, the licensed-runbook claim is absent from the claim manifest, and the researched one-time purchase path remains unavailable.

## Release-blocking findings

### Blocker — `existing-license-recovery` does not test license recovery

`.factory/claims.json` claims that existing license tokens can be restored and assigns `npm run test:e2e -- --grep @claim:existing-license-recovery` as its proof. The sole tagged test at `tests/e2e/site.spec.ts:124` never fills the token field, never intercepts or calls the verification endpoint, and never asserts token storage, a cached valid verdict, or unlocked UI. It only checks that the recovery input becomes visible and that the unavailable-sales copy appears on Terms.

That violates the attached claims contract, which requires the tagged test to assert the promised observable result rather than the presence of a control. An independent Playwright fixture confirmed that the current implementation does work when `/verify` returns `{valid:true}`: it sent the expected product-scoped request, stored `sb_license:hotkey-runbook`, and displayed “License verified.” This additional manual evidence does not replace the required tagged claim test.

### Blocker — licensed runbook limit is an unlisted, untested claim

The landing page and README promise that a valid existing license adds **unlimited local runbooks**. The `free-tier-limits` claim only declares three free runbooks and the 100-entry licensed history limit. Its tagged test asserts three free runbooks, ten free history entries, and 100 unlocked history entries; it never asserts that a license removes the runbook limit. Under the supplied claims contract, this claim must be removed or added to the manifest and its tagged sandbox test.

### High — the researched one-time purchase is unavailable

The researched brief specifies one-time monetization. Production currently offers no price or purchase action and says “New license sales are unavailable.” Fresh evidence confirms why:

```text
GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

The current copy is honest and the free product remains useful, but the original monetization acceptance contract is not delivered. Existing-token recovery is not a purchase path.

## Mandatory first checks

### Cold first read — PASS

At 1440 × 900, the first viewport plainly answers all three required questions:

- What it does: “Run reviewed local YAML safely.”
- For whom: operators and developers who repeat maintenance steps and want to prevent copy/paste mistakes.
- What to click first: **Try it with sample data**, followed by “The demo opens a safe sample project. It never saves to your folders.”

The action opens `/demo/` in one click with a populated sample. The cold load returned 200 with no console or page errors.

### Declared claim commands — PASS after documented prerequisites

`.factory/claims.json` exists and lists 12 claims, each with exactly one `@claim:<id>` tag. Every exact command was run. The clean worker initially lacked the README-documented Tauri GTK/WebKit development packages, so both Rust claim commands stopped before tests at `glib-2.0.pc` not found. After installing the documented Ubuntu prerequisites, both passed.

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS — 2 Playwright projects |
| `exact-environment-review` | PASS — 1 Rust test |
| `demo-privacy` | PASS — 2 Playwright projects |
| `native-demo-controls` | PASS — 1 Vitest test |
| `native-safety-contract` | PASS — 1 Rust test |
| `local-privacy` | PASS — 1 Vitest test |
| `free-tier-limits` | PASS — 1 Vitest test |
| `installer-integrity` | PASS — 1 Vitest test |
| `keyboard-first-desktop` | PASS — 1 Vitest test |
| `installer-sh-checksum` | PASS — 1 Vitest test |
| `installer-ps1-checksum` | PASS — 1 Vitest test |
| `existing-license-recovery` | Command passes, but its assertions do not prove the declared recovery outcome; release blocker above |

## Clean-clone quality gates

| Gate | Result |
| --- | --- |
| `npm ci` | PASS — 65 packages, 0 vulnerabilities |
| `npm test` | PASS — 19 Vitest tests and 10 Rust tests |
| `npm run lint` | PASS — TypeScript, rustfmt, strict Clippy |
| `npm run build` | PASS — `dist/app` and `dist/site` produced |
| `npm run check` | PASS — aggregate tests, lint, and production builds |
| `npm run test:e2e` | PASS — 20 local Chromium desktop/mobile tests |
| Live Playwright suite | PASS — the same 20 tests against production |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `CI=false npm run tauri build` | PASS — optimized `.deb`, `.rpm`, and `.AppImage` bundles |

Static bundle sizes are within budget: landing JS 3,528 bytes raw / 1,702 gzip; demo JS 3,324 / 1,514; shared CSS 13,381 / 3,676; mobile hero WebP 64,170 bytes. Fresh live mobile Lighthouse scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100. LCP was 1.2 s, FCP 1.1 s, TBT 30 ms, CLS 0.005, and total transfer 138 KiB. Evidence: `.factory/verification-7-lighthouse.json`.

## Native desktop exercise

The locally rebuilt optimized binary was exercised under Xvfb with an isolated `XDG_DATA_HOME`:

- Empty state exposed **Load sample project**.
- Loading the sample created only `demo-sample-project` and `demo-trusted-directories.json`; real `trusted-directories.json` and `history.json` remained absent.
- The persistent demo banner exposed **Reset demo** and **Start for real**.
- Clearing the required secret produced “Sample access token is required”; entering a new value recovered without restart.
- Review showed fixed `printf`, direct arguments, `HOTKEY_SAMPLE_TOKEN=[SECRET]`, the canonical demo working folder, and the rollback note.
- A wrong confirmation kept execution disabled. The exact runbook name plus Ctrl+Enter completed with exit 0.
- `demo-history.json` contained the redacted command/result and no submitted secret.
- **Reset demo** removed demo history. **Start for real** removed the sample and returned to the real empty state.
- Reloading the sample and restarting the process restored demo mode and its isolation banner.

The Rust boundary suite separately passed owned-folder checks, symlink and world-writable rejection, 64 KiB file, 100-file, three-level, and 20-step limits, all six parameter kinds, choice/integer/pattern failures, fixed-program enforcement, digest invalidation, secret masking/redaction, and durable partial-spawn failure history.

## Live browser, privacy, and accessibility

- Fresh production request logs contained no analytics, third-party fonts/scripts, or raw model endpoints. The demo flow requested only its same-origin document, JS, and CSS. The landing additionally used the documented GitHub Releases API.
- No console errors or uncaught page errors appeared on landing or demo flows.
- Desktop and 390 × 844 mobile rendered without horizontal overflow. At 200% text the checked suite also passed.
- The skip link was the first focus target and had a visible 3 px outline. Dialog focus stayed contained, Escape closed it, and focus returned to the trigger.
- Reduced-motion mode reported zero active animations.
- axe-core found zero serious or critical issues on landing, demo, and completed mobile demo states. Images have alt text, each page has one h1 and a main landmark, and `lang="en"` is present.
- No control on the tested 390 px landing was below 44 px high.
- Screenshots: `.factory/verification-7-mobile.png`, `.factory/verification-7-demo-mobile.png`, `.factory/verification-7-release-appimage.png`, and `.factory/verification-7-release-demo.png`.

## Deployment, headers, routes, and release

- All 31 served files from fresh `dist/site` matched production byte-for-byte by SHA-256, excluding only deployment configuration. The candidate's Static Site workflow completed successfully for exact SHA `43413fe38082e09e412fbb01c3c7ed22ac9e3338`.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `/robots.txt`, `/sitemap.xml`, `/latest.json`, and `/404.html` return 200. An unknown path returns the designed page with HTTP 404.
- All unique links crawled from the five site pages resolved successfully, including current platform downloads and checksums.
- HTML uses 30-second revalidation. Hashed assets use `public, max-age=31536000, immutable`.
- Responses include HSTS, CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, and a restrictive Permissions Policy.
- GitHub release `v0.1.9` has two macOS DMGs, Windows MSI/EXE, Linux AppImage/DEB, `SHA256SUMS`, and `latest.json`. Its release workflow succeeded from tag commit `689372f95bda391f1bdbf4bf1f8efd50f66b2318`.
- Candidate changes after the tag touch only docs, package-manager metadata, `public/latest.json`, and its release-manifest test; native and site runtime source are unchanged. The live static output is the candidate output.
- The downloaded 79,735,288-byte Linux AppImage matched SHA-256 `94f01f417f25100603ac7d913a5549f80ce1746dd8ffe2a772840fcda831f2e6` and launched successfully with a fresh data directory. All six installer asset names exactly match `SHA256SUMS`.

## Server-side allowance and applicability

The product has no product-owned backend and requires no sign-in, so backend concurrency/persistence and Entra authority checks are not applicable. It is not a PWA, so service-worker update and offline-reload checks are not applicable.

The product's license verification endpoint enforced an allowance of **30 requests per client/window**: requests 1–30 returned 200; requests 31–35 returned 429 with `Retry-After: 2`.

## Acceptance decision

**FAIL.** Do not promote candidate `43413fe3` until the tagged recovery claim test proves a successful restore, the licensed-runbook promise is represented and tested (or removed), and the one-time purchase requirement is either delivered through the Sociobot billing API or explicitly accepted by the product owner as a deferred brief deviation.
