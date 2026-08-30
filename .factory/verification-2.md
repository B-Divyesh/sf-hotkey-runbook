# Independent product verification — FAIL

Verified independently on 2026-08-30 UTC.

- Candidate: `a0d9dd4f92354ad93de922f72b535c65efc6e649`
- Branch: `main`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Artifact: Tauri 2 desktop app plus download site
- Verdict: **FAIL — do not promote this candidate**

The core local runbook workflow works, the live site matches the candidate, the listed claim tests pass, and the published Linux installer is usable. The candidate nevertheless fails the acceptance contract: the paid checkout returns 404, the native sample project never exposes its required demo banner/reset/exit controls, and numerous safety/product claims remain outside `.factory/claims.json`. The browser demo also lets keyboard focus escape its modal.

## Mandatory first checks

### Declared claims — PASS; claim inventory — FAIL

`.factory/claims.json` exists. Before other repository inspection, each exact command was attempted from the clean clone. The first attempt correctly failed because dependencies had not yet been installed. After the required clean `npm ci`, all three exact commands passed against the demo entry point:

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-isolated` | `npm run test:e2e -- --grep @claim:demo-isolated` | PASS — 2 projects passed |
| `exact-environment-review` | `npm run test:e2e -- --grep @claim:exact-environment-review` | PASS — 2 projects passed |
| `demo-privacy` | `npm run test:e2e -- --grep @claim:demo-privacy` | PASS — 2 projects passed |

The required cross-check still fails. The manifest covers only those three browser-demo statements. The landing page and README make many additional observable claims without a corresponding `@claim:<id>` test, including digest invalidation after YAML edits, fixed-program enforcement, secret/output redaction, local-only history, no telemetry/cloud sync, free-tier limits, direct-process execution, and checksum-pinned installers. Under the attached claims contract, any unlisted claim fails review until it is removed or listed and tested.

### Cold first read — PASS

At 1440 × 900 and at 390 × 844, the first screen plainly identifies:

- What it does: “Run reviewed local YAML safely.”
- Who it is for: operators and developers repeating local maintenance steps.
- What to click: “Try it with sample data,” with an adjacent explanation of the sample review and masked output.

The browser demo is one click away and immediately shows realistic sample data. Evidence: `qa-first-read-desktop.png`, `qa-live-mobile-first-screen.png`, and `qa-live-demo.png`.

The installed app also starts with a visible **Load sample project** action. However, its required persistent “Demo — sample data, nothing is saved” banner and **Reset demo**/**Start for real** controls never appear after the sample is loaded or after restart. This separate desktop demo-contract failure is a blocker; see Native exercise.

## Clean-clone gates

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 65 packages installed; 0 vulnerabilities |
| Three exact claim commands | PASS | 2 Playwright projects passed for each command |
| `npm test` | PASS | 5 Vitest and 5 Rust tests |
| `npm run test:e2e` | PASS | 12 tests across desktop Chromium and 390 × 844 mobile |
| `npm run check` | PASS | Tests plus both production web builds |
| `npm run build` | PASS | `dist/app` and `dist/site` produced |
| `npm audit --audit-level=high` | PASS | 0 vulnerabilities |
| `cargo fmt -- --check` | **FAIL** | Formatting drift throughout `src-tauri/src/lib.rs` |
| `cargo clippy --all-targets --all-features -- -D warnings` | **FAIL** | `unnecessary_map_or` at line 255 and `unnecessary_sort_by` at line 322 |
| Tauri production build | PASS after documented Linux prerequisites plus the host `file` utility | Release binary, `.deb`, and `.AppImage` produced |

The initial native build could not run in the stripped worker until the README's WebKit/GLib prerequisites were installed. AppImage packaging then additionally required the standard `file` host utility. With those build-host prerequisites present, the exact optimized native build completed.

Bundle output is comfortably within the web budgets:

- Desktop webview: 22.25 KB JS and 13.43 KB CSS uncompressed (7.68 KB and 3.70 KB gzip).
- Site: 3.56 KB landing JS, 2.58 KB demo JS, and 10.55 KB CSS uncompressed.
- Fresh live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.3 s, CLS 0.005, TBT 0 ms, Speed Index 1.0 s. Evidence: `qa-lighthouse-live.json`.

## Native desktop exercise

The optimized binary was run under Xvfb with a fresh, isolated `XDG_DATA_HOME`. No real user folders or data were used.

- Empty state and **Load sample project** worked.
- Sample files, trust state, and history were created only under the isolated app-data demo namespace.
- The sample loaded with its staging choice and required secret.
- The review showed the direct program, argv, environment, rollback note, and `HOTKEY_SAMPLE_TOKEN=[SECRET]`.
- Exact-name consent stayed disabled for a wrong name and enabled for the exact runbook name.
- Execution completed with exit code 0 and wrote separate demo history.
- Clearing the required secret produced a visible “Sample access token is required” error; entering a value recovered without restart.
- The sample/trust/history state survived an app restart.

The native demo mode is not visibly controllable. Screenshots after loading and after restart contain no demo banner or reset/exit actions. The code explains the result: `shell()` renders the banner once while `state.demoMode` is still false; the asynchronous state load and `loadSampleProject()` call only `render()`, which does not rebuild the shell. The banner handlers therefore never enter the DOM. This contradicts `.factory/demo.md` and the builder handoff. Evidence: `qa-native-initial.png`, `qa-native-sample-loaded.png`, `qa-native-sample-result.png`, `qa-native-required-error.png`, and `qa-native-restart.png`.

## Browser demo, accessibility, and privacy

The useful browser-demo path otherwise works:

- Sample review displays exact argv and a masked environment value.
- Exact-name confirmation controls the sample run.
- Completion is recorded only in `sessionStorage` under `demo:hotkey-runbook:history`; normal-history local storage remains absent.
- **Reset demo** clears the sample state.
- The demo request log contains only its same-origin document, JS, and CSS. The landing additionally requests the same-origin image/assets and the documented GitHub Releases API. No analytics, remote fonts/scripts, page errors, or console errors were observed.
- Axe found zero serious or critical issues on desktop light, desktop dark, mobile, reduced-motion, and demo states.
- The skip link is the first Tab stop and has a visible 3 px focus outline. Reduced motion is respected. No horizontal overflow was found at 390 px.

The sample review is not visually rendered as a modal. Its script emits `.scrim`, `.dialog`, `.dialog-close`, `.command-list`, and related app classes, but the site stylesheet defines none of them. The review is inserted in ordinary document flow between the main content and footer, without a backdrop or contained dialog layout. On 390 px mobile, opening it scrolls the page to `scrollY=1056` and places a 569.5 px unstyled section below the underlying runbook card.

It also fails keyboard containment. The review initially focuses `#demo-confirm`; two `Shift+Tab` presses move focus past Close to the underlying **Review exact process** button. `Escape` leaves the review present. The component is therefore neither visually nor behaviorally modal despite declaring `aria-modal="true"`. Evidence: `qa-live-modal-keyboard.json`, `qa-live-modal-focus-leak.png`, and `qa-live-modal-mobile.png`.

