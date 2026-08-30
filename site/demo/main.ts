const dialog = document.querySelector<HTMLDivElement>("#demo-dialog")!;
const result = document.querySelector<HTMLElement>("#demo-result")!;
const form = document.querySelector<HTMLFormElement>("#sample-form")!;
const key = "demo:hotkey-runbook:history";
let dialogOpener: HTMLElement | null = null;

function esc(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!); }

function clear(): void { sessionStorage.removeItem(key); result.innerHTML = ""; }

function closeDialog(): void {
  dialog.innerHTML = "";
  document.body.classList.remove("dialog-open");
  dialogOpener?.focus();
  dialogOpener = null;
}

function trapDialog(panel: HTMLElement): void {
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]')];
    if (!items.length) return;
    const first = items[0];
    const last = items.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

document.querySelector("#reset-demo")?.addEventListener("click", clear);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  dialogOpener = document.activeElement as HTMLElement;
  const values = new FormData(form);
  const environment = String(values.get("environment"));
  dialog.innerHTML = `<div class="scrim"><section class="dialog review" role="dialog" aria-modal="true" aria-labelledby="demo-review-title"><button class="dialog-close" data-close aria-label="Close">×</button><p class="eyebrow">Sample review · low risk</p><h2 id="demo-review-title">Review “Inspect sample deployment”</h2><p>These exact sample values would run locally in the desktop app.</p><ol class="command-list"><li><span>printf</span> <code>"Checking %s deployment\\n"</code> <code>${esc(environment)}</code><small>environment: <code>HOTKEY_SAMPLE_TOKEN=[SECRET]</code></small><small>working folder: app data/demo-sample-project</small></li></ol><aside class="rollback"><span aria-hidden="true">↶</span><div><strong>Rollback note</strong><p>This sample only prints a status line. No rollback is needed.</p></div></aside><label class="field"><span class="field-label">Type the runbook name to confirm</span><input id="demo-confirm" autocomplete="off"><small>Enter Inspect sample deployment exactly.</small></label><div class="dialog-actions"><button class="button ghost" data-close>Go back</button><button class="button danger" id="demo-run" disabled>Run sample check</button></div></section></div>`;
  document.body.classList.add("dialog-open");
  dialog.querySelectorAll("[data-close]").forEach((node) => node.addEventListener("click", closeDialog));
  dialog.querySelector(".scrim")?.addEventListener("click", (closeEvent) => {
    if (closeEvent.target === closeEvent.currentTarget) closeDialog();
  });
  const confirm = dialog.querySelector<HTMLInputElement>("#demo-confirm")!;
  const run = dialog.querySelector<HTMLButtonElement>("#demo-run")!;
  confirm.addEventListener("input", () => { run.disabled = confirm.value !== "Inspect sample deployment"; });
  confirm.focus();
  trapDialog(dialog.querySelector<HTMLElement>(".dialog")!);
  run.addEventListener("click", () => {
    sessionStorage.setItem(key, JSON.stringify({ environment, status: "completed" }));
    closeDialog();
    result.innerHTML = `<section class="demo-result"><p class="status-stamp">✓ Completed sample check</p><h3>Inspect sample deployment</h3><pre aria-label="Redacted sample output">$ printf "Checking %s deployment\\n" ${esc(environment)}\nChecking ${esc(environment)} deployment\nHOTKEY_SAMPLE_TOKEN=[REDACTED]</pre><p>The sample result is isolated in this browser tab. <button class="text-button" id="reset-result">Reset demo</button></p></section>`;
    document.querySelector("#reset-result")?.addEventListener("click", clear);
  });
});
