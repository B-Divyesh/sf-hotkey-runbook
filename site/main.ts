import "./style.css";
import { consumeLicenseFromUrl, saveAndVerifyLicense, verifyLicense } from "../src/license";

const REPO = "B-Divyesh/sf-hotkey-runbook";
const MANIFEST = `https://github.com/${REPO}/releases/latest/download/latest.json`;
interface Asset { url: string; sha256: string; file: string }
interface ReleaseManifest { version: string; platforms: Record<string, Asset> }

function platform(): string {
  const source = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
  if (source.includes("win")) return "windows-x86_64";
  if (source.includes("mac")) return source.includes("arm") ? "macos-arm64" : "macos-x86_64";
  return "linux-x86_64";
}
function label(key: string): string {
  if (key === "windows-x86_64") return "Windows";
  if (key.startsWith("macos")) return key.endsWith("arm64") ? "macOS Apple silicon" : "macOS Intel";
  return "Linux";
}
async function downloads(): Promise<void> {
  const primary = document.querySelector<HTMLAnchorElement>("#primary-download")!;
  const status = document.querySelector<HTMLElement>("#download-status")!;
  const detected = platform();
  if (["localhost", "127.0.0.1"].includes(location.hostname)) {
    primary.textContent = `See downloads for ${label(detected)}`;
    status.textContent = "Local preview · release links resolve after publication.";
    return;
  }
  try {
    const response = await fetch(MANIFEST, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("release manifest unavailable");
    const manifest = await response.json() as ReleaseManifest;
    document.querySelectorAll<HTMLAnchorElement>("[data-platform]").forEach((link) => { const asset = manifest.platforms[link.dataset.platform!]; if (asset) { link.href = asset.url; link.setAttribute("download", asset.file); } });
    const asset = manifest.platforms[detected];
    if (asset) { primary.href = asset.url; primary.innerHTML = `Download for ${label(detected)} <span aria-hidden="true">↓</span>`; primary.setAttribute("download", asset.file); }
    status.textContent = `${manifest.version} · ${asset ? asset.file : "Choose a platform below"} · SHA-256 published`;
  } catch {
    primary.textContent = `See downloads for ${label(detected)}`;
    status.textContent = navigator.onLine ? "The release manifest is not published yet. Open GitHub Releases for current builds." : "You appear offline. Downloads will resume when you reconnect.";
  }
}

const restore = document.querySelector<HTMLButtonElement>("#restore-license")!;
const form = document.querySelector<HTMLFormElement>("#license-form")!;
restore.addEventListener("click", () => { form.hidden = false; restore.hidden = true; document.querySelector<HTMLInputElement>("#license-token")!.focus(); });
form.addEventListener("submit", async (event) => {
  event.preventDefault(); const message = document.querySelector<HTMLElement>("#license-message")!; message.textContent = "Checking…";
  const result = await saveAndVerifyLicense(document.querySelector<HTMLInputElement>("#license-token")!.value);
  message.textContent = result.unlocked ? "License verified. Open the app and paste the same token in Settings." : result.reason === "offline" ? "Could not reach the license service. Try again when online." : "That license is not active for Hotkey Runbook.";
});
consumeLicenseFromUrl();
verifyLicense().then((result) => { if (result.unlocked) { restore.textContent = "License active on this browser"; restore.disabled = true; } });
downloads();
