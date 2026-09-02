# Independent verification 8 — FAIL

Date: 2026-09-02 UTC  
Candidate: `1c627893010a4ba0a1d92a10876de3380bef4056`  
Live URL: <https://hotkey-runbook.sociobot.in>  
Role: independent verifier  
Decision: **FAIL — do not release this candidate**

The live site is the candidate, the declared tests pass, and the first screen passes the mandatory first-read/demo gate. The candidate still fails the researched brief and safety contract. Most importantly, a native process receives inherited environment variables that the final consent screen does not show. New one-time licenses also cannot be bought, no platform sandbox is implemented, and the landing page loses content at 200% text size on a 390 px viewport.

## Release-blocking findings

### BLOCKER — the reviewed environment is not the executed environment

The claim `exact-environment-review` says the user reviews the exact environment before consent. The native implementation creates a child `Command`, adds runbook entries, and never calls `env_clear()` (`src-tauri/src/lib.rs:986-993`). Rust therefore passes the desktop app's inherited environment to the child. The consent UI renders only `step.env` (`src/main.ts:206-209`).

I reproduced this in the optimized native build with a fresh data directory:

1. Started Hotkey Runbook with `HOTKEY_QA8_INHERITED_MARKER=inherited-but-not-reviewed`.
2. Added and signed the evidence runbook `inherited-env-runbook/env.yaml`.
3. The final review showed `/usr/bin/printenv HOTKEY_QA8_INHERITED_MARKER`, the working folder, and rollback note. It showed no environment entry.
4. After exact-name consent, output was `inherited-but-not-reviewed` with exit 0.

Evidence: [review screenshot](verification-8-evidence/native-inherited-env-review.png), [result screenshot](verification-8-evidence/native-inherited-env-result.png), and [fixture](verification-8-evidence/inherited-env-runbook/env.yaml).

This is both a false safety claim and a practical secret-exposure risk: a reviewed runbook can read tokens, credentials, proxy values, and other variables inherited from the launcher without those values appearing in the consent step. The manifest test passes because it checks the prepared runbook environment, not the real child-process environment.

### BLOCKER — the contracted one-time purchase is unavailable

The researched brief specifies `"monetization": "one-time"`; the paid-unlock contract requires an exact price and a working Sociobot checkout link. The live site instead says **“New license sales are unavailable.”**, provides no price or buy action, and the product checkout endpoint returns:

```text
GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout
404
{"error":"enabled factory product","status":404}
```

Existing tokens can be restored and the free tier remains useful, but a new user cannot buy the advertised licensed capacity. This is an honest disclosure, not completion of the acceptance contract.

### HIGH — no execution sandbox is implemented

The brief requires “sandbox where platform support permits.” The native execution path directly calls `configured_command(prepared).output()` (`src-tauri/src/lib.rs:1060-1064`). A repository search found no seccomp, Landlock, bubblewrap, seatbelt, or other platform sandbox implementation. The terms page explicitly says the app does not provide a security sandbox on every operating system. Direct local execution may be useful, but it is a documented deviation from the supplied safety constraint.

### HIGH — 200% text resize causes horizontal content loss at 390 px

At a 390 × 844 viewport with the root font size set to 32 px, the landing page measured `scrollWidth=563` and `clientWidth=390`, a 173 px overflow. The specimen code sheet was 542.6 px wide and the license content reached 459 px. `/demo/`, `/privacy/`, and `/terms/` did not overflow under the same test.

Evidence: [200% text screenshot](verification-8-evidence/live-mobile-200pct.png). The intrinsic grid content in `.specimen` and `.license` is not allowed to shrink (`site/style.css:54-65,101-103`). This violates the required “text resizes to 200% without loss” accessibility check.

### MEDIUM — the license disclosure form is visible before activation

`#license-form` has the HTML `hidden` attribute (`site/index.html:80`), but `.purchase form { display:grid }` overrides the user-agent hidden style (`site/style.css:75`). A fresh live page reported `hidden=true`, computed `display=grid`, and `visible=true`. The “Restore an existing license” button and the token form therefore appear at the same time, so the disclosure control does not disclose anything. Existing tests exercise restoration but do not assert the initial hidden state.

## Mandatory first checks

### Claims manifest and tests

`.factory/claims.json` exists and contains 13 entries. I ran every listed command from this clean checkout through the shipped demo/sample entry points before the broader suite. All exact commands passed after installing the standard native Linux prerequisites documented in the README (`file`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, and `patchelf`).

| Claim | Exact result |
| --- | --- |
| `demo-isolated` | PASS — 2 Playwright tests |
| `exact-environment-review` | Test command PASS — 1 Rust test; **observable claim FAILS** in the optimized app as documented above |
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

The false `exact-environment-review` result demonstrates a coverage defect in that claim test; passing the declared command does not make the public claim true.

### Cold first-read test

PASS. At 1440 × 900, the first live screen plainly answered all three required questions:

- What: **“Run reviewed local YAML safely.”**
- For whom: “For operators and developers who repeat maintenance steps and need to stop copy-paste mistakes before a command runs.”
- First click: **“Try it with sample data”**, with adjacent text saying the safe sample opens and does not save to the visitor's folders.

The action is one click from the first screen and opens `/demo/` with realistic sample data. Evidence: [desktop first read](verification-8-evidence/live-desktop.png) and [mobile first read](verification-8-evidence/live-mobile.png).

## Clean-checkout quality gates

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 65 packages, 0 vulnerabilities reported |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| `npm run check` | PASS — 20 Vitest, 10 Rust, TypeScript, rustfmt, strict Clippy, production web build |
| `npm run test:e2e` | PASS — 20/20 desktop and mobile tests locally |
| `PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e` | PASS — 20/20 against live |
| `CI=false npm run tauri -- build --bundles appimage` | PASS — optimized Linux AppImage built after documented prerequisites were present |
| Debian bundle | PASS — v0.1.9 amd64 package metadata valid, about 4.6 MB |
| AppImage bundle | PASS — valid x86-64 ELF AppImage, about 77 MB |

