# Independent product verification — FAIL

Verified on 2026-08-30 UTC.

- Candidate: `8afc0d416d6f1929dceec94087e21f0384c9276d`
- Branch: `main`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Artifact: Tauri 2 desktop app plus download site
- Verdict: **FAIL — do not release/promote this candidate**

The desktop core can load reviewed local YAML, validate parameters, show a consent dialog, execute direct argv, redact history, and recover from command failure. The candidate still fails two explicit release gates before functional scoring: `.factory/claims.json` is absent, and there is no one-click sample-data demo. The advertised paid checkout also returns 404.

## Mandatory first checks

### Claims gate — FAIL (release blocker)

`.factory/claims.json` does not exist. There were therefore no declared claim commands to run through the demo entry point. Per the work order, a missing manifest is itself release-blocking.

This also leaves many visitor-facing claims unlisted and unproved in the required sandbox, including “Works offline after install,” “Your runbooks stay local,” direct argv/no shell, trust invalidation, redaction, history limits, and installer checksum verification. The README repeats several of these claims.

### Cold first-read and demo gate — FAIL (release blocker)

At 1440 × 900, a cold visitor sees:

- What it does: “Turn careful procedures into one safe keystroke,” followed by a sentence about local YAML runbooks, typed parameters, exact arguments, redaction, and rollback notes.
- For whom: only the metaphorical eyebrow “Local operator’s field kit”; the required plain sentence does not name operators/developers or their repeated-maintenance situation.
- First click: “Download for Linux” (or “See the method”).

There is no “Try it with sample data” action, no “Load sample project” first-run action, no sample-data banner/reset/real-data separation, and no 3–5 frame app walkthrough. `.factory/demo.md` is absent. `/demo` returns the ordinary landing page rather than a demo. Evidence: `.factory/live-first-read.json`, `.factory/live-first-read-desktop.png`, `.factory/app-ui-qa.json`.

## Automated gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 65 packages installed; 0 vulnerabilities |
| `npm test` | PASS | 4 Vitest assertions; 3 Rust tests; 0 failures |
| `npm run test:e2e` | PASS | 4 Playwright cases across desktop and 390 px mobile |
| `npm run build` | PASS | TypeScript check plus app/site production builds; `dist/` produced |
| `npm run check` | PASS | Repeated tests, TypeScript check, and both builds |
| `npm audit --audit-level=high` | PASS | 0 vulnerabilities |
| `npm run tauri -- build --bundles deb` | FAIL as documented | Tauri rejects worker `CI=1` as an invalid Boolean |
| `CI=false npm run tauri -- build --bundles deb` | PASS | Native release binary and `.deb` produced |

There is no lint script. The site bundle is well under budget: 3.84 KB JS and 8.45 KB CSS uncompressed; the app webview is 20.71 KB JS and 12.98 KB CSS. The selected mobile hero is 64,170 bytes.

The checked-in suite is too narrow for its claims. It does not automate the native trust/execute/history workflow, the demo contract, claim-to-test coverage, checkout, release provenance, headers, or installer checksum consistency.

## Native end-to-end exercise

Tested the locally built release binary under Xvfb with an isolated `XDG_DATA_HOME` and an owned sample folder.

- Empty state, folder picker, digest review, acknowledgement, and trust succeeded.
- Normal case: `QA echo` ran `/usr/bin/printf` with a choice, integer, patterned ticket, and secret.
- Invalid case: `bad` produced “Ticket does not match its required format”; changing it to `OPS-42` recovered without restarting.
- Exact-name confirmation remained disabled until `QA echo` matched exactly.
- Review masked `swordfish` as `[SECRET]`.
- Result and persisted `history.json` replaced the secret and `OPS-42` with `[REDACTED]`.
- History survived an app restart.
- Failure case: the bundled `Inspect endpoint` sample exited 6 on an unresolvable host, displayed the failure output and rollback note, and persisted a failed history entry without exposing its token.

Evidence: `.factory/native-validation-error.png`, `.factory/native-review.png`, `.factory/native-result.png`, `.factory/native-failure-result.png`, `.factory/native-history-restart.png`, and `.factory/native-history.json`.

## Live deployment, privacy, accessibility, and performance

- Live `index.html`, hashed JS, and hashed CSS SHA-256 values exactly match the fresh candidate build.
- Normal first load made five requests, all same-origin: document, one hero image, JS, CSS, and `/latest.json`. No analytics, CDN fonts/scripts, console errors, or page errors were observed.
- Invalid license verification made only the documented request to `api.sociobot.in` and produced a calm error. The token and cached invalid verdict were stored under the documented namespaced keys.
- Billing rate limit: 30 verification requests succeeded in the tested burst; request 31 returned `429` with `Retry-After: 3` and `X-RateLimit-After: 3`.
- Desktop, 390 px mobile, dark color scheme, reduced motion, keyboard focus, and axe were checked. Axe reported zero serious/critical findings; focus rings were visible; no horizontal overflow or active animation remained under reduced motion.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 96, SEO 100; LCP 1.2 s, CLS 0.004, TBT 30 ms, FCP 0.9 s.
- Response headers include HSTS, `nosniff`, and a referrer policy. They do not include CSP or a clickjacking policy. Hashed assets are served with only `public, must-revalidate, max-age=30`.

