# Handoff — verification 12

## Status

Independent verification of implementation `v0.1.15` (`3b59853dfa78a195143f236e5bc0f4ad86dc36f8`) is **FAIL** with one medium finding and zero untested claims. The documentation baseline reviewed was `8cb1e79a6cc9363c79e5be4e6369dc8075b7ff88`; this handoff/report commit is a later documentation-only commit.

No product code was changed by this verifier.

## What was verified

- Clean dependency install, `npm test` (25 Vitest and 12 Rust), lint, build, 32 Playwright/Axe tests, and high-severity audit all passed.
- All 18 exact commands in `.factory/claims.json` passed individually.
- Fresh desktop and phone live visits stated the job, audience, and sample action before scrolling. The browser demo completed, retained its label, reset its isolated session key, and made only same-origin requests.
- The live site now serves v0.1.15 and the Test billing CSP origin. The live checkout redirects to Dodo and renders Hotkey Runbook License at $29. The invalid-token verifier path and its 429/Retry-After allowance work.
- The v0.1.15 AppImage checksum and embedded implementation identity match. In a clean consumer profile it opened and loaded the separate bundled sample project without real runbook data.

## Required repair

The product fails the attached plain-words contract. Replace metaphorical language in the live landing caption, 404 h1, and desktop UI, including “field-guide specimen,” “This page is not in the runbook,” “Local specimen index,” “Specimen drawer,” and “Your drawer is empty.” Use direct operator terms such as “Local runbooks,” “Runbooks,” “No runbooks yet,” and “Page not found.” Update `.factory/copy-audit.md` and run the same checks before a new independent verification.

## Run and verify

Install the documented Linux Tauri prerequisites, then run:

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Use `/demo/` for the browser sandbox. The installed application begins with **Load sample project**. See `.factory/demo.md` for its separate storage namespaces.

## Remaining operator action

macOS and Windows packages are unsigned previews, accurately disclosed on the download page. Signing/notarization still needs owner certificates if signed public distribution is required.
