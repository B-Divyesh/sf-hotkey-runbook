# Independent verification handoff — FAIL

## Decision

**FAIL — do not promote candidate `a0d9dd4f92354ad93de922f72b535c65efc6e649`.**

Verified on 2026-08-30 against <https://hotkey-runbook.sociobot.in>. The deployed site matches the candidate build byte-for-byte. No product code was modified during verification. Full evidence and defect details are in `.factory/verification-2.md`.

## Release blockers

1. The advertised purchase URL returns HTTP 404 instead of checkout.
2. The native **Load sample project** flow never shows its required persistent demo banner, **Reset demo**, or **Start for real** controls.
3. `.factory/claims.json` lists only three browser-demo claims while the landing page and README make many additional safety, privacy, limits, execution, and installer claims without required tagged tests.

The browser demo also has a high-severity review-dialog defect: its app dialog classes are absent from the site CSS, so it appears as an unstyled section below the runbook; focus escapes and Escape does not close it.

## What passed

- Cold first read and one-click browser demo at desktop and 390 px mobile.
- All three exact `.factory/claims.json` commands after clean `npm ci`.
- `npm test`: 5 Vitest and 5 Rust tests.
- `npm run test:e2e`: 12 Playwright tests.
- `npm run check`, `npm run build`, and `npm audit --audit-level=high`.
- Optimized Tauri binary, `.deb`, and `.AppImage` builds after installing documented Linux build prerequisites and the host `file` utility.
- Native sample validation, exact argv/environment review, secret masking, explicit consent, local execution, isolated history, error recovery, and restart persistence.
- Live Axe serious/critical: zero; no page/console errors; privacy request log as documented.
- Fresh mobile Lighthouse: 100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO; LCP 1.3 s, CLS 0.005, TBT 0 ms.
- CSP/security headers and immutable caching for hashed assets.
- v0.1.1 Linux AppImage checksum and the public one-line installer.
- Billing verification rate limit: requests 1–30 returned normal invalid responses; request 31 returned 429 with `Retry-After: 2`.

## Other failed checks

- `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`.
- `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings` (`unnecessary_map_or`, `unnecessary_sort_by`).
- Unknown live routes return 200/home instead of the designed 404.
- Live `/latest.json`, Homebrew, Scoop, and winget still identify v0.1.0.
- Two `SHA256SUMS` filenames differ from GitHub's period-normalized asset names.
- Several repeated links are 38–42 px high rather than 44 px.
- Required 3–5 frame captioned desktop walkthrough is absent.

## Reproduce

```sh
npm ci
npm run test:e2e -- --grep @claim:demo-isolated
npm run test:e2e -- --grep @claim:exact-environment-review
npm run test:e2e -- --grep @claim:demo-privacy
npm test
npm run test:e2e
npm run check
npm run build
npm audit --audit-level=high
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
CI=false npm run tauri -- build --bundles deb,appimage
```

Linux native builds require the packages listed in README plus `file` for AppImage packaging.

## Evidence

- `.factory/verification-2.md`
- `.factory/qa-first-read-desktop.png`
- `.factory/qa-live-mobile-first-screen.png`
- `.factory/qa-live-demo.png`
- `.factory/qa-live-modal-keyboard.json`
- `.factory/qa-live-modal-focus-leak.png`
- `.factory/qa-live-modal-mobile.png`
- `.factory/qa-native-initial.png`
- `.factory/qa-native-sample-loaded.png`
- `.factory/qa-native-sample-result.png`
- `.factory/qa-native-required-error.png`
- `.factory/qa-native-restart.png`
- `.factory/qa-lighthouse-live.json`

The v0.1.1 tag points to `2dfbc1256195153df173dd8f80e85fd493bc6729`; its product sources match this candidate, whose only later change was the previous handoff document. Desktop packages remain unsigned previews and still require the owner signing secrets previously documented by the builder.
