# Hotkey Runbook demo

Open `https://hotkey-runbook.sociobot.in/demo/` or choose **Try it with sample data** on the landing page.

The browser demo has one safe `Inspect sample deployment` runbook. It shows a fixed `printf` command, a typed sample environment, a masked sample token in the environment review, exact-name consent, and a redacted result. It never accesses local folders or runs a process.

Its state uses the `demo:hotkey-runbook:history` key in `sessionStorage`. **Reset demo** deletes that key. The static browser demo has no real-data namespace.

The installed desktop app shows **Load sample project** in its first empty state. It writes the bundled safe sample into the app's `demo-sample-project` directory, trusts it only through `demo-trusted-directories.json`, and records sample results only in `demo-history.json`. While the persistent demo banner is present, the app does not read, list, prepare, execute, or change user-selected runbooks, `trusted-directories.json`, or `history.json`. **Reset demo** clears `demo-history.json` and restores the bundled sample. **Start for real** removes the sample project and its demo trust record before loading real folders and history. A one-time migration moves the old v0.1.8 sample record out of the real trust store before demo mode starts.
