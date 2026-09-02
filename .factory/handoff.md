# Handoff — repair 11

## Status

The verifier findings for candidate `e126b39644f2aa55cce50a0edc0249f4ee24cab8`
were reproduced from `.factory/verification-10.md`. Version 0.1.14 contains the
product-side repairs and exact regressions. The desktop and static artifacts are
buildable and the final `v0.1.14` tag is intended to identify this handoff
commit exactly.

One external release blocker remains: the scoped Sociobot billing product is
not registered. The public checkout still returns HTTP 404 with
`{"error":"enabled factory product","status":404}`. This worker has no
`fleet/new-paid-product.sh` and no scoped billing-registration credential. It
did not inspect or change a shared service, database, key vault, staging slot,
or another product. See **Needs operator action**.

## Repairs

1. Added the required $29 one-time purchase UI on the landing page and desktop
   Settings. Both use only the documented scoped checkout URL:
   `https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout`.
2. Preserved existing-token recovery and daily verdict caching. A newly
   returned checkout token now clears any verdict for an older token before it
   is verified, and the token is removed from the address bar.
3. Updated Privacy and Terms with the exact price, one-time terms, local token
   storage, merchant-of-record wording, refund/revocation behavior, and the
   existing recovery path. Core safety, accessibility, and data control remain
   free.
4. Added one-to-one claims and regressions for account-free use, no telemetry,
   no cloud sync, the hosted checkout path, and existing-license recovery.
   `.factory/claims.json` now contains 18 unique claims.
5. Removed the unlisted “public GitHub Actions” sentence. Release provenance
   remains enforced by the workflow and installed `--build-identity` check.
6. Bumped every app/package surface and the release workflow default to
   v0.1.14. The release workflow still builds macOS arm64/x86_64, Windows
   x86_64, and Linux x86_64 after the complete test job.
7. Updated `.factory/copy-audit.md`; every landing sentence remains at or below
   22 words and no banned marketing word is present.

## Exact verification evidence

The normal Tauri Linux prerequisites were installed in the disposable worker.
Then these clean gates passed:

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm audit --audit-level=high
```

- `npm ci`: 65 packages installed, 0 vulnerabilities.
- Vitest: 25/25 passed.
- Rust: 12/12 passed after a clean native build.
- Strict TypeScript, rustfmt, and Clippy with `-D warnings`: passed.
- Playwright: 30/30 passed across desktop Chrome and a 390 × 844 mobile
  project. Coverage includes keyboard use, dialog focus, reduced motion, 200%
  text, touch targets, request privacy, returned licenses, and Axe scans.
- All 18 commands in `.factory/claims.json` were also executed individually
  and passed.
- Dependency audit: 0 high-severity findings and 0 total vulnerabilities.
- Production outputs: `dist/app` and `dist/site`.
- Landing bundle: 3.60 KB JavaScript (1.69 KB gzip) and 13.77 KB CSS
  (3.73 KB gzip).

Local browser verification:

```sh
/opt/fleet/lib/verify-url.sh http://127.0.0.1:5173 .factory/repair-11-local
```

It reported title, `lang=en`, one `<h1>`, `<main>`, no missing alt text, no
unlabelled buttons, and zero console errors. Desktop and mobile captures plus
`verify.json` are in `.factory/repair-11-local/`.

Lighthouse mobile evidence is
`.factory/repair-11-lighthouse-local.json`: Performance 98, Accessibility 100,
Best Practices 100, SEO 100, LCP 1.90 s, CLS 0.0047, TBT 0 ms.

The committed source repair packaged locally with:

```sh
CI=false HOTKEY_BUILD_COMMIT=$(git rev-parse HEAD) \
  npm run tauri -- build --bundles appimage,deb
```

Both the release binary and extracted AppImage reported version 0.1.14 and
source `bacdedbfd1d5a3ded06b6ee82c0e421a9f30f5dc`. Local package checksums:

- AppImage: `aa17fc0af0ca8c5bac697ae3fa7e60a8a110102d3edec4655b927cabbe433c1e`
- DEB: `18aaede94fd467866edc95ebaaad1be82abc4c5954f5caabb484b90f5348ecc5`

The release binary was launched under Xvfb with a fresh `XDG_DATA_HOME`.
`.factory/repair-11-native-initial.png` shows the first-run sample action;
`.factory/repair-11-native-sample.png` shows the isolated demo banner, reset
action, start-for-real action, typed parameters, and bundled sample.

## Run and verify

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm run dev
# desktop development
npm run tauri dev
```

The browser sandbox is `/demo/`. The installed app offers **Load sample
project** on first run. Storage separation and reset behavior are documented in
`.factory/demo.md`.

## Needs operator action

1. Register `hotkey-runbook` as the approved $29 one-time product through the
   Sociobot billing registrar, with return URL
   `https://hotkey-runbook.sociobot.in/?license={license}`. Then confirm the
   scoped checkout returns the hosted redirect instead of 404. The product
   code, copy, restore path, terms, privacy disclosure, and regression fixture
   are ready for that registration.
2. Add owner signing credentials for macOS notarization and Windows
   Authenticode when signed packages are required. Until then, the landing page
   accurately labels packages as unsigned previews.
