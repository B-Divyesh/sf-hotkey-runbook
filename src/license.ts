const PRODUCT = "hotkey-runbook";
const STORAGE_KEY = `sb_license:${PRODUCT}`;
const VERDICT_KEY = `${STORAGE_KEY}:verdict`;
const DAY = 86_400_000;

export interface LicenseState { unlocked: boolean; token?: string; reason?: string; checkedAt?: number; }

export function consumeLicenseFromUrl(): string | null {
  const url = new URL(location.href);
  const token = url.searchParams.get("license");
  if (!token) return localStorage.getItem(STORAGE_KEY);
  const previousToken = localStorage.getItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY, token);
  if (previousToken !== token) localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete("license");
  history.replaceState({}, "", url);
  return token;
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const token = consumeLicenseFromUrl();
  if (!token) return { unlocked: false, reason: "missing" };
  const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) || "null") as LicenseState | null;
  if (!force && cached?.checkedAt && Date.now() - cached.checkedAt < DAY) return cached;
  try {
    const base = import.meta.env.VITE_BILLING_BASE || "https://api.sociobot.in";
    const response = await fetch(`${base}/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error(`License service returned ${response.status}`);
    const result = await response.json() as { valid: boolean; reason: string };
    const state = { unlocked: result.valid, token, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(state));
    return state;
  } catch {
    return cached?.unlocked ? cached : { unlocked: false, token, reason: "offline" };
  }
}

export async function saveAndVerifyLicense(token: string): Promise<LicenseState> {
  localStorage.setItem(STORAGE_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
  return verifyLicense(true);
}

export function clearLicense(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERDICT_KEY);
}