Three recurring links miss the 44 px target baseline: the wordmark is 38 px high, the Download navigation link is 42 px, and the footer wordmark is 38 px. The same measurements occur in the tested desktop/mobile/color-scheme states.

## Live deployment and headers

- Fresh `dist/site` hashes exactly match every deployed HTML page, hashed asset, favicon, robots/sitemap file, and install script. The live deployment therefore matches candidate `a0d9dd4`.
- `/`, `/demo/`, `/privacy/`, `/terms/`, `robots.txt`, and `sitemap.xml` return 200.
- Documents send CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, and Permissions Policy headers.
- Hashed JS and hero assets send `Cache-Control: public,max-age=31536000,immutable`; HTML uses the intended short cache.
- An unknown URL such as `/definitely-not-a-route-qa` returns the landing page with HTTP 200 instead of the designed 404 response.
- The deployed `/latest.json` still says `v0.1.0`, while GitHub's current release is `v0.1.1`. The landing happens to display v0.1.1 because it uses the GitHub API, but the product's own public update manifest is stale.

## Billing and request allowance

The product does not require sign-in, so the Entra External ID requirement is not applicable.

The advertised one-time purchase is broken. A fresh request to:

`https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout`

returned HTTP 404 with `{"error":"enabled factory product","status":404}` and no checkout redirect.

