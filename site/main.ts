import { consumeLicenseFromUrl, saveAndVerifyLicense, verifyLicense } from "../src/license";

const REPO = "B-Divyesh/sf-hotkey-runbook";
const RELEASE_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASE_PAGE = `https://github.com/${REPO}/releases/latest`;
const CHECKOUT_URL = "https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout";
const checkoutEnabled = import.meta.env.VITE_CHECKOUT_ENABLED === "true";
interface GithubAsset { name: string; browser_download_url: string }
interface GithubRelease { tag_name: string; assets: GithubAsset[] }

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
  const cached = localStorage.getItem("hkr:release:latest");
  try {
    let release: GithubRelease;
    if (cached) {
      const stored = JSON.parse(cached) as { expires: number; value: GithubRelease };
      release = stored.expires > Date.now() ? stored.value : await fetchRelease();
    } else release = await fetchRelease();
    const assets = Object.fromEntries(release.assets.map((asset) => [asset.name, asset]));
    const assetFor = (key: string) => Object.values(assets).find((asset) => asset.name.includes(`_${key}.`));
    document.querySelectorAll<HTMLAnchorElement>("[data-platform]").forEach((link) => { const asset = assetFor(link.dataset.platform!); if (asset) { link.href = asset.browser_download_url; link.setAttribute("download", asset.name); } });
    const asset = assetFor(detected);
    if (asset) { primary.href = asset.browser_download_url; primary.innerHTML = `Download for ${label(detected)} <span aria-hidden="true">↓</span>`; primary.setAttribute("download", asset.name); }
    status.textContent = `${release.tag_name} · ${asset ? asset.name : "Choose a platform below"} · SHA-256 published`;
  } catch {
    primary.textContent = `See downloads for ${label(detected)}`;
    primary.href = RELEASE_PAGE;
    status.textContent = navigator.onLine ? "The release manifest could not be read. Open GitHub Releases for current builds." : "You appear offline. Downloads will resume when you reconnect.";
  }
}

async function fetchRelease(): Promise<GithubRelease> {
  const response = await fetch(RELEASE_API, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error("release metadata unavailable");
  const release = await response.json() as GithubRelease;
  localStorage.setItem("hkr:release:latest", JSON.stringify({ expires: Date.now() + 60 * 60 * 1000, value: release }));
  return release;
}

const restore = document.querySelector<HTMLButtonElement>("#restore-license");
const form = document.querySelector<HTMLFormElement>("#license-form");
const checkoutState = document.querySelector<HTMLElement>("#checkout-state");
if (checkoutState) {
  checkoutState.innerHTML = checkoutEnabled
    ? `<a class="button primary" href="${CHECKOUT_URL}">Buy the field license</a>`
    : `<p class="checkout-unavailable"><strong>New purchases are temporarily unavailable.</strong><br>Already have a license? Restore it below.</p>`;
}
if (restore && form) {
  restore.addEventListener("click", () => { form.hidden = false; restore.hidden = true; document.querySelector<HTMLInputElement>("#license-token")!.focus(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const message = document.querySelector<HTMLElement>("#license-message")!; message.textContent = "Checking…";
    const result = await saveAndVerifyLicense(document.querySelector<HTMLInputElement>("#license-token")!.value);
    message.textContent = result.unlocked ? "License verified. Open the app and paste the same token in Settings." : result.reason === "offline" ? "Could not reach the license service. Try again when online." : "That license is not active for Hotkey Runbook.";
  });
  consumeLicenseFromUrl();
  verifyLicense().then((result) => { if (result.unlocked) { restore.textContent = "License active on this browser"; restore.disabled = true; } });
}
if (document.querySelector("#primary-download")) downloads();
