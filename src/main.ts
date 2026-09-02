import "./style.css";
import { open } from "@tauri-apps/plugin-dialog";
import { bridge } from "./bridge";
import { matchesRunbook, validateParameter } from "./validation";
import { clearLicense, saveAndVerifyLicense, verifyLicense, type LicenseState } from "./license";
import type { AppState, BuildIdentity, DirectoryInspection, PreparedRun, RunResult, RunbookSummary } from "./types";
import { demoBannerTemplate } from "./demo-ui";
import { FREE_HISTORY_LIMIT, FREE_RUNBOOK_LIMIT, visibleFreeItems } from "./limits";
import { catalogKeyAction, isConfirmShortcut, isFilterShortcut } from "./keyboard";

const app = document.querySelector<HTMLDivElement>("#app")!;
let state: AppState = { runbooks: [], directories: [], errors: [], demoMode: false };
let selectedId = "";
let query = "";
let historyItems: RunResult[] = [];
let view: "runbooks" | "history" | "settings" = "runbooks";
let inspection: DirectoryInspection | null = null;
let license: LicenseState = { unlocked: false };
let buildIdentity: BuildIdentity = { version: "…", commit: "loading" };
let dialogOpener: HTMLElement | null = null;

const esc = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
const riskLabel = (risk: string) => ({ low: "Low risk", medium: "Review carefully", high: "High risk" }[risk] || risk);

function shell(): void {
  app.innerHTML = `
    <header class="app-header">
      <button class="brand" data-action="home" aria-label="Show runbooks"><span class="brand-mark" aria-hidden="true">⌁</span><span><strong>Hotkey Runbook</strong><small>Local specimen index</small></span></button>
      <div class="header-actions"><span class="local-badge">● Local only</span><button class="icon-button" data-action="theme" aria-label="Toggle color theme">◐</button></div>
    </header>
    <div id="demo-mode-root"></div>
    <main id="main" class="app-shell">
      <nav class="rail" aria-label="Primary">
        <button class="rail-button" data-view="runbooks" aria-current="page"><span aria-hidden="true">⌘</span> Runbooks</button>
        <button class="rail-button" data-view="history"><span aria-hidden="true">↺</span> History</button>
        <button class="rail-button" data-view="settings"><span aria-hidden="true">⚙</span> Settings</button>
      </nav>
      <section id="workspace" class="workspace" aria-live="polite"></section>
    </main>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <div id="dialog-root"></div>`;
  bindShell();
  render();
}

function bindShell(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => button.addEventListener("click", () => {
    view = button.dataset.view as typeof view;
    render();
  }));
  app.querySelector('[data-action="home"]')?.addEventListener("click", () => { view = "runbooks"; render(); });
  app.querySelector('[data-action="theme"]')?.addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next; localStorage.setItem("hkr-theme", next);
  });
}

function render(): void {
  renderDemoBanner();
  app.querySelectorAll("[data-view]").forEach((node) => node.setAttribute("aria-current", String((node as HTMLElement).dataset.view === view ? "page" : "false")));
  if (view === "history") renderHistory();
  else if (view === "settings") renderSettings();
  else renderRunbooks();
}

function renderDemoBanner(): void {
  const root = app.querySelector<HTMLElement>("#demo-mode-root");
  if (!root) return;
  root.innerHTML = demoBannerTemplate(state.demoMode);
  root.querySelector('[data-action="reset-demo"]')?.addEventListener("click", async () => {
    state = await bridge.resetDemoProject();
    historyItems = await bridge.history();
    query = "";
    selectedId = "";
    render();
    toast("Demo reset to its original sample.");
  });
  root.querySelector('[data-action="start-real"]')?.addEventListener("click", async () => {
    state = await bridge.resetSampleProject();
    historyItems = await bridge.history();
    query = "";
    selectedId = "";
    render();
    toast("Sample project removed. Add a folder you reviewed.");
  });
}

