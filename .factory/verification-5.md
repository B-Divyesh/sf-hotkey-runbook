# Independent verification 5 — FAIL

- Candidate: `eef13d5cf4aa56e53504b16b3ee434931267dcb4`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Verified: 2026-09-01 UTC
- Work order: `hotkey-runbook-verify-5`
- Decision: **FAIL — do not release this candidate**

The candidate passes its declared claims, build, automated suites, first-read gate, static deployment parity, and release checksum checks. It fails the acceptance contract because demo mode can expose real runbooks, a partially executed runbook can leave no history record, the completed light-theme demo has a serious contrast violation, mobile completion overflows the viewport, and the promised one-time purchase remains unavailable.

## First-read gate — PASS

A cold 1440 × 900 visit immediately says:

- What it does: “Run reviewed local YAML safely.”
- Who it is for: operators and developers repeating maintenance steps.
- What to click: “Try it with sample data,” with adjacent text explaining that a safe sample opens and is not saved to user folders.

One click opened `/demo/` with a populated “Inspect sample deployment” runbook and the persistent “Demo — sample data, nothing is saved” banner. No account or setup was required.

## Release-blocking findings

### High — desktop demo reads and permits selection of real runbooks

The native demo is not a separate sandbox. In an isolated application profile, I added a valid, device-signed real runbook directory, then loaded the bundled sample project. On restart the app displayed the demo banner while listing and selecting the real “Inspect endpoint” runbook from the external directory alongside the sample.

The implementation matches the observed behavior:

- `verified_runbooks()` loads every signed trust record (`src-tauri/src/lib.rs:531`).
- `current_state()` marks demo mode true if the sample path is present but returns every loaded runbook (`src-tauri/src/lib.rs:561`).
- `load_sample_project()` appends the sample record without separating real records (`src-tauri/src/lib.rs:657`).
- The UI renders the complete state list (`src/main.ts:88`).

This contradicts the visible native promise that sample data is separate and the mandatory demo contract that real data is never read or written while the demo banner is shown. A real command remains reachable while the interface says the user is in demo mode.

### High — later spawn failure loses the audit record after an earlier step ran

I created a valid signed two-step native runbook in a fresh profile:

1. `/usr/bin/touch` created a temporary marker.
2. A deliberately missing executable attempted to start.

After review and exact-name confirmation, the first step ran (`first_step_ran=yes`), the second produced “Could not start … No such file or directory,” and no history file was written (`history_written=no`). The rollback note existed only in the now-closed review state.

`execute_run()` returns immediately on a command spawn error through `?` at `src-tauri/src/lib.rs:997`; history construction and `save_history_entry()` at lines 1008–1019 are therefore unreachable. Non-zero process exits are recorded, but executable start failures are not. This breaks the required retained redacted history and leaves partially applied maintenance work without a durable failure or rollback record.

### High — serious color contrast failure after completing the light-theme demo

Fresh axe analysis at 390 × 844 after completing the live sample found one serious violation:

- Rule: `color-contrast`
- Node: `#reset-result`
- Foreground/background: `#e0e8df` on `#fcfaf1`
- Measured ratio: **1.19:1**; required: **4.5:1**

The result button is inserted at `site/demo/main.ts:60` and inherits the global `.text-button` color from `site/style.css:72`. Initial, dialog, and completed dark-theme states had no serious/critical axe findings, so the existing suite misses this post-action light-theme state. The acceptance contract requires zero serious/critical axe findings.

### High — the researched one-time purchase cannot be made

The live page says “$29 once” but “New purchases are unavailable” and intentionally provides no checkout link. A fresh request to the required endpoint returned:

```text
GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The copy is honest and its claim test passes, but it does not fulfill the researched one-time monetization scope or the paid-unlock contract requiring a working hosted buy link. Existing-license recovery alone is not an implementation of purchase.

### Medium — completed mobile demo and 200% text reflow horizontally

At a 390 × 844 viewport after running the sample, the live document measured `scrollWidth=429` and `clientWidth=390`; `.demo-list` and `.demo-sheet` extended to 428.58 px. At 200% text size, even the reset demo state measured 410 px against the 390 px viewport. The long preformatted result and grid min-content sizing in `site/style.css:80` force horizontal page scrolling. This fails the explicit 390 px mobile and 200% text-reflow requirements.

## Claims — all PASS after documented prerequisites

The worker image initially lacked the Linux WebKit/GLib development packages needed to compile Tauri. I installed the exact Debian prerequisites documented by the repository, then ran every command in `.factory/claims.json` from the clean checkout. No repository files were changed during bootstrap.

| Claim ID | Exact declared test | Result |
| --- | --- | --- |
| `demo-isolated` | `npm run test:e2e -- --grep @claim:demo-isolated` | PASS, 2 tests |
| `exact-environment-review` | `npm run test:rust -- @claim:exact-environment-review` | PASS, 1 test |
| `demo-privacy` | `npm run test:e2e -- --grep @claim:demo-privacy` | PASS, 2 tests |
| `native-demo-controls` | `npm run test:unit -- --run -t @claim:native-demo-controls` | PASS, 1 test |
| `native-safety-contract` | `npm run test:rust -- @claim:native-safety-contract` | PASS, 1 test |
| `local-privacy` | `npm run test:unit -- --run -t @claim:local-privacy` | PASS, 1 test |
| `free-tier-limits` | `npm run test:unit -- --run -t @claim:free-tier-limits` | PASS, 1 test |
| `installer-integrity` | `npm run test:unit -- --run -t @claim:installer-integrity` | PASS, 1 test |
| `keyboard-first-desktop` | `npm run test:unit -- --run -t @claim:keyboard-first-desktop` | PASS, 1 test |
| `installer-sh-checksum` | `npm run test:unit -- --run -t @claim:installer-sh-checksum` | PASS, 1 test |
| `installer-ps1-checksum` | `npm run test:unit -- --run -t @claim:installer-ps1-checksum` | PASS, 1 test |
| `purchase-availability` | `npm run test:e2e -- --grep @claim:purchase-availability` | PASS, 2 tests |

Each declared claim ID occurs in exactly one tagged test. No missing or duplicate claim tags were found.

## Build and automated verification

| Gate | Result |
| --- | --- |
| `npm ci` | PASS; 65 packages, 0 vulnerabilities |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm test` | PASS; 18 Vitest tests and 7 Rust tests |
| `npm run lint` | PASS; TypeScript, rustfmt, strict Clippy |
| `npm run test:e2e` | PASS; 18 local Playwright tests |
| `PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e` | PASS; 18 live desktop/mobile tests |
| `npm run build` | PASS; produced `dist/app` and `dist/site` |
| `CI=false npm run tauri build -- --bundles deb,appimage` | PASS; `.deb` and `.AppImage` produced |
| Candidate GitHub static workflow | PASS; run 33565029253 |

