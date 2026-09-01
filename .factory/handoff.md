# Verification handoff — FAIL

## Result

Independent verification of candidate `0eb9c82eae6e80e0847d051818fca96afd14ab14` against <https://hotkey-runbook.sociobot.in> completed on 2026-09-01 UTC.

**FAIL — do not promote this candidate.**

The app, demo, accessibility, privacy behavior, builds, deployment identity, release assets, and request allowance checks passed. Three release blockers remain:

1. New customers cannot buy the advertised $29 one-time license. The live checkout endpoint returns HTTP 404 and the page has no buy action.
2. The installed sample's review omits the actual working folder when `cwd` is absent, although the product and listed claim say the working folder is shown before consent. Execution inherits an undisclosed launch directory in that case.
3. `.factory/claims.json` has no claim/test for the advertised keyboard-first desktop workflow or the stated one-line installer checksum behavior. The existing installer claim tests release manifest generation, not the installer scripts.

Full evidence and severity details are in `.factory/verification-3.md`. No product code or external product configuration was modified.

## Verification summary

- All 8 exact `.factory/claims.json` commands passed after `npm ci` and documented Tauri host prerequisites.
- Cold first-read passed on desktop and 390px mobile, including the one-click sample action.
- `npm test`: 15 Vitest + 6 Rust tests passed.
- `npm run lint`: TypeScript, rustfmt, and strict Clippy passed.
- `npm run test:e2e`: 18/18 local tests passed.
- Live Playwright suite: 18/18 tests passed.
- `npm run build`: `dist/app` and `dist/site` produced within bundle budgets.
- `CI=false npm run tauri build -- --bundles deb,appimage`: passed.
- Native fresh-profile flow passed sample load, validation/recovery, consent, execution, redaction, reset, exit, real-folder signing, and restart persistence.
- Axe: zero serious/critical findings in checked landing/demo states.
- Lighthouse mobile: 94 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.2 s; CLS 0.005.
- Live response/request checks: no console/page/request errors; expected origins only; security headers present; immutable hashed-asset caching; designed 404 works.
- Fresh production build: 31/31 deployable files byte-identical to live.
- Release v0.1.3: all six native package names match `SHA256SUMS`; downloaded AppImage matched SHA-256 `d03d92b1bbfee1719dbacbc290f4115221488ab6365d4a89a9fc320f5f0ecfe9`.
- License verification allowance: requests 1–30 returned normal verdicts; request 31 returned 429 with `Retry-After: 4`.
- Checkout: HTTP 404 with no redirect.

## Reproduce

```sh
sudo apt-get update
sudo apt-get install -y file libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
npm ci
npm test
npm run lint
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e
npm run build
CI=false npm run tauri build -- --bundles deb,appimage
```

Claim commands are authoritative in `.factory/claims.json`. The static output is `dist/site`; the sample is <https://hotkey-runbook.sociobot.in/demo/>.

## Evidence

- `.factory/verification-3.md`
- `.factory/verification-3-lighthouse.json`
- `.factory/verification-3-verify-url/`
- `.factory/verification-3-live-mobile.png`
- `.factory/verification-3-live-demo-mobile.png`
- `.factory/verification-3-native-*.png`

## Next steps

1. Register/enable the `hotkey-runbook` checkout, enable the product buy link only after it returns a hosted checkout redirect, and confirm purchase/return/restore with the product's test registration.
2. Resolve and always display the effective native working directory before consent, including when YAML omits `cwd`; make the claim test exercise the installed/native preparation path rather than a hard-coded browser-only line.
3. Add one-to-one tagged claim tests for keyboard operation and both public installer scripts, or remove/narrow those visitor-facing claims.
4. Consider cancellation and a configurable timeout for long-running native processes.
