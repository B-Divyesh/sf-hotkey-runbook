# Independent verification 6 — FAIL

- Candidate: `5d9dab9865707c10c0875e45d7a1de79f885b765`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Verified: 2026-09-02 UTC
- Work order: `hotkey-runbook-verify-6`
- Decision: **FAIL — do not release this desktop-app candidate**

The candidate source, static site, browser demo, accessibility checks, and declared claims pass. It cannot be accepted as a desktop-app release because the live download is still the older v0.1.8 binary rather than this candidate. The product also continues to advertise a $29 one-time license while new purchases cannot be made.

## Release-blocking findings

### Critical — public desktop installers do not contain candidate `5d9dab9`

The candidate changes native code (`src-tauri/src/lib.rs`, `src/main.ts`, and native demo UI) to isolate demo state and retain partial-execution failures. The public release API instead returns only `v0.1.8`, published at `2026-09-01T22:07:14Z`. Its Git tag resolves to `e3ac8f7790624805125e41580c188039ec097455` (`fix: make unavailable checkout claims honest`), and `git merge-base --is-ancestor v0.1.8 5d9dab9` exits 1. Thus v0.1.8 is not an ancestor of the candidate.

The live site does resolve its Linux download to `Hotkey-Runbook_0.1.8_linux-x86_64.AppImage`. Its published `SHA256SUMS` validates that file, but validation proves the integrity of the old artifact, not candidate delivery. Because this product's job is performed by the installed desktop app, source-only fixes without a new multi-platform release leave users on the previously rejected behavior.

Required remediation: tag a new version from the accepted commit, let `.github/workflows/release.yml` publish macOS, Windows, and Linux artifacts plus `SHA256SUMS` and `latest.json`, then verify that the live platform links resolve to that release.

### High — the advertised one-time purchase is unavailable

The live page says “$29 once” and “New purchases are unavailable”; it has no checkout link. Fresh evidence confirms the required product endpoint is not provisioned:

```text
GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

This is honest copy, but it does not meet the brief's one-time monetization or the paid-unlock contract. Existing-license restoration is not a purchase path.

Required remediation: register/enable the product in the Sociobot billing system and expose the documented hosted checkout link while retaining restore/verification behavior.

## First-read gate — PASS

A cold 1440px browser visit had title `Hotkey Runbook — run local YAML safely`, one h1, and a main landmark. The first screen says what it does (“Run reviewed local YAML safely”), identifies operators and developers repeating maintenance steps, and presents one-click **Try it with sample data** with adjacent text explaining that the safe sample opens and is not saved to folders. The action opens `/demo/` with populated sample data and no account or setup.

## Claims — PASS after documented native prerequisites

The clean container initially lacked the Tauri Linux GLib/WebKit development packages, so the first native claim invocation stopped at `glib-2.0.pc` not found. The repository documents Tauri prerequisites in README; after installing them, every exact command from `.factory/claims.json` passed:

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS — `npm run test:e2e -- --grep @claim:demo-isolated` (2 tests) |
| `exact-environment-review` | PASS — `cargo test --manifest-path src-tauri/Cargo.toml claim_exact_environment_review` (1 test) |
| `demo-privacy` | PASS — `npm run test:e2e -- --grep @claim:demo-privacy` (2 tests) |
| `native-demo-controls` | PASS — `npm run test:unit -- --testNamePattern @claim:native-demo-controls` (1 test) |
| `native-safety-contract` | PASS — `cargo test --manifest-path src-tauri/Cargo.toml claim_native_safety_contract` (1 test) |
| `local-privacy` | PASS — `npm run test:unit -- --testNamePattern @claim:local-privacy` (1 test) |
| `free-tier-limits` | PASS — `npm run test:unit -- --testNamePattern @claim:free-tier-limits` (1 test) |
| `installer-integrity` | PASS — `npm run test:unit -- --testNamePattern @claim:installer-integrity` (1 test) |
| `keyboard-first-desktop` | PASS — `npm run test:unit -- --testNamePattern @claim:keyboard-first-desktop` (1 test) |
| `installer-sh-checksum` | PASS — `npm run test:unit -- --testNamePattern @claim:installer-sh-checksum` (1 test) |
| `installer-ps1-checksum` | PASS — `npm run test:unit -- --testNamePattern @claim:installer-ps1-checksum` (1 test) |
| `purchase-availability` | PASS — `npm run test:e2e -- --grep @claim:purchase-availability` (2 tests) |

## Source, browser, and deployment verification

- `npm ci`: PASS; 65 packages, 0 audit vulnerabilities.
- `npm test`: PASS; 18 Vitest tests and 10 Rust tests.
- `npm run lint`: PASS; TypeScript, rustfmt, and Clippy with `-D warnings`.
- `npm run build`: PASS; emitted `dist/app` and `dist/site`.
- `npm run test:e2e`: PASS; 20 local Chromium desktop/mobile tests.
- Live Playwright run against `PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in`: PASS; the same 20 tests cover demo isolation, privacy, keyboard/modal behavior, mobile reflow, and axe.
- `npm audit --audit-level=high`: PASS; 0 vulnerabilities.
- Static parity: every served file in locally rebuilt `dist/site` matched the live response by SHA-256 (31 files; excluding only deployment configuration `staticwebapp.config.json`). The deployed site therefore matches this candidate's static output.
- Bundle budget: the site entry JS is 3,528 bytes raw (1,690 gzip); demo JS 3,324 bytes raw (1,500 gzip); CSS 13,381 bytes raw (3,670 gzip). This is under the static JS/CSS budgets.

## End-to-end, accessibility, privacy, and headers

- At 390 × 844 with reduced motion, the live sample's Run button stayed disabled for an incorrect confirmation, enabled only for the exact runbook name, completed with redacted output, and reset to its isolated `sessionStorage` namespace. `localStorage` real history stayed null; there was no horizontal overflow.
- The live demo flow issued only same-origin requests (`/demo/` plus local hashed JS/CSS). Landing-page release lookup uses only the documented GitHub API; no telemetry, third-party fonts, raw Azure/OpenAI calls, console errors, or page errors were observed.
- axe-core analysis before and after demo completion found zero serious/critical violations. Keyboard smoke tests confirmed the visible skip link, Escape closure, dialog focus restoration, and reduced-motion path (zero active animations). No repository `verify-url.sh` exists; the equivalent live title/lang/main/alt/console and axe checks were performed through Playwright.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `/robots.txt`, `/sitemap.xml`, and `/latest.json` returned 200; an unknown route returned the designed 404. Crawled product links, download links, and legal links resolved successfully.
- Live headers include HSTS, restrictive CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and a restrictive Permissions-Policy. HTML has 30-second revalidation; hashed assets have `public, max-age=31536000, immutable`.
- Product-license rate-limit check: 30 consecutive invalid-license verify requests returned 200; requests 31–35 returned **429** with `Retry-After: 1`. Observed allowance: **30 requests per client window**.

No sign-in exists (Entra validation is not applicable). The product is not a PWA and has no product-owned backend, so service-worker update/offline reload and backend-concurrency checks are not applicable.

## Handoff

Do not promote until a new release tag ships the current native source to all supported platforms and the one-time checkout is enabled. The static deployment alone is current; it is not sufficient for this desktop-app artifact.
