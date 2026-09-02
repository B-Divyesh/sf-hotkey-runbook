# Independent verification 9 — FAIL

Date: 2026-09-02 UTC  
Candidate: `292a58ee1f8de55344287f386726b4c2f10fbd26`  
Live URL: <https://hotkey-runbook.sociobot.in>  
Role: independent verifier  
Decision: **FAIL — do not release this candidate**

## First read

**PASS.** A cold 1440 px visit plainly said what the product does: “Run reviewed local YAML safely.” It named its users (operators and developers repeating maintenance steps), and the first action was the visible **Try it with sample data** link. Adjacent text explained that the safe sample opens without saving to the visitor’s folders. The same action is visible at 390 px.

## Release-blocking findings

### BLOCKER — the downloadable desktop app is not this candidate

The live static site is exactly the candidate build, but the release consumed by the landing page is not. Fresh GitHub release metadata and both local and live `/latest.json` identify v0.1.9 as commit `689372f95bda391f1bdbf4bf1f8efd50f66b2318`. That commit is an ancestor of, but is not equal to, candidate `292a58e`.

This is consequential rather than merely documentary. Candidate commit `a71a476` (between the tagged release and this candidate) adds `env_clear()` to the real child command and the Linux Landlock write boundary. The published installers therefore predate the fixes to the exact-environment review and the platform sandbox contract. A user downloading “Hotkey Runbook 0.1.9” gets a different, less-safe native product from the reviewed source.

The website’s v0.1.9 download label and `/latest.json` currently point to that old release. The Windows MSI was downloaded fresh and its SHA-256 correctly matches the old release manifest, which confirms artifact integrity but also confirms the stale identity.

Required resolution: publish/tag desktop installers from `292a58e` (with a new version/build identity), update `latest.json`/checksums, and verify one shipped artifact against that exact commit.

### BLOCKER — the required one-time purchase is unavailable

The brief sets monetization to `one-time`. The current site says new license sales are unavailable and exposes no price or checkout action. Fresh public request evidence confirms the scoped checkout endpoint is unavailable:

```text
GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout
404 {"error":"enabled factory product","status":404}
```

Existing-token restoration works, and the disclosure is honest, but a new user cannot buy the advertised licensed capacity. This does not meet the researched product contract. Provision the product in the Sociobot billing service and add the required exact-price checkout flow, or explicitly change the approved brief.

## Mandatory claim checks

`.factory/claims.json` exists and has 14 entries. From the clean checkout, after `npm ci` and installing the documented GTK/WebKit Tauri system prerequisites, I ran every `test` command exactly as listed. All passed.

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS — 2 Playwright tests |
| `exact-environment-review` | PASS — 1 Rust test |
| `platform-sandbox-boundary` | PASS — 1 Rust test (Landlock boundary exercised) |
| `demo-privacy` | PASS — 2 Playwright tests |
| `native-demo-controls` | PASS |
| `native-safety-contract` | PASS |
| `local-privacy` | PASS |
| `free-tier-limits` | PASS |
| `licensed-runbooks` | PASS |
| `installer-integrity` | PASS |
| `keyboard-first-desktop` | PASS |
| `installer-sh-checksum` | PASS |
| `installer-ps1-checksum` | PASS |
| `existing-license-recovery` | PASS — 2 Playwright tests |

## Clean-checkout quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 65 packages, 0 reported vulnerabilities |
| `npm test` | PASS — 20 Vitest and 11 Rust tests |
| `npm run lint` | PASS — TypeScript, rustfmt, strict Clippy |
| `npm run test:e2e` | PASS — 22 Playwright tests; `test-results/.last-run.json` reports `passed` |
| `npm run build` | PASS — `dist/app` and `dist/site` produced |

Production bundles meet the static budget: app JS is 23.91 KB raw / 8.19 KB gzip; landing JS is 3.53 KB raw / 1.69 KB gzip; demo JS is 3.32 KB raw / 1.50 KB gzip; shared CSS is 13.68 KB raw / 3.72 KB gzip.

## Live product QA

- The generated local `index.html`, landing JS, demo JS, shared JS, and CSS have the same SHA-256 hashes as the corresponding live resources. The static web deployment therefore matches `292a58e`.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `/404.html`, `/robots.txt`, `/sitemap.xml`, `/install.sh`, and `/install.ps1` returned 200.
- Desktop and 390 px demo visits had no console/page errors and no axe serious/critical findings. The demo’s complete sample flow made only same-origin requests, stored history only at `sessionStorage["demo:hotkey-runbook:history"]`, and left the real-history key absent. The landing additionally fetched only the documented GitHub release API.
- The normal and invalid confirmation paths are covered by the full Playwright suite. Manual normal flow showed fixed command/arguments, masked token in review, redacted result, and the attached rollback note.
- Keyboard testing at 390 px found the skip link first and a visible `rgb(163, 59, 43) solid 3px` focus outline on every tested control. The review dialog moved focus to the confirmation input. Reduced-motion rendering used `scroll-behavior: auto`.
- Live headers include HSTS, CSP with header-only `frame-ancestors 'none'`, `nosniff`, strict-origin referrer policy, frame denial, and restrictive permissions policy. Hashed assets are `max-age=31536000, immutable`; HTML is short-lived (`max-age=30`).
- Lighthouse mobile generated 97 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO; FCP/LCP were 1.2 s and CLS 0.005. Chrome crashed only while collecting the final full-page screenshot after audits completed; the report is retained at `/tmp/hotkey-lighthouse-live.json` in this verifier.

## API allowance and release evidence

The static product has no product-owned backend endpoint. For the documented Sociobot license verify API, 35 sequential invalid-token requests from this verifier received 200 for requests 1–30, then 429 on 31–35 with `Retry-After` of 3, 3, 3, 2, and 2 seconds. Observed allowance: **30 requests per client window**. No sign-in is used; Entra validation is not applicable.

Release v0.1.9 contains macOS arm64/x86_64 DMGs, Windows MSI/EXE, Linux AppImage/deb, `SHA256SUMS`, and `latest.json`. The downloaded `Hotkey-Runbook_0.1.9_windows-x86_64.msi` hash was `0f7e277a396017a168489cce06a161f19422848e618df7b2302f046964b73f31`, matching the manifest exactly. It remains an artifact for commit `689372f`, not the candidate.

## Final decision

**FAIL.** The candidate’s browser/static deployment and source quality gates are strong, but its installable desktop artifact is stale and omits candidate safety fixes, and its contracted one-time purchase cannot be made. Do not release `292a58e` until both blockers are resolved.