function renderRunbooks(): void {
  const workspace = app.querySelector<HTMLElement>("#workspace")!;
  const available = visibleFreeItems(state.runbooks, FREE_RUNBOOK_LIMIT, license.unlocked);
  const filtered = available.filter((runbook) => matchesRunbook(query, runbook));
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0];
  if (selected) selectedId = selected.id;
  workspace.innerHTML = `
    <section class="catalog" aria-labelledby="app-title">
      <div class="catalog-heading"><div><p class="eyebrow">${state.demoMode ? "Bundled sample only" : "Specimen drawer"}</p><h1 id="app-title">Runbooks</h1></div>${state.demoMode ? `<span class="local-badge">Demo only</span>` : `<button class="button small" data-action="add">+ Add folder</button>`}</div>
      <label class="search"><span class="sr-only">Filter runbooks</span><span aria-hidden="true">⌕</span><input id="runbook-search" type="search" value="${esc(query)}" placeholder="Filter by name or tag" autocomplete="off"><kbd>⌘ K</kbd></label>
      ${state.errors.length ? `<div class="notice danger" role="alert"><strong>Some folders need attention</strong>${state.errors.map((error) => `<p>${esc(error)}</p>`).join("")}</div>` : ""}
      ${!license.unlocked && state.runbooks.length > 3 ? `<div class="notice"><strong>${state.runbooks.length - 3} more runbook${state.runbooks.length - 3 === 1 ? " is" : "s are"} collected</strong><p>The free field kit opens the first 3. Restore an existing license in Settings to view the rest.</p></div>` : ""}
      <div class="runbook-list" ${filtered.length ? 'role="listbox" aria-label="Available runbooks"' : ""}>${filtered.length ? filtered.map((item, index) => `
        <button class="runbook-row ${item.id === selected?.id ? "selected" : ""}" role="option" aria-selected="${item.id === selected?.id}" data-id="${esc(item.id)}">
          <span class="specimen-no">${String(index + 1).padStart(2, "0")}</span><span><strong>${esc(item.name)}</strong><small>${esc(item.description)}</small><span class="tags">${item.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</span></span><span class="arrow" aria-hidden="true">→</span>
        </button>`).join("") : emptyRunbooks(query)}
      </div>
      <p class="key-hint"><kbd>↑</kbd><kbd>↓</kbd> choose <kbd>Enter</kbd> open <kbd>⌘ K</kbd> filter</p>
    </section>
    <section class="detail-sheet ${selected ? "" : "empty-detail"}" aria-label="Selected runbook">${selected ? detailTemplate(selected) : `<div class="quiet-sheet"><span class="botanical-mark" aria-hidden="true">⌁</span><p>Select or add a runbook to inspect its steps.</p></div>`}</section>`;
  bindRunbooks(filtered, selected);
}

function emptyRunbooks(filtered: string): string {
  if (filtered) return `<div class="empty"><span aria-hidden="true">⌕</span><h2>No matching specimens</h2><p>Try a name, tag, or clear the filter.</p><button class="text-button" data-action="clear-search">Clear filter</button></div>`;
  if (state.demoMode) return `<div class="empty"><span class="botanical-mark" aria-hidden="true">⌁</span><h2>The sample needs a reset</h2><p>Reset demo to restore its bundled runbook. Start for real before adding a folder you reviewed.</p></div>`;
  return `<div class="empty"><span class="botanical-mark" aria-hidden="true">⌁</span><h2>Your drawer is empty</h2><p>Add a folder containing reviewed <code>.yaml</code> runbooks. Hotkey Runbook signs its exact contents on this device and asks again after any change.</p><div class="empty-actions"><button class="button primary" data-action="sample">Load sample project</button><button class="button" data-action="add">Add runbook folder</button></div><p class="muted">The sample is separate from your folders and can be reset at any time.</p><a href="https://github.com/B-Divyesh/sf-hotkey-runbook/tree/main/examples" target="_blank" rel="noreferrer">See the YAML format</a></div>`;
}

function detailTemplate(runbook: RunbookSummary): string {
  return `<article>
    <div class="sheet-rule"><span>${esc(runbook.source.split(/[\\/]/).pop())}</span><span>Trusted ●</span></div>
    <p class="eyebrow">Operational specimen</p><h2>${esc(runbook.name)}</h2><p class="lede">${esc(runbook.description)}</p>
    <dl class="facts"><div><dt>Risk</dt><dd>${esc(riskLabel(runbook.risk))}</dd></div><div><dt>Steps</dt><dd>${runbook.stepCount}</dd></div><div><dt>Parameters</dt><dd>${runbook.parameters.length}</dd></div></dl>
    <form id="run-form" novalidate>
      <fieldset><legend>Prepare parameters</legend>${runbook.parameters.length ? runbook.parameters.map(fieldTemplate).join("") : `<p class="muted">No parameters required.</p>`}</fieldset>
      <aside class="rollback"><span aria-hidden="true">↶</span><div><strong>Rollback note</strong><p>${esc(runbook.rollback)}</p></div></aside>
      <button class="button primary full" type="submit">Review exact command <span aria-hidden="true">→</span></button>
      <p class="consent-note">Nothing runs until the exact program and arguments are reviewed and confirmed.</p>
    </form>
  </article>`;
}

