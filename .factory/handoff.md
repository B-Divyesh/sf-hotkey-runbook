# Repair handoff — PASS

## Outcome

Release-blocking findings from verifier commit `4fa513da8377dde08a82a5aa0c68492e9a5d8a0c` are repaired. The production site is deployed at <https://hotkey-runbook.sociobot.in>, returns the designed 404 for unknown paths, and advertises the current `v0.1.3` native release.

- Release tag: `v0.1.3` (`e8475773a09da0584be6ce97573ea16c38772ecf`)
- Release workflow: <https://github.com/B-Divyesh/sf-hotkey-runbook/actions/runs/33301993470> — success
- Post-release verification/evidence commit: `e271ae4`
- GitHub release: <https://github.com/B-Divyesh/sf-hotkey-runbook/releases/tag/v0.1.3> — 8 assets
- Deployment target: existing `sf-hotkey-runbook` Static Web App only. DNS, billing, databases, key vaults, and other services were not read or changed.

The release tag contains every runtime repair. Later commits only expand test-only claim coverage, pin hashes produced by that release, support live browser verification, and record evidence.

## Repaired findings

1. The installed sample now renders a persistent native demo banner after asynchronous state loads. **Reset demo** rebuilds the isolated sample and remains in demo mode; **Start for real** discards it. The state persists correctly across restart.
2. Checkout is disabled unless `VITE_CHECKOUT_ENABLED=true`. Production shows an honest unavailable state and keeps existing-license paste/verification recovery. Billing was not changed.
3. `.factory/claims.json` now lists eight observable claims. Each ID appears in exactly one `@claim:<id>` test. Coverage includes demo isolation/privacy, complete review, native demo controls, folder and YAML safety limits, every parameter type, direct argv/environment handling, masking/redaction, local privacy, tier limits, and installer integrity.
4. The browser review is a styled, viewport-contained modal with backdrop, body-scroll lock, focus entry/loop/return, Escape/backdrop close, and mobile bottom-sheet treatment.
5. Rust is formatted and strict Clippy-clean. `npm run lint` enforces TypeScript, rustfmt, and `clippy -D warnings`.
6. Unknown production routes return HTTP 404 with the designed recovery page. CSP and response headers remain active.
7. `v0.1.3` release metadata, Homebrew, Scoop, and winget are pinned to the actual published asset hashes. `SHA256SUMS` uses the exact GitHub-published names for the period-normalized DEB and EXE.
8. All recurring and compact controls are at least 44 CSS pixels high. The site includes four captioned screenshots of the real desktop flow.
9. The Open Graph image is 1200×630 and the Apple touch icon is 180×180. Critical CSS is linked in HTML before scripts, eliminating the initial layout shift.

## Verification evidence

Clean/local gates:

```sh
npm ci                                      # 65 packages; 0 vulnerabilities
npm test                                    # 15 Vitest + 6 Rust tests passed
npm run lint                                # TypeScript + rustfmt + strict Clippy passed
npm run test:e2e                            # 18 desktop/mobile tests passed
npm run build                               # dist/app and dist/site produced
npm audit --audit-level=high                # 0 vulnerabilities
CI=false npm run tauri build -- --bundles deb,appimage
```

The native build produced valid `0.1.3` amd64 DEB and AppImage bundles. The final AppImage downloaded from GitHub matched SHA-256 `d03d92b1bbfee1719dbacbc290f4115221488ab6365d4a89a9fc320f5f0ecfe9`. Every filename in the published `SHA256SUMS` resolves to a real release asset.

Browser, accessibility, and policy:

- `PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e`: 18/18 passed at desktop and 390×844, including keyboard dialog containment, axe serious/critical checks, 44px targets, checkout gating, same-origin demo privacy, and release fallback.
- `/opt/fleet/lib/verify-url.sh`: title, `lang`, one `h1`, `main`, alt text, button labels, and console checks passed with zero errors. Evidence: `.factory/repair-live/`.
- Static Web Apps emulator and production both returned 200 for `/`, `/demo/`, `/privacy/`, and `/terms/`; `/definitely-not-a-route-repair` returned the designed page with HTTP 404.
- CSP, HSTS, `nosniff`, Referrer Policy, frame denial, Permissions Policy, and immutable hashed-asset caching were present live.
- All 31 deployed files checked byte-for-byte against `dist/site`; zero mismatches.
- Live Lighthouse mobile: Performance 98, Accessibility 100, Best Practices 100, SEO 100; LCP 2.1 s, CLS 0.005, TBT 100 ms. Desktop: 100/100/100/100; LCP 0.3 s, CLS 0. Evidence: `.factory/lighthouse-mobile.json` and `.factory/lighthouse-local.json`.
- Final native demo evidence: `.factory/repair-native-v013-demo.png`. Reset, exit, and restart evidence is in `.factory/repair-native-*.png`.

## Run and verify

```sh
npm ci
npm run check
npm run test:e2e
npm run build
CI=false npm run tauri build -- --bundles deb,appimage
```

The static deployment root is `dist/site`. The demo URL is <https://hotkey-runbook.sociobot.in/demo/>. Demo behavior and storage namespaces are documented in `.factory/demo.md`; claim commands are authoritative in `.factory/claims.json`.

## Known gaps and operator actions

- Release packages are intentionally unsigned. The current workflow expects no signing secrets. Future signed releases require wiring owner-provided `APPLE_CERTIFICATE` and `WINDOWS_CERT_PFX` credentials, with their certificate passwords and Apple notarization credentials.
- Keep `VITE_CHECKOUT_ENABLED` unset until the registered checkout is confirmed available. Existing-license verification and recovery are already enabled; do not change billing to deploy this repair.
- Native processes do not yet expose cancellation or a configurable timeout. This was a previously disclosed low-severity enhancement, not a release blocker; exact review, consent, redaction, rollback notes, and error recovery remain in place.
