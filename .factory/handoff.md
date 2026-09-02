# Repair 7 handoff — Hotkey Runbook

## Result

Repaired the release-blocking verification findings from independent report
`bba981076d2ffd8d605680b062f2e73f9c130763` for candidate
`43413fe38082e09e412fbb01c3c7ed22ac9e3338`. The product remains a Tauri 2
desktop app with a static download/demo site.

## What changed

1. **Existing-license recovery now has an outcome-level regression test.**
   The original tagged Playwright command was run first and passed while only
   opening the token field, reproducing the verifier's failure. The repaired
   `@claim:existing-license-recovery` test now submits
   `existing-license-fixture-2026`, intercepts the exact product-scoped
   `/verify?license=…` request with `{valid:true,reason:"ok"}`, asserts the
   success message, `sb_license:hotkey-runbook`, the cached unlocked verdict,
   and the unlocked browser state after reload.
2. **The retained licensed-runbooks promise is registered and tested.**
   `.factory/claims.json` adds `licensed-runbooks`. Its exact tagged Vitest
   regression uses 101 deterministic reviewed runbooks, proves free mode shows
   three, and proves the valid-license path returns every one without a product
   runbook-count cap. This covers the landing, desktop Settings, README, and
   Terms promise of unlimited local runbooks.
3. **Unavailable checkout stays truthful and disabled.**
   The recovery test continues to fixture the unregistered-checkout 404 while
   proving the landing has no price, `/checkout` link, or buy/purchase control.
   No purchase path was added.

## Verification

Ran from a clean `npm ci` on 2026-09-02 UTC after installing the repository
release workflow's documented Linux WebKit/GTK prerequisites:

```sh
npm ci
npm run check
npm run test:e2e
npm audit --audit-level=high
CI=false npm run tauri -- build --bundles deb,appimage
```

- `npm run check`: passed — 20 Vitest tests, 10 Rust tests, TypeScript,
  rustfmt, strict Clippy, and production `dist/app` plus `dist/site` builds.
- `npm run test:e2e`: passed — all 20 Chromium desktop and 390 px mobile
  checks. The recovery claim passes in both browser projects with stored and
  unlocked state assertions.
- All 13 exact commands declared by `.factory/claims.json` passed, including
  the new `@claim:licensed-runbooks` command.
- `npm audit --audit-level=high`: passed — 0 vulnerabilities.
- Local static verification passed with
  `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/` — title, `lang`, one
  h1, main landmark, image alt text, and browser console all clean.
- `npx @axe-core/cli` found 0 violations. It used the pinned Playwright Chrome
  binary with a matching ChromeDriver 145 fixture; Playwright axe checks also
  cover landing, demo, dialog, and completed mobile-demo states.
- Local Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.0 s, LCP 1.7 s, CLS 0.005, total transfer 140 KiB.
- Linux package smoke test passed: `Hotkey Runbook_0.1.9_amd64.deb` has valid
  metadata, the 34,974,543-byte AppImage is a 64-bit ELF AppImage, and the
  extracted `.deb` desktop binary launched under Xvfb with an isolated
  `XDG_DATA_HOME`.

Local site evidence is in `.factory/repair-7-local/`:
`verify.json`, `axe.json`, `lighthouse.json`, and desktop/mobile screenshots.

## Deployment

Deployed the freshly built `dist/site` at 2026-09-02 02:18 UTC to the
product-scoped `sf-hotkey-runbook` Static Web App in resource group
`sociobot`. Azure Static Web Apps confirmed deployment to
`https://proud-dune-0462c4310.7.azurestaticapps.net`; the custom domain
`https://hotkey-runbook.sociobot.in` is live.

- The live `index.html` SHA-256 is
  `1365cf66452ad668ee44b4a0598824aa896762efc52a1258a670e9dc57c241ad`,
  exactly matching the deployed local build.
- The live `verify-url.sh` check passed with no console errors and the
  required title, language, h1, main landmark, and image alt text.
- Live `PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e`
  passed all 20 desktop/mobile tests.
- Live `/`, `/demo/`, `/privacy/`, `/terms/`, `/robots.txt`,
  `/sitemap.xml`, `/latest.json`, and `/404.html` return 200; an unknown
  route returns the designed page with HTTP 404.
- The production response supplies HSTS, the configured restrictive CSP with
  `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `X-Frame-Options: DENY`, and Permissions Policy.

Live evidence is in `.factory/repair-7-live/`, including the captured HTML,
headers, verification report, and desktop/mobile screenshots.

## Known gap / next operator action

New license sales intentionally remain unavailable. This is truthful in the
site and desktop UI, but it remains a researched-brief monetization deviation:
the brief says one-time monetization while no product-scoped Sociobot checkout
is registered. Per this repair work order, no purchase flow was invented. A
factory owner must register and enable the product checkout before a future
release can offer new sales. Existing valid licenses continue to be recoverable.

Published installers are unsigned. macOS users must right-click → Open on the
first launch; Windows may show SmartScreen. Signing requires owner-managed
certificates and was not attempted.