Production web bundles are well inside budget:

- Desktop app JS: 23.82 KB raw / 8.14 KB gzip; CSS: 13.49 KB / 3.71 KB gzip.
- Landing JS: 3.53 KB / 1.69 KB gzip.
- Demo JS: 3.32 KB / 1.50 KB gzip.
- Shared site CSS: 13.38 KB / 3.67 KB gzip.

The first native build attempt correctly identified missing worker packages. It was rerun with the README's prerequisites and passed; this is not recorded as a candidate defect.

## Native product exercise

I launched the optimized local binary under Xvfb with a fresh `XDG_DATA_HOME` and also launched the published v0.1.9 AppImage with another fresh data directory.

- Initial state clearly offered **Load sample project**.
- Loading the sample created only the demo sample project, demo trust file, and local signing key. It did not create real trust or history files.
- Empty required secret submission showed “Sample access token is required.” and moved focus to the invalid control.
- Recovery with a representative secret worked. The review showed fixed executable, arguments, redacted environment value, canonical working folder, and rollback note.
- Wrong consent kept execution disabled. Exact-name consent plus Ctrl+Enter executed successfully.
- Output and demo history contained `[SECRET]`, not the representative secret.
- Restart restored demo mode and demo history.
- **Reset demo** removed demo history. **Start for real** removed the sample and presented an empty real history.
- Published AppImage SHA-256 matched `SHA256SUMS`: `94f01f417f25100603ac7d913a5549f80ce1746dd8ffe2a772840fcda831f2e6`.

Evidence screenshots are in `verification-8-evidence/native-*.png` and `verification-8-evidence/release-appimage-*.png`.

## Live web, privacy, accessibility, and performance

- `/opt/fleet/lib/verify-url.sh` passed: 200 response, useful title, `lang`, one `h1`, `main`, alt text, named buttons, and no console errors.
- axe-core 4.11 found 0 violations on `/` and `/demo/`; additional checks found 0 serious/critical issues in light, dark, demo-initial, and demo-completed states.
- At normal text size, 1440 px and 390 px layouts had no horizontal overflow. All measured interactive targets were at least 44 px high. The primary mobile action was 350 × 50 px.
- Keyboard-only use exposed a designed 3 px focus ring. The skip link was first in tab order. Demo dialog focus entered the confirmation field, Escape returned focus, and exact-name consent worked with Ctrl+Enter.
- With `prefers-reduced-motion: reduce`, the media query matched, scroll behavior was `auto`, and no animations were running.
- Dark mode used an explicit dark treatment and produced no accessibility or console errors.
- Browser demo storage used only `sessionStorage` key `demo:hotkey-runbook:history`; `localStorage` remained empty.
- The entire demo flow made same-origin requests only. The landing page contacted only its own origin and the documented GitHub release API. No analytics, external fonts, or third-party scripts loaded.
- Invalid-license recovery made no request while the required field was empty. A dummy token made one documented Sociobot verification request and produced a calm invalid-license message.

Lighthouse mobile against live:

| Category | Score |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

Measured FCP 1.0 s, LCP 1.2 s, TBT 20 ms, CLS 0.005, and 141,111 total transferred bytes.

Response policy checks passed:

- HTML: `Cache-Control: public, must-revalidate, max-age=30`.
- Hashed assets: `Cache-Control: public,max-age=31536000,immutable`.
- HSTS, CSP with header-only `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, `X-Frame-Options: DENY`, and restrictive permissions policy were present.

Evidence: [URL verifier](verification-8-evidence/verify.json), [axe output](verification-8-evidence/axe.json), [Lighthouse output](verification-8-evidence/lighthouse.json), and the `live-*.json/png` files.

## Deployment identity, routes, release, and request allowance

- Compared all 31 generated `dist/site` files that are publicly served, byte for byte, with live. There were 0 mismatches. Local and live `index.html` SHA-256 were both `1365cf66452ad668ee44b4a0598824aa896762efc52a1258a670e9dc57c241ad`.
- The GitHub **Static site** workflow for exact candidate `1c627893...` completed successfully: <https://github.com/B-Divyesh/sf-hotkey-runbook/actions/runs/33582789831>.
- `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` returned the intended pages. An unknown route returned the designed 404. All crawled internal, GitHub, and release links returned 200; `mailto:` was excluded.
- GitHub release v0.1.9 contains both macOS architectures, Windows MSI/EXE, Linux AppImage/deb, `SHA256SUMS`, and `latest.json`.
- The public static site contains no product-owned server endpoint. The only applicable server-side product API is the Sociobot license service. From one fresh client, verify requests 1–30 returned 200; requests 31–40 returned 429 with `Retry-After` (observed 3 then 2 seconds). Observed allowance: **30 requests per window per client**.
- Sign-in/Entra: not applicable; this product requires no account.
- PWA service worker/offline update: not applicable; this is a Tauri desktop app with a static landing/demo site and makes no offline web claim.
- Product backend concurrency/persistence: not applicable; native state is local files under the app data directory.

## Final decision

**FAIL.** Do not release candidate `1c627893010a4ba0a1d92a10876de3380bef4056`. The first-read gate, builds, declared tests, ordinary demo path, deployment identity, privacy, normal-size accessibility, release artifacts, and performance all pass. Acceptance remains blocked by the unreviewed inherited environment, unavailable one-time purchase, absent platform sandbox, and 200% mobile text overflow. The license disclosure defect is also unresolved.
