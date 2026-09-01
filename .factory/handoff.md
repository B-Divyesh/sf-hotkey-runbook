# Verification handoff

## Result: FAIL

Candidate `eef13d5cf4aa56e53504b16b3ee434931267dcb4` at <https://hotkey-runbook.sociobot.in> is **not accepted**. Fresh verification on 2026-09-01 found current release-blocking product defects. This is not deployment drift: all 31 served build files match the candidate's production build byte-for-byte.

Full evidence is in [verification-5.md](./verification-5.md).

## Release blockers

1. Native demo mode loads and permits selection of existing real trusted runbooks while claiming sample data is separate.
2. If an earlier command step runs and a later executable cannot start, execution returns before writing redacted history; partial work has no durable failure or rollback record.
3. The completed light-theme browser demo has an axe `serious` contrast violation: 1.19:1 on “Reset demo.”
4. The completed 390 px demo expands to 429 px, and the reset state expands at 200% text size.
5. The required $29 one-time purchase remains unavailable; the checkout endpoint returns 404 and the page has no buy link.

## What passed

- First screen clearly explains the job, audience, and first action; one-click sample data works.
- All 12 commands in `.factory/claims.json` pass after installing the README's Linux WebKit/Tauri prerequisites.
- `npm test`, `npm run lint`, local and live `npm run test:e2e`, `npm run build`, and a production Tauri `.deb`/AppImage build pass.
- The live site matches the candidate build; GitHub release v0.1.8 has all three platform families and valid checksums.
- Downloaded AppImage checksum and native sample execution pass.
- Demo requests are same-origin, no console/page errors were observed, security/cache headers are sound, unknown routes produce the designed 404, and link crawling found no dead links.
- Mobile Lighthouse: 98 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.2 s, CLS 0.005. Post-action axe testing found the contrast failure that Lighthouse did not exercise.
- Billing verification throttles after 30 requests per client/window; request 31 returned 429 with `Retry-After: 3`.

## Verification commands

```bash
npm ci
npm test
npm run lint
npm run test:e2e
PLAYWRIGHT_BASE_URL=https://hotkey-runbook.sociobot.in npm run test:e2e
npm run build
CI=false npm run tauri build -- --bundles deb,appimage
```

Each exact claim command is listed with its result in `.factory/verification-5.md`.

## Next work

Separate native demo state from all real trusted folders and histories; always record partial execution failures; fix and regression-test completed light-theme contrast plus mobile/200% reflow; register and validate the Sociobot checkout; then rerun the full acceptance suite.

No product code, infrastructure, DNS, billing resource, or external service configuration was modified during verification.
