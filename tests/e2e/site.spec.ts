import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing page is keyboard-ready and has no serious accessibility violations", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("latest.json")) errors.push(message.text()); });
  await page.goto("/");
  await expect(page).toHaveTitle(/Hotkey Runbook/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
  expect(errors).toEqual([]);
});

test("legal pages and mobile download path render", async ({ page }) => {
  await page.route("https://api.github.com/repos/B-Divyesh/sf-hotkey-runbook/releases/latest", async (route) => route.fulfill({ json: { tag_name: "v0.1.1", assets: [
    { name: "Hotkey-Runbook_0.1.1_windows-x86_64.msi", browser_download_url: "https://github.com/download/windows" },
    { name: "Hotkey-Runbook_0.1.1_linux-x86_64.AppImage", browser_download_url: "https://github.com/download/linux" },
    { name: "Hotkey-Runbook_0.1.1_macos-arm64.dmg", browser_download_url: "https://github.com/download/macos-arm" },
    { name: "Hotkey-Runbook_0.1.1_macos-x86_64.dmg", browser_download_url: "https://github.com/download/macos-intel" },
  ] } }));
  await page.goto("/privacy/");
  await expect(page.locator("h1")).toHaveText("Privacy");
  await page.goto("/terms/");
  await expect(page.locator("h1")).toHaveText("Terms");
  await page.goto("/");
  await expect(page.locator("#primary-download")).toBeVisible();
  await expect(page.locator("#primary-download")).toHaveAttribute("href", /github\.com\/download\/(windows|linux|macos-arm|macos-intel)/);
  await expect(page.locator("img[alt]").first()).toBeVisible();
});

test("@claim:demo-isolated runs sample data in a separate browser namespace", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.getByText("Demo — sample data, nothing is saved to your real runbooks.")).toBeVisible();
  await page.getByRole("button", { name: "Review exact process" }).click();
  await page.locator("#demo-confirm").fill("Inspect sample deployment");
  await page.getByRole("button", { name: "Run sample check" }).click();
  await expect(page.getByText("Completed sample check")).toBeVisible();
  expect(await page.evaluate(() => ({ demo: sessionStorage.getItem("demo:hotkey-runbook:history"), real: localStorage.getItem("hotkey-runbook:history") }))).toEqual({ demo: expect.any(String), real: null });
  await page.getByRole("button", { name: "Reset demo" }).last().click();
  await expect(page.evaluate(() => sessionStorage.getItem("demo:hotkey-runbook:history"))).resolves.toBeNull();
});

test("@claim:exact-environment-review shows masked environment before the sample can run", async ({ page }) => {
  await page.goto("/demo/");
  await page.getByRole("button", { name: "Review exact process" }).click();
  await expect(page.getByText("printf", { exact: true })).toBeVisible();
  await expect(page.getByText('"Checking %s deployment\\n"', { exact: true })).toBeVisible();
  await expect(page.getByText("HOTKEY_SAMPLE_TOKEN=[SECRET]")).toBeVisible();
  await expect(page.getByText("working folder: app data/demo-sample-project")).toBeVisible();
  await expect(page.getByRole("dialog").getByText("This sample only prints a status line. No rollback is needed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Run sample check" })).toBeDisabled();
  await page.locator("#demo-confirm").fill("Inspect sample deployment");
  await expect(page.getByRole("button", { name: "Run sample check" })).toBeEnabled();
});

test("@claim:demo-privacy keeps the demo request flow same-origin", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo/");
  await page.getByRole("button", { name: "Review exact process" }).click();
  await page.locator("#demo-confirm").fill("Inspect sample deployment");
  await page.getByRole("button", { name: "Run sample check" }).click();
  expect(requests.every((url) => new URL(url).origin === "http://127.0.0.1:5173")).toBe(true);
});

test("sample demo is keyboard-ready and has no serious accessibility violations", async ({ page }) => {
  await page.goto("/demo/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
  await page.getByRole("button", { name: "Review exact process" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".scrim")).toHaveCSS("position", "fixed");
  const dialogBox = await page.getByRole("dialog").boundingBox();
  expect(dialogBox?.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(dialogBox?.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  const dialogAxe = await new AxeBuilder({ page }).include("#demo-dialog").analyze();
  expect(dialogAxe.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Go back" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Review exact process" })).toBeFocused();
  await page.getByRole("button", { name: "Review exact process" }).click();
  await page.locator("#demo-confirm").fill("Inspect sample deployment");
  await page.getByRole("button", { name: "Run sample check" }).press("Enter");
  await expect(page.getByText("Completed sample check")).toBeVisible();
});

test("all repeated navigation targets meet the 44 px minimum", async ({ page }) => {
  await page.goto("/");
  for (const target of await page.locator("a, button, input, select, [tabindex='0']").all()) {
    const box = await target.boundingBox();
    if (box) expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("checkout is gated and existing-license recovery stays available", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("New purchases are temporarily unavailable.")).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Have a license? Restore it" }).click();
  await expect(page.getByLabel("Paste license token")).toBeVisible();
});
