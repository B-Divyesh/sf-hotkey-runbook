# Handoff — repair 8

## Result

Repaired the release blockers reported in [verification-8.md](verification-8.md) for candidate `1c627893010a4ba0a1d92a10876de3380bef4056`. The repaired tree is buildable, fully tested, and ready for the static deployment triggered by the repair commit.

## What changed

### Exact native process environment

- `configured_command` now calls `env_clear()` before adding the reviewed YAML `env` map. A child receives no inherited launcher variables.
- The desktop consent screen now always shows the child environment, including `none`, and explicitly says inherited launch variables are cleared. It also shows the step's sandbox status.
- The `@claim:exact-environment-review` regression sets `HOTKEY_QA8_INHERITED_MARKER=inherited-but-not-reviewed` in the parent process and executes `/usr/bin/printenv` through the real command builder. It now proves exit `1` and empty stdout; a reviewed `HOTKEY_REVIEWED_VALUE` still prints `shown-in-consent`.
- Before the fix, this exact regression failed with “an unreviewed parent environment value reached the child process,” reproducing verifier finding 1 before code changed.

### Platform sandbox boundary

- On Linux with Landlock ABI 1 or newer, each child receives `no_new_privs` and a Landlock policy that denies file mutations outside the canonical reviewed working folder. The direct execution stays the reviewed executable and argv; no wrapper changes what the user reviews.
- The consent status and documentation state the actual boundary. It is deliberately narrow: it does **not** isolate file reads or network access. On macOS, Windows, and Linux environments where Landlock is unavailable, the review says no process sandbox is active and the process uses the user's normal OS permissions.
- `@claim:platform-sandbox-boundary` writes inside and outside the reviewed folder. On this host Landlock ABI 3 was available; the inside write succeeded, the outside write was denied, and the process failed as expected.

### Landing accessibility and license recovery

- Restored native hidden semantics with `[hidden] { display:none!important; }`; the existing-token form is initially absent from layout, then becomes visible and receives focus only after its disclosure button is activated.
- Made the specimen code sheet, label, license grid, and purchase form shrinkable/wrappable. At 390 px with 200% root text, the landing now has no horizontal overflow before or after opening the license form.
- Removed any checkout or new-sales implication. The app and site state only that this release does not offer checkout; owners of a valid earlier token can still restore it. No scoped checkout endpoint was accessed.
- Updated README, Terms, Privacy, landing copy, and the copy audit to document the narrowed, platform-specific security boundary and the existing-license-only state.

## Verification

Fresh setup and quality gates:

```sh
npm ci
npm audit --audit-level=high
npm run check
npm run test:e2e
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e
CI=false npm run tauri -- build --bundles appimage
```

Results:

- `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm run check`: 20 Vitest tests, 11 Rust tests, TypeScript, rustfmt, strict Clippy, and both production builds passed.
- All 14 exact commands in `.factory/claims.json` passed. This includes the two new native execution-level claims.
- Playwright: 22/22 passed for both the source server and the production static build at desktop and 390 px mobile sizes. The new test asserts 200% reflow, bounding boxes, the hidden form, disclosure focus, no checkout action, and existing-token restoration.
- Playwright Axe integration found 0 serious or critical violations on landing, demo, completed demo, and modal states. The standalone Axe CLI could not start its Selenium-managed Chrome in this container; the shipped Playwright Axe integration is the successful accessibility gate.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/repair-8-verify` passed: title, `lang`, one `h1`, `main`, image alts, named buttons, and no console errors. Evidence: [repair-8-verify](repair-8-verify/).
- Lighthouse local mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.01 s, LCP 1.49 s, CLS 0.005. Evidence: [repair-8-lighthouse.json](repair-8-lighthouse.json).
- Production static bundles: site JavaScript 3.53 KB raw / 1.69 KB gzip, shared CSS 13.68 KB raw / 3.72 KB gzip; desktop app JavaScript 23.91 KB raw / 8.19 KB gzip.
- AppImage build passed. `src-tauri/target/release/bundle/appimage/Hotkey Runbook_0.1.9_amd64.AppImage` is a valid x86-64 ELF (79,739,384 bytes). The packaged binary launched under Xvfb with a fresh temporary data directory.

## Deployment and operator notes

- Static deployment is performed by the factory from the pushed `main` commit. After the push, verify the live page bytes, security/cache headers, routes, and browser suite before treating the deployment as accepted.
- Existing license verification remains optional and only contacts the documented Sociobot verification API after a user submits or has already stored a token. No purchase or checkout link is present.
- The operator-gated checkout is intentionally not integrated or probed by this repair. Registering a future new-sale flow requires operator action outside this work order; until then the product must remain existing-license-only.
- macOS and Windows release artifacts remain unsigned, as documented in the existing release workflow and README.
