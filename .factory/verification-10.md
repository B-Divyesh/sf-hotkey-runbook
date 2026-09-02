# Independent product verification — FAIL

Verified on 2026-09-02 UTC.

- Candidate: `e126b39644f2aa55cce50a0edc0249f4ee24cab8`
- Live URL: <https://hotkey-runbook.sociobot.in>
- Artifact: Tauri 2 desktop app with static download/demo site
- Verdict: **FAIL — do not accept this candidate.** The functional, safety,
  privacy, accessibility, and build checks below passed, but the product still
  has no working one-time purchase path and its public copy includes unlisted
  claims. The shipped desktop artifact also cannot be proven to be this exact
  candidate commit.

## Mandatory first checks

### Claims gate — FAIL

`.factory/claims.json` exists and every one of its 14 declared commands was
run after `npm ci` from this checkout. All passed:

| Claim(s) | Command/result |
| --- | --- |
| `demo-isolated`, `demo-privacy`, `existing-license-recovery` | Their three `npm run test:e2e -- --grep @claim:…` commands passed (two browser projects each). |
| `exact-environment-review`, `platform-sandbox-boundary`, `native-safety-contract` | Their three `cargo test --manifest-path src-tauri/Cargo.toml …` commands passed (one native test each). |
| `native-demo-controls`, `local-privacy`, `free-tier-limits`, `licensed-runbooks`, `installer-integrity`, `keyboard-first-desktop`, `installer-sh-checksum`, `installer-ps1-checksum` | Their eight `npm run test:unit -- --testNamePattern @claim:…` commands passed (one matching Vitest test each). |

The claim manifest is nevertheless incomplete under the claims contract. The
landing page says **“No subscription or account is needed for the free tier.”**
and the README says **“There is no account, telemetry, or cloud sync.”** No
`no-account`, `no-telemetry`, or `no-cloud-sync` claim exists. The closest
entry, `local-privacy`, only asserts particular network origins and separate
history files; it does not test those visitor-facing promises. The landing
also makes the unlisted release assertion “Unsigned preview builds are
produced in public GitHub Actions.” Per the work order, such unlisted claims
fail verification until removed or given observable sandbox tests.

### Cold first-read and demo — PASS

A fresh 1440 px live visit states, in plain words:

- what it does: “Run reviewed local YAML safely.”;
- who it is for: operators and developers repeating maintenance steps and
  avoiding copy/paste errors; and
- what to click first: **Try it with sample data**, with the adjacent promise
  that it opens a safe sample project and does not save to the visitor’s
  folders.

`/demo/` opens the isolated sample directly. It has the persistent “Demo —
sample data, nothing is saved to your real runbooks” banner plus Reset demo and
Start for real controls. The installed app’s empty state similarly presents
Load sample project.

## Local quality gates — PASS

After installing the normal Tauri Linux host dependencies (`libgtk-3-dev`,
`libwebkit2gtk-4.1-dev`, `libsoup-3.0-dev`,
`libayatana-appindicator3-dev`, and `librsvg2-dev`), the clean checkout
completed:

```sh
npm ci                       # 65 packages, 0 vulnerabilities
npm test                      # 24 Vitest tests, 12 Rust tests passed
npm run lint                  # TypeScript, rustfmt, strict Clippy passed
npm run build                 # passed; dist/app and dist/site produced
PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e
                              # 22/22 passed
```

The exact production site build is compact: initial landing JavaScript is
`3.53 kB` (gzip `1.69 kB`) and CSS is `13.68 kB` (gzip `3.72 kB`). App-webview
JavaScript is `24.32 kB` (gzip `8.34 kB`).

## Product and desktop exercise — PASS

I downloaded the live v0.1.13 Linux AppImage, verified its SHA-256 against the
live `latest.json`, extracted it in `/tmp` (the verifier image has no FUSE),
and ran it under Xvfb with a fresh `XDG_DATA_HOME`:

1. The empty state showed **Load sample project** and separate-demo wording.
2. Loading it showed the sample banner, one low-risk runbook, typed
   environment and masked token fields.
3. Clearing the token and selecting Review exact command produced the visible,
   labelled recovery error “Sample access token is required.” Filling a token
   recovered without restart.
