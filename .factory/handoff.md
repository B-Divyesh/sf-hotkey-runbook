# Handoff — independent verification 8

## Result

**FAIL — do not release.**

Tested candidate `1c627893010a4ba0a1d92a10876de3380bef4056` from a clean checkout and live at <https://hotkey-runbook.sociobot.in> on 2026-09-02 UTC. The live static files match the candidate byte for byte.

Full evidence and exact results: [verification-8.md](verification-8.md). Screenshots and machine-readable outputs: [verification-8-evidence](verification-8-evidence/).

## Release blockers

1. The native child process inherits environment variables that are absent from the final consent screen. A fresh optimized-build reproduction passed `HOTKEY_QA8_INHERITED_MARKER=inherited-but-not-reviewed` to `/usr/bin/printenv` even though no environment entry appeared in review. This falsifies the `exact-environment-review` claim and can expose launcher secrets.
2. New one-time license sales are unavailable. The required Sociobot checkout returns 404, and the live site has no price or buy action.
3. The supplied safety contract requires platform sandboxing where available; execution is a direct `Command::output()` with no sandbox implementation.
4. At 390 px and 200% text size, the landing page is 563 px wide and loses content horizontally.

Additional defect: the existing-license form is visibly laid out despite its `hidden` attribute because `.purchase form { display:grid }` overrides it.

## Verification summary

- All 13 exact `.factory/claims.json` commands passed, but native observation disproved `exact-environment-review`, exposing a deficient claim test.
- Cold first-read and one-click sample-data demo gate passed.
- `npm ci`, `npm audit`, `npm run check`, local and live Playwright suites, production web build, Debian packaging, and optimized AppImage build passed.
- 20/20 local and 20/20 live E2E tests passed.
- Native sample load, invalid-input recovery, exact review, consent, redaction, history persistence, reset, and Start for real passed.
- URL verifier passed. axe serious/critical: 0. Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, CLS 0.005.
- Demo traffic was same-origin only. No analytics or external fonts/scripts were observed. Security and caching headers passed.
- Published Linux AppImage downloaded, launched, and matched SHA-256 `94f01f417f25100603ac7d913a5549f80ce1746dd8ffe2a772840fcda831f2e6`.
- License verification allowance observed: 30 successful requests per client/window; subsequent requests returned 429 with `Retry-After`.

## How to rerun

Install the README's Linux prerequisites, then run:

```sh
npm ci
jq -r '.[].test' .factory/claims.json
npm run check
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e
CI=false npm run tauri -- build --bundles appimage
```

Run each claims command printed by `jq` separately and exactly as written.

## Known scope and changes

No product code, deployment, infrastructure, DNS, billing, app settings, or secrets were modified. This verification changes only `.factory` documentation and evidence. Sign-in, PWA service-worker behavior, and product-backend concurrency are not applicable to this account-free local desktop app.

## Required next work

1. Clear inherited child environments and explicitly pass only reviewed environment entries; add an execution-level claim test proving an unrelated parent variable is absent.
2. Register and verify the Sociobot one-time checkout, price, return flow, and new-license unlock.
3. Implement/document supported platform sandbox boundaries or formally revise the researched contract.
4. Fix intrinsic mobile grid sizing at 200% text and add an automated resize/reflow test.
5. Restore real hidden behavior for the license form and assert its initial state.
