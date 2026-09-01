# Independent product verification 4 — FAIL

Verified on 2026-09-01 UTC.

- Candidate: `f75b74f6090019fdfd76b846740e176a9e102376`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Product: Tauri desktop app with a static download site
- Decision: **FAIL — do not promote this candidate**

The local test suite, production web build, browser sample, accessibility checks, release artifact check, deployment identity, privacy request log, response headers, and caching checks passed. The product is not ready to promote because the advertised one-time license cannot currently be purchased: the documented checkout endpoint returns HTTP 404.

## Required first checks

`.factory/claims.json` is present. After `npm ci` and the documented Linux Tauri prerequisites, every listed command passed from this checkout.

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

The initial native claim attempt correctly reported absent host GLib/WebKit development libraries. Installing the README-listed prerequisites made the same command pass. This is a worker-image prerequisite, not a product failure.

## First read and browser demo

PASS at 1440 × 900 and 390 × 844.

- The first screen says what it does: “Run reviewed local YAML safely.”
- It identifies the audience: operators and developers repeating maintenance steps.
- The visible first action is **Try it with sample data**, with a plain explanation that it opens a safe sample without saving into the visitor’s folders.

The live `/demo/` path immediately presents a populated `Inspect sample deployment` sample. The review displays `printf`, its resolved argument, masked `HOTKEY_SAMPLE_TOKEN`, its app-data working folder, rollback note, and exact-name confirmation. An incorrect name keeps the action disabled; the exact name completes the sample and redacts the token in the result. It saves only `demo:hotkey-runbook:history` in `sessionStorage`; **Reset demo** removes it and no normal-data `localStorage` key appears.

## Local quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 0 audited vulnerabilities |
| `npm test` | PASS — 18 Vitest and 7 Rust tests |
| `npm run lint` | PASS — TypeScript, rustfmt, strict Clippy |
| `npm run test:e2e` | PASS — 18 Playwright tests |
| `npm run build` | PASS — `dist/app` and `dist/site` produced |

The landing initial JavaScript is 4.49 KB gzip and CSS is 3.58 KB gzip. The app webview JavaScript is 7.98 KB gzip and CSS is 3.71 KB gzip. These are within the applicable budgets.

## Live QA, privacy, and accessibility

- Fresh Playwright request logs for the entire demo flow contained only the same-origin document, JavaScript, and CSS. The landing used only same-origin assets plus the documented GitHub Releases API. No analytics, third-party fonts/scripts, console errors, or page errors were seen.
- `@axe-core/playwright` found zero serious or critical findings on the completed demo at desktop and 390 px mobile widths.
- Keyboard QA: the landing skip link is first and has a visible 3 px focus outline; the review dialog starts at its confirmation field, keeps Tab focus within the dialog, Escape closes it, and returns focus to **Review exact process**.
- On 390 px in dark/reduced-motion mode there was no horizontal overflow, no visible interactive target under 44 px, and transition duration was `0s`.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` return 200; an unknown route returns the designed 404 with HTTP 404. The ten non-fragment landing links all returned successful responses.
- Headers include CSP with `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options`, Referrer Policy, `X-Frame-Options: DENY`, and Permissions Policy. HTML uses a 30-second cache; hashed JavaScript, CSS, and images use `public, max-age=31536000, immutable`.
- A fresh candidate `dist/site` comparison found all 24 deployable files byte-identical to the live URL responses.

## Desktop core and release evidence

The Rust suite covers direct argument preparation, typed parameter validation, review of environment and working folder, exact-name consent, secret masking/redaction, trust digest changes, symlink/world-writable folder rejection, limits, demo controls, and local history boundaries. `npm run build:app` passed as part of the exact production build.

Release `v0.1.7` has both macOS DMGs, Windows MSI/EXE, Linux AppImage/DEB, `SHA256SUMS`, and `latest.json`. The downloaded Linux AppImage is a valid x86-64 ELF and its SHA-256 is `0f7c44ed085178065effa4ff0cdd71a975d83d64d87510f363ac50fe4d5915ac`, matching `SHA256SUMS` and the deployed `latest.json`.

`v0.1.7` points to `9fb451c`; the candidate differs only in deployment metadata, package manifests, and factory documentation. Application source is unchanged, and the deployed static artifact is byte-identical to the fresh candidate build.

## Product-service check

The product has no sign-in, so an Entra sign-in check does not apply. The documented license-verification endpoint was checked from one client: requests 1–30 returned normal HTTP 200 invalid-license verdicts, and request 31 returned HTTP 429 with `Retry-After: 2`. Observed allowance: **30 requests per client/window**.

## Findings

### Release blocker

1. **A new customer cannot purchase the advertised one-time license.** `GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout` returned HTTP 404 with `{"error":"enabled factory product","status":404}` and no checkout redirect. The site and README state a $29 one-time license, while the app presently says new purchases are temporarily unavailable. This does not satisfy the researched one-time monetization scope or the paid-unlock contract.

### Medium

1. **The $29 price/purchase-availability statement lacks its own executable claim entry.** It appears in the README and landing copy but `.factory/claims.json` contains no tagged observable test for it. The current 404 response also prevents such a test from confirming the stated purchase flow.

## Acceptance decision

**FAIL.** Resolve the product checkout registration so the documented Sociobot checkout redirects correctly, add a matching observable claim test for the stated price/purchase path, then repeat independent verification. No product code, deployment configuration, DNS, billing configuration, secrets, or unrelated resources were changed during this verification.
