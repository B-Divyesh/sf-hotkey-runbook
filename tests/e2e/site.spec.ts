import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

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

test("browser sample shows masked environment before the sample can run", async ({ page }) => {
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
  const demoOrigin = new URL(page.url()).origin;
  await page.getByRole("button", { name: "Review exact process" }).click();
  await page.locator("#demo-confirm").fill("Inspect sample deployment");
  await page.getByRole("button", { name: "Run sample check" }).click();
  expect(requests.every((url) => new URL(url).origin === demoOrigin)).toBe(true);
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

test("completed mobile demo keeps Reset demo legible and reflows at 390px and 200% text", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo/");
  await page.getByRole("button", { name: "Review exact process" }).click();
  await page.locator("#demo-confirm").fill("Inspect sample deployment");
  await page.getByRole("button", { name: "Run sample check" }).click();
  await expect(page.getByText("Completed sample check")).toBeVisible();

  const completedAxe = await new AxeBuilder({ page }).analyze();
  expect(completedAxe.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.getByRole("button", { name: "Reset demo" }).last().click();
  await page.evaluate(() => document.documentElement.style.setProperty("font-size", "32px", "important"));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("all repeated navigation targets meet the 44 px minimum", async ({ page }) => {
  await page.goto("/");
  for (const target of await page.locator("a, button, input, select, [tabindex='0']").all()) {
    const box = await target.boundingBox();
    if (box) expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("landing reflows at 390px and 200% text, and the license form stays hidden until disclosed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const form = page.locator("#license-form");
  await expect(form).toBeHidden();
  await expect(form).toHaveAttribute("hidden", "");
  await expect(form).toHaveCSS("display", "none");

  await page.evaluate(() => document.documentElement.style.setProperty("font-size", "32px", "important"));
  const assertNoOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const selector of [".code-sheet", "#license", ".purchase"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x || 0) + (box?.width || 0)).toBeLessThanOrEqual(390);
    }
  };
  await assertNoOverflow();

  await page.getByRole("button", { name: "Have a license? Paste it" }).click();
  await expect(form).toBeVisible();
  await expect(page.getByLabel("License token")).toBeFocused();
  await assertNoOverflow();
});

test("@claim:one-time-license-purchase opens the $29 Sociobot checkout", async ({ page }) => {
  const checkoutUrl = "https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout";
  await page.route(checkoutUrl, async (route) => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><head><title>Sociobot checkout</title></head><body><main><h1>Hosted checkout</h1></main></body></html>",
  }));
  await page.goto("/");
  await expect(page.getByText("$29", { exact: true })).toBeVisible();
  const buy = page.getByRole("link", { name: "Buy the one-time license" });
  await expect(buy).toHaveAttribute("href", checkoutUrl);
  await buy.click();
  await expect(page).toHaveURL(checkoutUrl);
  await expect(page.getByRole("heading", { name: "Hosted checkout" })).toBeVisible();
  await page.goto("/terms/");
  await expect(page.locator("main")).toContainText("Dodo is the merchant of record and handles refunds.");
  await expect(page.getByRole("link", { name: "Buy the license through the hosted checkout" })).toHaveAttribute("href", checkoutUrl);
});

test("@claim:existing-license-recovery discloses and restores an existing license", async ({ page }) => {
  const token = "existing-license-fixture-2026";
  const verifyUrl = `https://api.sociobot.in/api/v1/products/hotkey-runbook/verify?license=${token}`;
  const verifyRequests: string[] = [];
  await page.route(verifyUrl, async (route) => {
    verifyRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"valid":true,"reason":"ok","expires_at":null}',
    });
  });
  await page.goto("/");
  await expect(page.getByText("$29", { exact: true })).toBeVisible();
  await expect(page.locator('a[href="https://api.sociobot.in/api/v1/products/hotkey-runbook/checkout"]')).toHaveCount(1);
  await expect(page.locator("#license-form")).toBeHidden();
  await page.getByRole("button", { name: "Have a license? Paste it" }).click();
  await expect(page.locator("#license-form")).toBeVisible();
  await page.getByLabel("License token").fill(token);
  await page.getByRole("button", { name: "Verify license" }).click();
  await expect(page.locator("#license-message")).toHaveText("License verified. Open the app and paste the same token in Settings.");
  expect(verifyRequests).toEqual([verifyUrl]);
  expect(await page.evaluate(() => ({
    token: localStorage.getItem("sb_license:hotkey-runbook"),
    verdict: JSON.parse(localStorage.getItem("sb_license:hotkey-runbook:verdict") || "null"),
  }))).toMatchObject({ token, verdict: { unlocked: true, token, reason: "ok" } });
  await page.reload();
  await expect(page.getByRole("button", { name: "License active on this browser" })).toBeDisabled();
  expect(verifyRequests).toEqual([verifyUrl]);
  await page.goto("/terms/");
  await expect(page.locator("main")).toContainText("Dodo is the merchant of record and handles refunds.");
});

