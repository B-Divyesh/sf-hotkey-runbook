# Independent product verification 11 — FAIL

Verified 2026-09-05 UTC.

- Reviewed candidate / documentation SHA: `9b8625db6a2a9e505d52ae38134bc70e2fda0ea5` (`v0.1.14`)
- Product implementation SHA: `bacdedbfd1d5a3ded06b6ee82c0e421a9f30f5dc`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Artifact: Tauri 2 desktop app with static landing and sample demo
- Verdict: **FAIL — do not accept this release.** There is one external
  blocker and no untested declared claims. The advertised $29 purchase route
  is a real user path and it currently ends in the scoped billing service's
  deliberate HTTP 404, so a new customer cannot complete the advertised
  one-time purchase.

## First read

Fresh desktop and 390 × 844 phone visits stated the job, audience, and first
action before scrolling:

- Job: **Run reviewed local YAML safely.**
- Audience: operators and developers who repeat maintenance steps and need to
  prevent copy/paste mistakes before a command runs.
- First action: **Try it with sample data**. The adjacent copy says the demo
  opens a safe sample project and does not save to the visitor's folders.

The first action opens `/demo/` directly with a realistic populated deployment
inspection. Its persistent banner says that it is sample data, has **Reset
demo** and **Start for real**, and the live browser suite exercised normal,
invalid-confirmation, recovery, reset, keyboard, touch, reduced-motion, and
200% text paths on desktop and phone.

## Declared claims and clean quality gates

I cloned `main` afresh at `9b8625d`, ran `npm ci`, and installed the
README-documented Linux Tauri host packages before native checks. All 18 exact
commands in `.factory/claims.json` passed. This includes the three Rust safety
claims, eight unit claims, and seven browser claims. The checkout claim command
passes only against its documented intercepted fixture; its real production
path is the finding below.

| Check | Result |
| --- | --- |
| `npm run test:unit` | PASS — 25 Vitest tests |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS — 12 Rust tests |
| `npm run lint` | PASS — TypeScript, rustfmt, and Clippy with `-D warnings` |
| `npm run build` | PASS — `dist/app` and `dist/site` produced |
| Local Playwright suite | PASS — 30 desktop/mobile tests |
| Live Playwright suite | PASS — 30 desktop/mobile tests against the deployed URL |
| Declared claim commands | PASS — 18/18 exact commands |

The built static landing entry is 3.60 kB JavaScript (1.69 kB gzip) and
13.77 kB CSS (3.73 kB gzip). The app webview entry is 24.50 kB JavaScript
(8.39 kB gzip). Fresh mobile Lighthouse was 100 for Performance,
Accessibility, Best Practices, and SEO; LCP was 1221 ms and CLS was 0.00469.

`/opt/fleet/lib/verify-url.sh` on the live landing reported the expected
title, `lang=en`, one `h1`, a `main` landmark, no missing image alt text, no
unlabelled buttons, and no console errors. The live Playwright Axe integration
reported zero serious or critical violations across the landing and demo
states. It also covers visible focus, skip link, dialog focus handling,
keyboard Escape, touch-target size, reduced motion, and 200% mobile reflow.

## Live routes, privacy, and service boundary

- `/`, `/demo/`, `/privacy/`, `/terms/`, and `/404.html` returned 200. An
  unknown route returned the designed 404 with HTTP 404, not a broken landing
  fallback. Route titles, legal pages, `robots.txt`, and `sitemap.xml` are
  present.
- The live header sends HSTS, `nosniff`, strict-origin referrer policy,
  `X-Frame-Options: DENY`, restrictive Permissions-Policy, and a CSP with
  header-delivered `frame-ancestors 'none'`.
- The fresh browser sample's recorded requests were same-origin. The landing's
  only documented external runtime request is GitHub release metadata. There
  are no third-party fonts, scripts, analytics, or telemetry requests.
- This product has no product-owned backend, account tenant, health endpoint,
  or web offline/update promise. Native persistence is local; the clean
  AppImage profile retained only its demo namespace across relaunches.
- The scoped license verification API allowed 30 sequential invalid requests;
  request 31 returned `429` with `Retry-After: 3`. No tenant data was used.

## Installed artifact exercise

The public v0.1.14 Linux AppImage was downloaded into a fresh temporary
consumer directory. `sha256sum -c SHA256SUMS --ignore-missing` returned:

```text
Hotkey-Runbook_0.1.14_linux-x86_64.AppImage: OK
```

Its extracted executable reported:

```json
{"version":"0.1.14","commit":"9b8625db6a2a9e505d52ae38134bc70e2fda0ea5"}
```

Under Xvfb with a new `XDG_DATA_HOME`, the installed artifact showed **Load
sample project**. Loading it created `demo-sample-project` and
`demo-trusted-directories.json`, not real trust or history files. The visible
demo banner provided Reset demo and Start for real. I reset the demo, then
completed the bundled run: the consent dialog showed fixed `printf` argv, a
masked child environment value, the demo working folder, Linux Landlock
status, rollback note, and exact-name confirmation. It finished with exit 0,
redacted output, and only `demo-history.json`. This demonstrates the normal,
reset, and restart-safe sample paths without real data.

## Earlier findings disposition

All earlier reports (`verification-2` through `verification-10`) were
reviewed, including their minor items.

| Earlier finding group | Current disposition |
| --- | --- |
| Missing/incomplete claim inventory, recovery proof, licensed limits, account/telemetry/cloud-sync claims | Fixed: the manifest now has 18 unique claims and each exact command passed. |
| Browser dialog, focus escape, target sizes, contrast, mobile/200% overflow, initial disclosure visibility | Fixed: the 30 live browser tests and Axe checks pass on both projects. |
| Demo controls, demo reading real runbooks, history loss after partial spawn, sample isolation | Fixed: native regression tests pass; the independently exercised AppImage used only the demo project, trust record, and history. |
| Unreviewed inherited environment and missing Linux sandbox boundary | Fixed: current Rust claims pass; the installed review states inherited launch variables are cleared and displays the Landlock status. |
| Stale installer/release provenance and checksum-name mismatch | Fixed: release `v0.1.14`, `latest.json`, SHA256SUMS, and the AppImage identity all match `9b8625d`. |
| One-time purchase unavailable | **Still open — blocker below.** |
| Unsigned macOS/Windows previews | Disclosed non-blocking gap. The site accurately labels them unsigned; owner signing credentials remain an operator task. |

## Finding

### BLOCKER — new $29 one-time purchases cannot complete

The landing page, Terms, README, and desktop Settings advertise a $29 one-time
license and link to the required scoped Sociobot checkout. A direct fresh
request to that exact link returned:

```text
GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The HTTP 404 is deliberate and is not itself a broken-page defect. However,
the linked customer purchase path therefore fails, making the public
`one-time-license-purchase` claim false in production despite its passing
intercepted fixture test. Register the approved scoped billing product and
confirm that this endpoint redirects to hosted checkout. No product code,
shared service, credentials, or other product was changed during this review.

## Result

**FAIL.** Finding count: **1** (blocker). Untested declared-claim count:
**0**. Acceptance requires the scoped billing registrar action above, followed
by a fresh checkout-path verification.
