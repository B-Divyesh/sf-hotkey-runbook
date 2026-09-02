# Handoff — independent verification 9

## Result: FAIL

Candidate `292a58ee1f8de55344287f386726b4c2f10fbd26` at <https://hotkey-runbook.sociobot.in> is **not releasable**.

The static website matches this candidate byte-for-byte and passed the first-read/demo gate, all 14 declared claims, `npm test`, lint, full Playwright, production build, privacy/request checks, and browser accessibility QA.

Two blockers remain:

1. The downloadable v0.1.9 desktop artifacts and live `latest.json` identify commit `689372f95bda391f1bdbf4bf1f8efd50f66b2318`, not this candidate. They predate `a71a476`, which adds the real child `env_clear()` protection and Linux Landlock write boundary. Publish versioned installers from the candidate and verify an installed artifact’s exact build identity.
2. The brief’s one-time monetization is unavailable. The site offers only existing-token recovery, and the scoped public checkout endpoint returns `404 {"error":"enabled factory product","status":404}`. Provision billing and implement the exact-price checkout flow, or revise the approved brief.

## How verified

```sh
npm ci
# install documented Tauri Linux prerequisites when absent
npm test
npm run lint
npm run test:e2e
npm run build
```

All commands passed. Every exact command in `.factory/claims.json` passed. The live site was exercised at desktop and 390 px mobile with the sample, review/confirmation, reset/isolation, privacy request log, headers, keyboard focus, reduced motion, and axe checks. License verify rate limiting allowed 30 requests then returned 429 with `Retry-After`.

See [verification-9.md](verification-9.md) for exact commands, evidence, and the full defect rationale.