test("@claim:no-account completes the free sample without an account", async ({ page }) => {
  const packageManifest = readFileSync("package.json", "utf8");
  const nativeUi = readFileSync("src/main.ts", "utf8");
  expect(packageManifest).not.toMatch(/auth0|firebase|oauth|openid|clerk/i);
  expect(nativeUi).not.toMatch(/sign in|log in|create account/i);
  await page.goto("/demo/");
  await expect(page.getByRole("link", { name: /sign in|log in|create account/i })).toHaveCount(0);
  await page.getByRole("button", { name: "Review exact process" }).click();
  await page.locator("#demo-confirm").fill("Inspect sample deployment");
  await page.getByRole("button", { name: "Run sample check" }).click();
  await expect(page.getByText("Completed sample check")).toBeVisible();
});

test("@claim:no-telemetry sends no analytics during the free browser flow", async ({ page }) => {
  const runtimeSources = ["src/main.ts", "src/bridge.ts", "src/license.ts", "src-tauri/src/lib.rs", "site/main.ts", "site/demo/main.ts"]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  expect(runtimeSources).not.toMatch(/segment\.com|googletagmanager|google-analytics|mixpanel|posthog|sentry|applicationinsights/i);
  const requests: string[] = [];
  await page.route("https://api.github.com/repos/B-Divyesh/sf-hotkey-runbook/releases/latest", async (route) => route.fulfill({ json: { tag_name: "v0.1.14", assets: [] } }));
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.getByRole("link", { name: /Try it with sample data/ }).click();
  await page.getByRole("button", { name: "Review exact process" }).click();
  await page.locator("#demo-confirm").fill("Inspect sample deployment");
  await page.getByRole("button", { name: "Run sample check" }).click();
  const siteOrigin = new URL(page.url()).origin;
  expect(requests.every((url) => {
    const parsed = new URL(url);
    return parsed.origin === siteOrigin || parsed.href === "https://api.github.com/repos/B-Divyesh/sf-hotkey-runbook/releases/latest";
  })).toBe(true);
});

test("license returns replace an older cached verdict and remove the token from the URL", async ({ page }) => {
  const token = "new-checkout-license-2026";
  const verifyUrl = `https://api.sociobot.in/api/v1/products/hotkey-runbook/verify?license=${token}`;
  await page.route(verifyUrl, async (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: '{"valid":true,"reason":"ok","expires_at":null}',
  }));
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("sb_license:hotkey-runbook", "old-token");
    localStorage.setItem("sb_license:hotkey-runbook:verdict", JSON.stringify({ unlocked: false, token: "old-token", reason: "invalid", checkedAt: Date.now() }));
  });
  await page.goto(`/?license=${token}`);
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "License active on this browser" })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("sb_license:hotkey-runbook"))).toBe(token);
});

test("unusable release metadata keeps a calm direct-download recovery path", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.route("https://api.github.com/repos/B-Divyesh/sf-hotkey-runbook/releases/latest", (route) => route.fulfill({ json: {} }));
  await page.goto("/");
  await expect(page.locator("#download-status")).toContainText("could not be read");
  await expect(page.locator("#primary-download")).toHaveAttribute("href", "https://github.com/B-Divyesh/sf-hotkey-runbook/releases/latest");
  expect(errors).toEqual([]);
});