Built asset sizes were comfortably within budget: app JavaScript 23.16 KB raw / 7.99 KB gzip, app CSS 13.49 KB / 3.71 KB gzip, site entry JavaScript 3.53 KB / 1.69 KB gzip, and site CSS 12.88 KB / 3.58 KB gzip.

## End-to-end and boundary coverage

- Live browser: sample open, parameter selection, secret masking, wrong confirmation rejection, exact confirmation execution, redacted result, reset, and start-for-real paths exercised.
- Browser invalid input: blank required token was blocked by native validation; a wrong confirmation kept execution disabled; correction recovered normally.
- Desktop release: downloaded v0.1.8 AppImage was launched in an isolated XDG profile under Xvfb. “Load sample project,” review, exact confirmation, local execution, redacted success output, demo history, reset controls, and restart persistence were exercised.
- Native boundary/error behavior: trusted-directory signing, wrong confirmation, real-plus-demo coexistence, and a partial multi-step spawn failure were exercised.
- Free-tier/history boundaries are covered by passing unit and Rust tests.
- Keyboard-only live tests passed on desktop and 390 px mobile; focus rings were visible, dialogs trapped and restored focus, Escape closed the review, and reduced-motion animations/transitions resolved to zero-duration behavior.

## Deployment and release identity

- Every one of the 31 deployable files from `dist/site` matched the live response byte-for-byte by SHA-256, excluding only `staticwebapp.config.json`, which is deployment configuration rather than a served file.
- The live static deployment therefore matches candidate `eef13d5cf4aa56e53504b16b3ee434931267dcb4`.
- GitHub release v0.1.8 contains macOS arm64/x86_64 DMGs, Windows MSI/EXE, Linux AppImage/DEB, `SHA256SUMS`, and `latest.json`.
- Downloaded Linux AppImage: 79,727,096 bytes; SHA-256 `77d35d83e8860e5fc21c59d7ab5ce069c223ccb41295a05c416500af7c13d303`; `sha256sum -c` passed.
- The desktop release workflow completed successfully at commit `e3ac8f7790624805125e41580c188039ec097455`. Candidate changes after that tag do not alter application source; the candidate's static release metadata matches the published assets.

## Privacy, headers, network, routes, and performance

- The full live demo flow issued only same-origin requests and produced no console or page errors. The landing page additionally called only the documented GitHub Releases API. No analytics, tracking, CDN font, or raw model-provider request was observed.
- Root headers include a restrictive CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, and a permissions policy disabling camera, microphone, geolocation, and payment.
- Hashed assets use `Cache-Control: public, max-age=31536000, immutable`; HTML and metadata use 30-second revalidation caching.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `robots.txt`, `sitemap.xml`, and `latest.json` returned 200. An unknown route returned the designed 404. Crawled internal and external product links resolved successfully.
- A fresh mobile Lighthouse run scored Performance 98, Accessibility 100, Best Practices 100, and SEO 100. FCP was 1.0 s, LCP 1.2 s, TBT 170 ms, CLS 0.005, and transfer size 138 KiB. Lighthouse did not exercise the post-completion contrast defect above.
- Billing verify rate limit: requests 1–30 from one client returned 200; request 31 returned 429 with `Retry-After: 3`. Observed allowance: 30 requests per client per window.
- No sign-in exists, so Entra validation is not applicable. The product is not a PWA and has no owned backend, so service-worker/offline-update and backend persistence/concurrency checks are not applicable.

## Required next steps

1. Make native demo state expose only bundled demo runbooks and prevent all real runbook/history access until “Start for real.”
2. Persist a redacted failed history entry, completed-step context, and rollback note whenever any later command cannot spawn.
3. Test and fix completed-demo light-theme contrast and 390 px/200% reflow.
4. Register and verify the one-time Sociobot product, expose the hosted checkout link, and keep existing-license recovery.
5. Add regression tests that reproduce each defect before resubmitting.
