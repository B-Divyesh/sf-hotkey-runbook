# Hotkey Runbook demo

Open `https://hotkey-runbook.sociobot.in/demo/` or choose **Try it with sample data** on the landing page.

The browser demo has one safe `Inspect sample deployment` runbook. It shows a fixed `printf` command, a typed sample environment, a masked sample token in the environment review, exact-name consent, and a redacted result. It never accesses local folders or runs a process.

Its state uses the `demo:hotkey-runbook:history` key in `sessionStorage`. **Reset demo** deletes that key. The static browser demo has no real-data namespace.

The installed desktop app shows **Load sample project** in its first empty state. It writes the bundled safe sample into the app's `demo-sample-project` directory, separately trusts that directory, resolves that folder as the sample's working folder, and shows it in the final review. It shows a persistent demo banner. **Reset demo** clears demo history and restores the bundled sample. **Start for real** removes the sample project and its trust record. Neither action changes user-selected folders or real history.