function fieldTemplate(parameter: RunbookSummary["parameters"][number]): string {
  const required = parameter.required ? "required aria-required=\"true\"" : "";
  const id = `param-${parameter.name}`;
  const hint = parameter.description ? `<small id="${id}-hint">${esc(parameter.description)}</small>` : "";
  const common = `id="${id}" name="${esc(parameter.name)}" ${required} aria-describedby="${id}-hint ${id}-error"`;
  let input = `<input ${common} type="${parameter.type === "secret" ? "password" : parameter.type === "integer" ? "number" : "text"}" value="${esc(parameter.default ?? "")}" autocomplete="off">`;
  if (parameter.type === "choice") input = `<select ${common}><option value="">Choose…</option>${parameter.choices?.map((choice) => `<option ${choice === parameter.default ? "selected" : ""}>${esc(choice)}</option>`).join("")}</select>`;
  if (parameter.type === "boolean") input = `<select ${common}><option value="false">No</option><option value="true" ${parameter.default === true ? "selected" : ""}>Yes</option></select>`;
  return `<div class="field"><div class="field-label"><label for="${id}">${esc(parameter.label)}${parameter.required ? " <span aria-hidden=\"true\">*</span>" : ""}</label><span>${esc(parameter.type)}</span></div>${input}${hint}<span class="field-error" id="${id}-error" aria-live="polite"></span></div>`;
}

function bindRunbooks(filtered: RunbookSummary[], selected?: RunbookSummary): void {
  const search = app.querySelector<HTMLInputElement>("#runbook-search");
  search?.addEventListener("input", () => { query = search.value; renderRunbooks(); app.querySelector<HTMLInputElement>("#runbook-search")?.focus(); });
  app.querySelectorAll<HTMLButtonElement>('[data-action="add"]').forEach((button) => button.addEventListener("click", addDirectory));
  app.querySelector('[data-action="sample"]')?.addEventListener("click", loadSampleProject);
  app.querySelector('[data-action="clear-search"]')?.addEventListener("click", () => { query = ""; renderRunbooks(); });
  app.querySelectorAll<HTMLButtonElement>(".runbook-row").forEach((button) => button.addEventListener("click", () => { selectedId = button.dataset.id!; renderRunbooks(); }));
  app.querySelector<HTMLFormElement>("#run-form")?.addEventListener("submit", (event) => { event.preventDefault(); if (selected) prepare(selected); });
  search?.addEventListener("keydown", (event) => {
    const action = catalogKeyAction(event.key, filtered.length, Math.max(0, filtered.findIndex((item) => item.id === selectedId)));
    if (!action) return;
    event.preventDefault();
    if (action.type === "focus-parameters") app.querySelector<HTMLInputElement>("#run-form input, #run-form select")?.focus();
    else { selectedId = filtered[action.index].id; renderRunbooks(); app.querySelector<HTMLInputElement>("#runbook-search")?.focus(); }
  });
  app.querySelector<HTMLFormElement>("#run-form")?.addEventListener("keydown", (event) => {
    if (!isConfirmShortcut(event.key, event.metaKey, event.ctrlKey)) return;
    event.preventDefault();
    (event.currentTarget as HTMLFormElement).requestSubmit();
  });
}

async function loadSampleProject(): Promise<void> {
  if (!bridge.available) return toast("Install the desktop app to load its bundled sample project.", true);
  try { state = await bridge.loadSampleProject(); historyItems = await bridge.history(); query = ""; selectedId = ""; render(); toast("Sample project loaded. Nothing was added to your folders."); } catch (error) { toast(String(error), true); }
}

async function addDirectory(): Promise<void> {
  if (state.demoMode) return toast("Start for real before changing your trusted folders.", true);
  if (!bridge.available) return toast("Install the desktop app to read local runbooks.", true);
  const path = await open({ directory: true, multiple: false, title: "Choose a runbook folder" });
  if (!path) return;
  try { inspection = await bridge.inspectDirectory(path); showTrustDialog(); } catch (error) { toast(String(error), true); }
}

