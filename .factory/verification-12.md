# Verification 12 — run reviewed local YAML safely

Verified 2026-09-05 UTC.

- Implementation candidate: `v0.1.15`, `3b59853dfa78a195143f236e5bc0f4ad86dc36f8`.
- Documentation/review baseline: `8cb1e79a6cc9363c79e5be4e6369dc8075b7ff88`.
- Live URL: <https://hotkey-runbook.sociobot.in>
- Artifact: Tauri 2 desktop app with static site and isolated browser demo.
- Verdict: **FAIL — do not accept this candidate.** Finding count: **1**. Untested declared-claim count: **0**.

## First read

Fresh 1440×900 desktop and 390×844 phone contexts both stated the required information before scrolling:

- Job: **Run reviewed local YAML safely.**
- Audience: operators and developers who repeat maintenance steps and need to stop copy/paste mistakes before a command runs.
- First action: **Try it with sample data**; the adjacent text says that it opens a safe sample project and does not save to the visitor's folders.

There were no browser console or page errors on either landing-page visit. The live site now reports `v0.1.15` and serves the current CSP including the Test billing origin.

## Declared claims and quality gates

From a clean `npm ci` checkout, after installing the README-documented Tauri Linux host packages, these passed:

| Check | Result |
| --- | --- |
| `npm test` | PASS — 25 Vitest and 12 Rust tests |
| `npm run lint` | PASS — TypeScript, rustfmt, and Clippy with `-D warnings` |
| `npm run build` | PASS — `dist/app` and `dist/site` produced |
| `npm run test:e2e` | PASS — 32 Playwright/Axe desktop and mobile checks |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `verify-url.sh` on live root | PASS — title, `lang=en`, one h1, main, image alt text, labelled buttons, and no console errors |

Every exact command declared by `.factory/claims.json` was run individually and passed:

| Claim | Result |
| --- | --- |
| `demo-isolated` | PASS |
| `exact-environment-review` | PASS |
| `platform-sandbox-boundary` | PASS |
| `demo-privacy` | PASS |
| `native-demo-controls` | PASS |
| `native-safety-contract` | PASS |
| `local-privacy` | PASS |
| `no-account` | PASS |
| `no-telemetry` | PASS |
| `no-cloud-sync` | PASS |
| `free-tier-limits` | PASS |
| `licensed-runbooks` | PASS |
| `installer-integrity` | PASS |
| `keyboard-first-desktop` | PASS |
| `installer-sh-checksum` | PASS |
| `installer-ps1-checksum` | PASS |
| `existing-license-recovery` | PASS |
| `one-time-license-purchase` | PASS |

## Live product and checkout

The fresh `/demo/` flow displayed its persistent sample label, completed the realistic deployment check, stored only `demo:hotkey-runbook:history` in `sessionStorage`, and removed that key on **Reset demo**. It made only same-origin requests and did not read or write the real-history key.

The public scoped checkout redirected to `checkout.dodopayments.com` and rendered **Hotkey Runbook License**, **$29.00**, and the one-time license description. The live verifier returned HTTP 200 with `valid: false, reason: invalid` for a deliberately invalid token. Thirty requests were accepted in the observed window; subsequent requests returned 429 with `Retry-After: 4`. No live payment or customer information was created. The prior Test checkout evidence remains the end-to-end proof of an issued token returning to the product and validating as `valid: true`.

`/`, `/demo/`, `/privacy/`, `/terms/`, `/404.html`, `robots.txt`, and `sitemap.xml` returned 200. An unknown URL returned the designed page with HTTP 404, which is expected rather than a defect by itself. Privacy, terms, download recovery, keyboard focus, focus-trapped consent dialog, Escape, reduced motion, touch targets, and 200% text reflow are covered by the passing browser suite.

## Installed artifact

The published Linux AppImage checksum matched the v0.1.15 manifest:

```text
Hotkey-Runbook_0.1.15_linux-x86_64.AppImage: OK
```

Its extracted `AppRun --build-identity` reported version `0.1.15` and commit `3b59853dfa78a195143f236e5bc0f4ad86dc36f8`. In a fresh `XDG_DATA_HOME` profile under Xvfb it opened the first-run screen and **Load sample project** created only `demo-sample-project`, `demo-trusted-directories.json`, and the device-local signing key. The displayed banner stated that real runbooks and history were not read or changed. No real runbook data was used.

## Earlier findings disposition

The checkout 404 and stale-edge CSP findings from verification 11 are fixed: the current live edge is v0.1.15, its CSP permits the documented Test billing origin, and the live checkout renders the registered $29 offer. The earlier claim-inventory, browser focus/reflow, demo isolation, native safety, installer integrity, release identity, and checkout-return findings remain covered by the passing tests and checks above. Unsigned macOS and Windows preview packages remain accurately disclosed and are not a new defect.

## Finding

### Medium — public and desktop copy breaks the plain-words contract

The work order requires direct words and explicitly prohibits metaphor and mood headings on every page and in the desktop interface. The live landing caption says **“A reviewed procedure shown as a field-guide specimen before it is handled.”** The designed live 404 page uses **“This page is not in the runbook.”** as its h1. The independently opened installed app also labels its first screen **“Local specimen index”**, **“Specimen drawer”**, and **“Your drawer is empty.”** These are product lore rather than the operator's direct task language, and the 404 heading does not plainly say that the page was not found.

Replace these phrases with direct labels and sentences (for example, “Local runbooks,” “Runbooks,” “No runbooks yet,” and “Page not found”), then update the copy audit and rerun the quality gates. This is one copy-contract finding with several current examples; it does not invalidate the otherwise working 404 or desktop sample path.

## Result

**FAIL.** The candidate is not accepted until the one medium plain-language finding is repaired and independently rechecked.