The public verification endpoint does enforce a request allowance. From one client, invalid verification requests 1–30 returned normal HTTP 200 invalid verdicts; request 31 returned HTTP 429 with `Retry-After: 2`. Observed allowance: **30 verification requests per client/window**.

## Release and installer checks

- Public release `v0.1.1` contains two macOS DMGs, Windows MSI/EXE, Linux AppImage/DEB, `latest.json`, and `SHA256SUMS`.
- The primary v0.1.1 AppImage downloaded successfully and matched its published checksum: `20675e0a9327b5d0047f1b0a623f1509ceb761a453c10f4549ec1fb799557ad0`.
- The exact public `curl -fsSL https://hotkey-runbook.sociobot.in/install.sh | sh` path downloaded, verified, installed, and launched the AppImage version probe in a clean location.
- GitHub normalizes spaces to periods for the published `.deb` and `.exe` asset names, but `SHA256SUMS` retains spaces for those two names. A full `sha256sum -c` against the actual downloaded release filenames therefore fails to locate those two files. The regression test checks pre-upload names and misses this GitHub normalization.
- The Homebrew cask, Scoop manifest, and winget manifest still pin v0.1.0 while the product advertises v0.1.1.
- Tag `v0.1.1` resolves to `2dfbc1256195153df173dd8f80e85fd493bc6729`, not the candidate. The only candidate delta from that tag is `.factory/handoff.md`; all product sources and release workflow files are identical. This is documented provenance drift, not a functional source mismatch.

## Defects

### Release blockers

1. **Advertised checkout returns 404.** A visitor cannot buy the stated $29 one-time license.
2. **The installed desktop sample omits the mandatory persistent demo controls.** After **Load sample project**, there is no demo banner, **Reset demo**, or **Start for real**, including after restart. This violates the desktop demo-sandbox contract and contradicts `.factory/demo.md`.
3. **The claim manifest is incomplete.** Safety, privacy, limits, local execution, trust invalidation, and installer claims on the landing page/README are unlisted and therefore lack the required one-to-one tagged sandbox tests.

### High

1. **The browser demo's core review is an unstyled, non-modal section.** Required dialog classes are absent from the site CSS, so the review is inserted below the runbook instead of over it. Focus escapes to underlying controls and Escape does not close the falsely declared `aria-modal` component. This fails desktop, mobile, and keyboard use of the core demo path.

### Medium

1. `cargo fmt --check` and strict Clippy fail, so the available type/lint-quality gates are not clean.
2. Release metadata is stale: live `/latest.json`, Homebrew, Scoop, and winget still describe v0.1.0.
3. Two checksum entries do not use the filenames GitHub publishes, preventing a complete `sha256sum -c` verification of downloaded assets.
4. Unknown routes return HTTP 200 and the home page instead of the designed 404 response.
5. Repeated wordmark/navigation links are 38–42 px high rather than the required 44 px minimum.
6. The desktop-app landing page does not provide the required captioned 3–5 frame screenshot walkthrough.

### Low / disclosed gaps

1. The Open Graph image is 1536 × 1024 rather than the required 1200 × 630 social image, and the apple-touch icon points to the SVG favicon rather than a 180 px touch icon.
2. Long-running native processes have no cancellation or configurable timeout.

## Acceptance decision

**FAIL.** Deployment identity, performance, privacy, response headers, browser responsiveness, declared claim tests, the native happy path, and the primary Linux installer all pass. They do not override the broken purchase flow or the mandatory native demo and claim-inventory failures. Reverify a new candidate after all blockers and the browser review defect are fixed, the release/package metadata is regenerated, and every visitor-facing claim has one executable tagged test.