function showTrustDialog(): void {
  if (!inspection) return;
  dialogOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const dialog = app.querySelector<HTMLDivElement>("#dialog-root")!;
  dialog.innerHTML = `<div class="scrim"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="trust-title"><button class="dialog-close" data-close aria-label="Close">×</button><p class="eyebrow">Local signature</p><h2 id="trust-title">Trust this exact folder?</h2><p class="path">${esc(inspection.path)}</p><p>Hotkey Runbook found <strong>${inspection.runbooks.length} runbook${inspection.runbooks.length === 1 ? "" : "s"}</strong> in ${inspection.files.length} YAML file${inspection.files.length === 1 ? "" : "s"}. It will sign digest <code>${esc(inspection.digest.slice(0, 16))}…</code> on this device. Any edit invalidates trust.</p>${inspection.warnings.map((warning) => `<div class="notice warning">${esc(warning)}</div>`).join("")}<label class="check"><input id="trust-check" type="checkbox"> I own or reviewed this folder and its commands.</label><div class="dialog-actions"><button class="button ghost" data-close>Cancel</button><button class="button primary" id="trust-button" disabled>Sign and add folder</button></div></section></div>`;
  const first = dialog.querySelector<HTMLElement>("[data-close]")!; first.focus();
  const check = dialog.querySelector<HTMLInputElement>("#trust-check")!; const trust = dialog.querySelector<HTMLButtonElement>("#trust-button")!;
  check.addEventListener("change", () => trust.disabled = !check.checked);
  dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeDialog));
  trust.addEventListener("click", async () => { try { state = await bridge.trustDirectory(inspection!.path, inspection!.digest, true); closeDialog(); render(); toast("Folder signed and added."); } catch (error) { toast(String(error), true); } });
  trapDialog(dialog.querySelector(".dialog")!);
}

function valuesFor(runbook: RunbookSummary): Record<string, unknown> | null {
  const values: Record<string, unknown> = {}; let valid = true;
  for (const parameter of runbook.parameters) {
    const input = app.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${CSS.escape(parameter.name)}"]`)!;
    const error = validateParameter(parameter, input.value); values[parameter.name] = input.value;
    const output = app.querySelector<HTMLElement>(`#param-${CSS.escape(parameter.name)}-error`)!; output.textContent = error || "";
    input.setAttribute("aria-invalid", String(Boolean(error))); if (error && valid) input.focus(); valid = valid && !error;
  }
  return valid ? values : null;
}

async function prepare(runbook: RunbookSummary): Promise<void> {
  const values = valuesFor(runbook); if (!values) return;
  try { showReviewDialog(runbook, values, await bridge.prepareRun(runbook.id, values)); } catch (error) { toast(String(error), true); }
}

function showReviewDialog(runbook: RunbookSummary, values: Record<string, unknown>, plan: PreparedRun): void {
  dialogOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const dialog = app.querySelector<HTMLDivElement>("#dialog-root")!;
  dialog.innerHTML = `<div class="scrim"><section class="dialog review" role="dialog" aria-modal="true" aria-labelledby="review-title"><button class="dialog-close" data-close aria-label="Close">×</button><p class="eyebrow">Final consent · ${esc(riskLabel(plan.risk))}</p><h2 id="review-title">Review “${esc(plan.name)}”</h2><p>These exact processes will run locally. No shell is involved.</p><ol class="command-list">${plan.steps.map((step) => `<li><span>${esc(step.program)}</span> ${step.args.map((arg) => `<code>${esc(arg)}</code>`).join(" ")}<small>environment: ${Object.keys(step.env).length ? Object.entries(step.env).map(([key, value]) => `<code>${esc(key)}=${esc(value)}</code>`).join(" ") : "none"} · inherited launch variables are cleared</small><small>working folder: ${esc(step.cwd)}</small><small>sandbox: ${esc(step.sandbox.description)}</small></li>`).join("")}</ol><aside class="rollback"><span aria-hidden="true">↶</span><div><strong>If you need to roll back</strong><p>${esc(plan.rollback)}</p></div></aside><label class="field"><span class="field-label"><span>Type the runbook name to confirm</span></span><input id="confirm-name" autocomplete="off" spellcheck="false"><small>Enter ${esc(plan.name)} exactly.</small></label><div class="dialog-actions"><button class="button ghost" data-close>Go back</button><button class="button danger" id="execute-button" disabled>Run ${esc(plan.name)}</button></div></section></div>`;
  dialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", closeDialog));
  const input = dialog.querySelector<HTMLInputElement>("#confirm-name")!; const execute = dialog.querySelector<HTMLButtonElement>("#execute-button")!;
  input.addEventListener("input", () => execute.disabled = input.value !== runbook.name); input.focus();
  input.addEventListener("keydown", (event) => {
    if (isConfirmShortcut(event.key, event.metaKey, event.ctrlKey) && !execute.disabled) {
      event.preventDefault();
      execute.click();
    }
  });
  execute.addEventListener("click", async () => { execute.disabled = true; execute.textContent = "Running locally…"; try { const result = await bridge.executeRun(runbook.id, values, input.value); closeDialog(); showResult(result); } catch (error) { execute.disabled = false; execute.textContent = `Run ${runbook.name}`; toast(String(error), true); } });
  trapDialog(dialog.querySelector(".dialog")!);
}

