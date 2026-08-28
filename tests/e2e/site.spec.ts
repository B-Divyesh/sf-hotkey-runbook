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
  await page.goto("/privacy/");
  await expect(page.locator("h1")).toHaveText("Privacy");
  await page.goto("/terms/");
  await expect(page.locator("h1")).toHaveText("Terms");
  await page.goto("/");
  await expect(page.locator("#primary-download")).toBeVisible();
  await expect(page.locator("#primary-download")).toHaveAttribute("href", /Hotkey-Runbook_0\.1\.0_(windows-x86_64|linux-x86_64|macos-(arm64|x86_64))/);
  await expect(page.locator("img[alt]")).toBeVisible();
});
