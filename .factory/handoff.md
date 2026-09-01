# Repair handoff — Hotkey Runbook

## Result

Local repair verification passed for the static deployment and Tauri desktop source. This repair preserves the Tauri 2 desktop-app artifact and static landing-site deployment class.

## Fixed release blockers

1. **Native demo isolation:** demo trust now lives in `demo-trusted-directories.json`, separate from `trusted-directories.json`. While demo mode is active, the app loads only its bundled sample runbook and `demo-history.json`; it does not list, prepare, execute, read, or change real runbooks or history. Folder mutations are rejected in demo mode and the UI removes those controls. `Start for real` removes demo state before loading real state. An update migration moves the known v0.1.8 sample record out of the real trust store before demo mode starts.
2. **Partial spawn failures:** a later executable-start failure now returns a failed result, records the already-completed step count and start error, redacts output, retains the rollback note, and writes a durable failed history entry. The original candidate was reproduced in an isolated temporary worktree: its first `/usr/bin/touch` step ran, the missing second executable failed, and `history.json` remained empty.
3. **Completed-demo accessibility and reflow:** the light-theme `Reset demo` control now uses the high-contrast fern text token rather than the pale purchase-link colour. Demo grid items, preformatted results, headings, and the mobile header now shrink/wrap safely. The completed demo has zero serious/critical axe findings at 390 px, and the reset state has no horizontal overflow with 200% text.
4. **Unavailable checkout:** the page and app continue to say exactly that a $29 one-time license exists but new purchases are unavailable, expose no broken checkout link, and retain existing-license recovery. No shared billing service, credentials, or product registration were accessed or invented.

## Regression coverage

- `regression_demo_mode_hides_real_runbooks_and_real_history_until_exit` creates a real trusted runbook and real history, enters demo, proves only the bundled runbook and demo history are available, then verifies real state returns only after exit.
- `regression_partial_spawn_failure_keeps_a_redacted_history_and_rollback_record` runs `/usr/bin/touch` followed by a missing executable and asserts the first step ran, the failed result and rollback persisted, and the configured redaction was applied.
- `completed mobile demo keeps Reset demo legible and reflows at 390px and 200% text` runs the browser sample, applies axe to the completed state, and checks 390 px plus 200% text reflow.

## Verification evidence

Run from a clean `npm ci` install on 2026-09-01 UTC:

```sh
npm ci
npm run check
npm run test:e2e
npm audit --audit-level=high
CI=false npm run tauri -- build --bundles deb,appimage
```

- `npm run check`: passed — 18 Vitest tests, 10 Rust tests, TypeScript, rustfmt, strict Clippy, and both production builds.
- `npm run test:e2e`: passed — 20 Playwright desktop/mobile cases, including keyboard, modal focus, same-origin demo privacy, completed-state axe, 390 px and 200% reflow.
- `npm audit --audit-level=high`: passed — 0 vulnerabilities.
- Tauri package build passed. Produced and inspected `Hotkey Runbook_0.1.8_amd64.deb` (4,787,892 bytes) and `Hotkey Runbook_0.1.8_amd64.AppImage` (79,727,096 bytes); `dpkg-deb --info` and `file` both succeeded.
- Local Lighthouse mobile-default run against rebuilt `/`: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.6 s and CLS 0.005. Full JSON: [repair-5-lighthouse-local.json](./repair-5-lighthouse-local.json).
- The checked-in Playwright axe integration covers title/lang/main/alt/console smoke checks. No `verify-url.sh` exists in this repository.

## Deployment and operator action

The static deployment output is `dist/site`; pushing this commit to `main` is the configured deployment handoff. Verify the live URL after the factory promotion completes.

New purchase activation still needs the factory billing operator to register and enable the `hotkey-runbook` Sociobot product. Until the documented checkout endpoint returns a hosted checkout, the product intentionally shows no buy link. Existing license paste/verification remains available. No backend, billing, DNS, or external service configuration was changed here.
