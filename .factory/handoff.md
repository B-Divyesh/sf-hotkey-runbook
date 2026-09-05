# Handoff — repair 12

## Status

The $29 checkout blocker recorded in verification 11 is resolved. The scoped
live checkout now returns a `303` to `checkout.dodopayments.com`; the Test
checkout returns a `303` to `test.checkout.dodopayments.com`. A fresh browser
loaded the live hosted offer and found **Hotkey Runbook License** at **$29**.

The released implementation is `v0.1.15`, commit
`3b59853dfa78a195143f236e5bc0f4ad86dc36f8`. It permits the documented Test
billing API in both the static-site and native Tauri CSP, while retaining the
live API. The paid offer remains a $29 one-time license; free local runbooks,
safety behaviour, export, accessibility, and data control remain free.

## What changed

1. Added `https://pilot-api.sociobot.in` to the static and native
   `connect-src` policies, plus the static checkout form policy. This lets a
   staging/Test build validate a returned Test license rather than having its
   own CSP block the request.
2. Strengthened the $29 purchase claim: its hosted-checkout fixture now
   returns a token to the product, which must be stored, verified, removed
   from the address bar, and visibly activate the license.
3. Added an outcome test that serves each deployed CSP policy to a browser and
   requires a Test license verification request to succeed. It does not merely
   inspect a policy string.
4. Released v0.1.15 for macOS arm64/x86_64, Windows x86_64, and Linux x86_64.
   `public/latest.json`, Homebrew, Scoop, and winget now use the published
   v0.1.15 checksums.
5. Added the required catalog description and copied it to
   `/work/.evidence/catalog-description.txt`. Billing-offer evidence is at
   `/work/.evidence/billing-offer.json`.

## Billing verification

- Live and Test invalid tokens return HTTP 200 with `valid: false` and
  `reason: "invalid"`.
- The Test hosted checkout was completed with the documented Test-card flow.
  It returned to the product, stored the token, and the Test verifier returned
  `valid: true`, `reason: "ok"`.
- No live customer payment was attempted. The live public checkout and exact
  $29 offer are reachable; the Test environment proves the issued-license
  return and validation path end to end.

## Verification

From a clean `npm ci` after the documented Tauri system prerequisites:

```sh
npm test
npm run lint
npm run build
npm run test:e2e
npm audit --audit-level=high
```

All passed. Results: 25/25 Vitest, 12/12 Rust, strict TypeScript, rustfmt,
Clippy with `-D warnings`, 32/32 Playwright checks, and no audit findings.
All 18 exact commands declared in `.factory/claims.json` were also run
individually. Browser checks include Playwright Axe scans with no serious or
critical violations.

`/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173
.factory/verification-12-local` passed with a title, `lang=en`, one `<h1>`,
`<main>`, no missing alt text or unlabelled buttons, and no console errors.
The static landing output is 3.60 KB JavaScript (1.69 KB gzip) and 13.77 KB
CSS (3.73 KB gzip).

Fresh live desktop and 390×844 phone sessions identified the job, audience,
and **Try it with sample data** action before scrolling. The sample completed,
kept its persistent demo label, and reset without reading or writing real
browser data.

The released Linux AppImage checksum matches the v0.1.15 manifest. In a fresh
consumer data directory its extracted `AppRun --build-identity` returned
version 0.1.15 and implementation commit `3b59853dfa78a195143f236e5bc0f4ad86dc36f8`.
It then remained running under Xvfb until the test timeout, with a new local
profile. Container-only graphics/session-bus warnings did not terminate it.

## Run and verify

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm run tauri dev
```

Use `/demo/` for the isolated browser sample. The installed app starts with
**Load sample project**. See `.factory/demo.md` for storage namespaces and
reset behaviour.

## Known gaps and operator action

1. The managed product edge was still serving v0.1.14 at the final cold HTTPS
   check, including its pre-v0.1.15 CSP, even though the product's Static site
   GitHub workflow passed for the pushed source. Per the product runbook, this
   worker did not touch deployment infrastructure. Promote the successful
   static artifact to `https://hotkey-runbook.sociobot.in`, then recheck that
   the footer says `Build 0.1.15` and the CSP lists `pilot-api.sociobot.in`.
   The checkout blocker itself is already resolved on the currently live
   v0.1.14 site by the completed billing registration.
2. macOS and Windows packages remain unsigned previews. Owner signing and
   notarization credentials are needed only if signed distribution is required.