function showResult(result: RunResult): void {
  historyItems.unshift(result); const dialog = app.querySelector<HTMLDivElement>("#dialog-root")!;
  dialog.innerHTML = `<div class="scrim"><section class="dialog result ${result.status}" role="dialog" aria-modal="true" aria-labelledby="result-title"><p class="status-stamp">${result.status === "success" ? "✓ Completed" : "! Failed"}</p><h2 id="result-title">${esc(result.name)}</h2><p>Finished in ${result.durationMs} ms${result.exitCode !== undefined ? ` · exit ${result.exitCode}` : ""}.</p><pre aria-label="Redacted command output">${esc(result.output || "No output.")}</pre><aside class="rollback"><span aria-hidden="true">↶</span><div><strong>Rollback note</strong><p>${esc(result.rollback)}</p></div></aside><div class="dialog-actions"><button class="button primary" data-close>Done</button></div></section></div>`;
  dialog.querySelector("[data-close]")?.addEventListener("click", closeDialog); (dialog.querySelector("[data-close]") as HTMLElement).focus(); trapDialog(dialog.querySelector(".dialog")!);
}

function closeDialog(): void {
  app.querySelector("#dialog-root")!.innerHTML = "";
  const fallback = app.querySelector<HTMLElement>("h1");
  if (fallback) fallback.tabIndex = -1;
  (dialogOpener?.isConnected ? dialogOpener : fallback)?.focus();
  dialogOpener = null;
}
function trapDialog(dialog: HTMLElement): void { dialog.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDialog(); if (event.key !== "Tab") return; const items = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]')]; if (!items.length) return; const first = items[0], last = items.at(-1)!; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }); }

function renderHistory(): void {
  const workspace = app.querySelector<HTMLElement>("#workspace")!;
  const visibleHistory = visibleFreeItems(historyItems, FREE_HISTORY_LIMIT, license.unlocked);
  workspace.innerHTML = `<section class="page"><div class="page-heading"><div><p class="eyebrow">Redacted logbook</p><h1>Execution history</h1></div>${historyItems.length ? `<button class="button ghost" id="clear-history">Clear history</button>` : ""}</div>${!license.unlocked && historyItems.length > 10 ? `<div class="notice"><strong>${historyItems.length - 10} older entries are preserved</strong><p>Activate a field license in Settings to view the full logbook.</p></div>` : ""}${visibleHistory.length ? `<ol class="history-list">${visibleHistory.map((item) => `<li><button data-history-id="${esc(item.id)}"><span class="status-dot ${item.status}" aria-hidden="true"></span><span><strong>${esc(item.name)}</strong><small>${new Date(item.startedAt).toLocaleString()} · ${item.durationMs} ms</small></span><span>${item.status}</span></button></li>`).join("")}</ol>` : `<div class="empty wide"><span aria-hidden="true">↺</span><h2>No runs recorded</h2><p>Completed and failed runs appear here with secrets redacted. History never leaves this device.</p></div>`}</section>`;
  workspace.querySelector("#clear-history")?.addEventListener("click", async () => { if (!confirm("Clear all local execution history? This cannot be undone.")) return; await bridge.clearHistory(); historyItems = []; renderHistory(); });
  workspace.querySelectorAll<HTMLButtonElement>("[data-history-id]").forEach((button) => button.addEventListener("click", () => { const result = historyItems.find((item) => item.id === button.dataset.historyId); if (result) showResult(result); }));
}

