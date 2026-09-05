# Verification 12 — checkout repair

## Candidate and scope

- Product implementation: `v0.1.15`,
  `3b59853dfa78a195143f236e5bc0f4ad86dc36f8`.
- Follow-up browser-CSP regression: `273e06f5d3200730833424e453ec9ce0b868b590`.
- Paid offer: Hotkey Runbook License, USD 29, one-time purchase.
- Free functions remain available without an account.

## Verification 11 disposition

| Finding | Current disposition | Evidence |
| --- | --- | --- |
| $29 checkout returned 404 | Fixed by the registered scoped offer | Live: 303 to Dodo, then hosted checkout renders the named USD 29 offer. Test: 303 to Test Dodo. |
| Returned license was only fixture-tested | Verified in Test as a payment outcome | Test checkout returned to the product, stored its returned token, and the Test verifier answered `valid: true`, `reason: "ok"`. |
| Test billing origin could be blocked by CSP | Fixed in v0.1.15 | Browser test applies each deployed CSP and requires a Test validation fetch to finish successfully. |

Invalid-token recovery is also normal: both live and Test validators returned
HTTP 200 with `valid: false`, `reason: "invalid"`.

## Product checks

- `npm ci`: completed with 65 packages and no audit findings.
- `npm test`: 25 Vitest and 12 Rust tests passed after a clean native build.
- `npm run lint`: TypeScript, rustfmt, and strict Clippy passed.
- `npm run build`: produced `dist/app` and `dist/site`.
- `npm run test:e2e`: 32 passed. This includes desktop and 390×844 mobile,
  keyboard and modal focus, 200% text, privacy requests, the checkout return,
  CSP outcome coverage, and Playwright Axe checks.
- Every one of the 18 commands in `.factory/claims.json` passed individually.
- `npm audit --audit-level=high`: 0 vulnerabilities.

Local HTTP verification is in `.factory/verification-12-local/`. It found a
title, `lang=en`, exactly one h1, a main landmark, no missing image alt text,
no unlabelled buttons, and no console errors.

## Consumer artifact

The public v0.1.15 AppImage SHA-256 matches the release manifest. Its
extracted `AppRun --build-identity` reported the v0.1.15 implementation commit.
It launched in an isolated `XDG_DATA_HOME` profile under Xvfb. No live payment
or customer information was created for this verification.

## Live runtime observation

Fresh desktop and phone browser contexts saw the job headline, audience, and
sample action before scrolling. The sample completed, retained its demo label,
and reset without touching real browser storage. The live hosted checkout
rendered the named $29 offer.

At the time of the final cold HTTPS request, the managed edge still showed
Build 0.1.14 and its older CSP even after the repository Static site workflow
passed. This is a deployment-promotion gap, not a regression in the checkout
path: the current live checkout redirects to Dodo and displays the registered
offer. See the handoff for the narrowly scoped operator follow-up.