Evidence: `.factory/live-qa.json`, `.factory/live-desktop.png`, `.factory/live-mobile.png`, `.factory/live-dark.png`, and `.factory/lighthouse-live.json`.

## Release/install checks

- GitHub release `v0.1.0` is public and contains two macOS DMGs, Windows MSI/EXE, Linux AppImage/DEB, `latest.json`, and `SHA256SUMS`.
- `latest.json` parses and supplies the four landing-page platform keys.
- Downloaded Linux AppImage SHA-256: `61da3938e0d07096ab14bcb850b83922714e8ad3fdfc53ccf5793ee646da1899`; it matches the manifest and checksum file.
- The documented live `curl .../install.sh | sh` flow downloaded, verified, and installed that AppImage successfully.
- Release tag `v0.1.0` resolves to commit `1ccf3d6cd76e600850f5d596b615686f60517a2e`, not the candidate. Core native sources are identical between those commits, but the distributed package is not provenance-linked to the tested candidate.

## Defects

### Blockers

1. **Required claim manifest/tests are absent.** `.factory/claims.json` is missing while the site and README make numerous concrete claims.
2. **Required one-click sandbox demo is absent.** No sample action or sample first-run project exists; `/demo` is only the landing-page fallback; `.factory/demo.md` is missing.
3. **The advertised purchase flow is broken.** `GET https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout` returned HTTP 404 with `{"error":"enabled factory product","status":404}` on 2026-08-30.

### High

1. **Execution consent omits environment variables.** YAML `steps[].env` values are substituted and passed to `Command`, but `PreparedStep` and the review UI include only program, argv, and cwd. A reviewed command can therefore execute with behavior-changing environment values that were never shown in the “exact processes” confirmation.
2. **Published binaries are not built from the candidate commit.** The release tag points to `1ccf3d6`, while this review targets `8afc0d4`. This prevents exact candidate-to-artifact provenance even though native source files did not change between them.

### Medium

1. **False/unimplemented export claim.** The landing page says “export [is] never paywalled,” but the app and repository contain no export action or implementation.
2. **Symlink-root claim is false.** README and handoff say symlinked folders are rejected. Native testing selected `/tmp/hkr-kr-symlink-sample`; the app canonicalized it to `/tmp/hkr-kr-safe-sample` and offered to trust it. Code canonicalizes before `symlink_metadata`. Evidence: `.factory/native-symlink-root-accepted.png`.
3. **Published checksum names do not match two release assets.** `SHA256SUMS` names `Hotkey Runbook_0.1.0_amd64.deb` and `Hotkey Runbook_0.1.0_x64-setup.exe`, but GitHub exposes them as `Hotkey.Runbook_...`; full `sha256sum -c SHA256SUMS` cannot resolve those downloaded asset names.
4. **Site routing/metadata contract is incomplete.** `robots.txt` and `sitemap.xml` return 404; arbitrary missing routes return the landing page with 200; there is no designed 404; canonical, favicon, Open Graph, and Twitter metadata are absent. Legal pages do not use the standard header/footer, and the footer has no build ID.
5. **Security/caching headers are incomplete.** No CSP or frame-ancestors/clickjacking header is sent. Hashed JS, CSS, and images use only a 30-second cache rather than long-lived immutable caching.
6. **Touch targets miss the 44 px baseline.** Desktop and mobile captures found navigation, download, legal, checksum/source links, and focusable command snippets with heights of 19–42 px.
7. **Plain-language contract is incomplete.** The first screen does not give the required audience/situation sentence and relies on field-kit/specimen metaphor. `.factory/copy-audit.md` is absent.

### Low / disclosed gaps

1. Long-running processes have no cancellation or configurable timeout. The synchronous native invocation can remain occupied until the process exits.
2. The documented native build command needs `CI=false` in this worker because Tauri rejects `CI=1`; README does not mention this environment-specific requirement.

## Acceptance decision

**FAIL.** The positive native flow, compact bundles, good Lighthouse results, privacy posture, and valid primary installer do not override the mandatory missing claims/demo gates, broken paid checkout, or execution-review omission. Reverify from a new candidate after the blockers and high-severity defects are addressed and the release artifacts are rebuilt from that candidate.