4. The consent dialog showed `printf`, direct arguments, only child
   environment with `[SECRET]`, working folder, Linux Landlock status, and the
   rollback note. It required exact runbook-name confirmation.
5. Confirming produced exit 0, the expected `Checking staging deployment`
   output, and the rollback note. No secret was displayed.

The claim tests separately cover folder/path limits, symlink/world-writable
rejection, digest invalidation, typed values, direct argv, redaction, Landlock
write boundary, separate history, and keyboard controller behavior.

## Live deployment, security, accessibility, and performance — PASS

- Fresh desktop and 390 px mobile Playwright checks passed. Keyboard skip-link,
  dialog focus containment/return, Escape, visible designed focus, 200% text,
  no horizontal overflow, and reduced-motion behavior were exercised by the
  22 passing live tests.
- Axe via the project’s Playwright integration found **zero serious or
  critical** issues on landing, demo, open demo dialog, and completed demo.
  The standalone `@axe-core/cli` could not start this container’s browser;
  supplying the preinstalled Playwright Chromium also crashed Selenium. This
  is a verifier-host limitation, not a substitute for the passing Playwright
  Axe scans.
- A fresh 390 px demo flow made exactly four requests, all same-origin:
  `/demo/` and its two JavaScript and one CSS asset. There were no console or
  page errors. It completed the sample without overflow under reduced motion.
- Live document headers include HSTS, `nosniff`, strict-origin referrer policy,
  `X-Frame-Options: DENY`, restrictive Permissions-Policy, and CSP with
  header-delivered `frame-ancestors 'none'`. Hashed assets use
  `public, max-age=31536000, immutable`; an unknown route returns a designed
  HTTP 404.
- A clean Lighthouse mobile run (with `--disable-dev-shm-usage`) reported
  Performance **95**, Accessibility **100**, Best Practices **100**, SEO
  **100**; LCP `1336 ms`, CLS `0.00469`. The first attempt crashed only while
  collecting the full-page screenshot and is not used for this result.
- Current local `dist/site` and live response SHA-256 values match for
  `index.html`, CSS, and both landing JavaScript modules.

## API allowance — PASS

Thirty sequential invalid-token calls to
`GET /api/v1/products/hotkey-runbook/verify` returned 200 (invalid verdict).
The 31st returned **429** with **`Retry-After: 3`**. The observed allowance is
therefore 30 requests for this client/window.

## Release and deployment identity — HIGH finding

The live `latest.json` and downloaded AppImage identify v0.1.13 source commit
`57258e3f605881ef6cd2f677685bf2f695706d87`, and the extracted artifact reports:

```json
{"version":"0.1.13","commit":"57258e3f605881ef6cd2f677685bf2f695706d87"}
```

The AppImage checksum passed:

```text
Hotkey-Runbook_0.1.13_linux-x86_64.AppImage: OK
```

That source commit is the parent of the requested candidate, not
`e126b39644f2aa55cce50a0edc0249f4ee24cab8`. The candidate changes deployment
metadata and release-distribution manifests as well as verification material.
The deployed static application bytes do match the candidate build, but the
desktop artifact cannot be asserted as an immutable build of the candidate.
Publish a tag/release whose embedded identity is the accepted candidate (or
submit the tagged source commit itself for verification).

## Defects

### Blockers

1. **One-time sales are unavailable.** The landing page and terms explicitly
   say new license sales are unavailable until registration, offer no checkout
   URL or price, and only restore old tokens. This does not meet the brief’s
   one-time monetization or the paid-unlock contract. Register the scoped
   Sociobot billing product and expose the documented checkout/verify flow;
   retain the existing recovery path.
2. **Unlisted visitor-facing claims.** The account/telemetry/cloud-sync and
   public-Action assertions described above have no one-to-one claims entry
   and sandbox test. Add them or remove/rewrite the copy.

### High

1. **Desktop release identity differs from the candidate.** v0.1.13 embeds
   `57258e3…`, not `e126b396…`; therefore the candidate-to-installed-artifact
   provenance required by this work order is incomplete.

### Disclosed non-blocking gap

The packages are unsigned. The landing page clearly calls them preview builds
and explains macOS/Windows first-launch warnings. Owner signing credentials
remain needed for a signed public release.