function renderSettings(): void {
  const workspace = app.querySelector<HTMLElement>("#workspace")!;
  const folders = state.demoMode
    ? `<section><h2>Sample project</h2><p>This mode reads only the bundled sample and its separate demo history. Use the persistent Start for real control before viewing or changing your trusted folders.</p></section>`
    : `<section><h2>Trusted folders</h2>${state.directories.length ? `<ul class="directory-list">${state.directories.map((directory) => `<li><span><strong>${esc(directory.path)}</strong><small>${directory.valid ? `Signed ${new Date(directory.signedAt).toLocaleDateString()}` : esc(directory.error)}</small></span><button class="button ghost small" data-remove="${esc(directory.path)}">Remove</button></li>`).join("")}</ul>` : `<p class="muted">No folders are trusted on this device.</p>`}<button class="button" data-action="add">Add folder</button></section>`;
  workspace.innerHTML = `<section class="page settings"><p class="eyebrow">Device field notes</p><h1>Settings</h1>${folders}<section><h2>Existing license</h2><p>${license.unlocked ? "License active. Unlimited runbooks and the full 100-entry history are available." : "The free field kit includes up to 3 runbooks and 10 history entries. A valid existing license adds unlimited local runbooks and extended history."}</p>${!license.unlocked ? `<form id="license-form"><label class="field"><span class="field-label"><span>License token</span></span><input id="license-token" type="password" required autocomplete="off"></label><div class="inline-actions"><button class="button primary">Verify license</button></div><p class="muted">New license sales are unavailable until checkout is registered. Restore a license you already have.</p><p id="license-status" aria-live="polite"></p></form>` : `<button class="text-button" id="remove-license">Remove license from this device</button>`}</section><section><h2>Installed build</h2><p class="muted">Version ${esc(buildIdentity.version)} · source ${esc(buildIdentity.commit)}</p><code tabindex="0" aria-label="Installed build identity">hotkey-runbook --build-identity</code></section><section><h2>Privacy and safety</h2><p>No account, telemetry, remote orchestration, or secret vault. Commands run as direct local processes only after review. History is stored in the app data directory.</p></section></section>`;
  workspace.querySelectorAll('[data-action="add"]').forEach((button) => button.addEventListener("click", addDirectory));
  workspace.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach((button) => button.addEventListener("click", async () => { if (!confirm(`Stop trusting ${button.dataset.remove}?`)) return; state = await bridge.removeDirectory(button.dataset.remove!); renderSettings(); }));
  workspace.querySelector<HTMLFormElement>("#license-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const status = workspace.querySelector<HTMLElement>("#license-status")!; status.textContent = "Checking…"; license = await saveAndVerifyLicense((workspace.querySelector<HTMLInputElement>("#license-token")!).value); status.textContent = license.unlocked ? "License active." : license.reason === "offline" ? "Could not reach the license service. Try again when online." : "That license is not active for Hotkey Runbook."; if (license.unlocked) renderSettings(); });
  workspace.querySelector("#remove-license")?.addEventListener("click", () => { clearLicense(); license = { unlocked: false }; renderSettings(); });
}

function toast(message: string, danger = false): void { const node = app.querySelector<HTMLElement>("#toast")!; node.textContent = message.replace(/^Error:\s*/, ""); node.classList.toggle("danger", danger); node.classList.add("visible"); window.setTimeout(() => node.classList.remove("visible"), 5000); }

document.documentElement.dataset.theme = localStorage.getItem("hkr-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.addEventListener("keydown", (event) => { if (isFilterShortcut(event.key, event.metaKey, event.ctrlKey)) { event.preventDefault(); view = "runbooks"; render(); app.querySelector<HTMLInputElement>("#runbook-search")?.focus(); } });

shell();
Promise.all([bridge.getState(), bridge.history(), verifyLicense(), bridge.buildIdentity()]).then(([nextState, nextHistory, nextLicense, nextBuildIdentity]) => { state = nextState; historyItems = nextHistory; license = nextLicense; buildIdentity = nextBuildIdentity; render(); }).catch((error) => toast(String(error), true));
