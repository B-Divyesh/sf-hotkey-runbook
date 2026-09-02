import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("static site contract", () => {
  it("serves unknown paths through the platform 404 response", () => {
    const config = JSON.parse(readFileSync("public/staticwebapp.config.json", "utf8"));
    expect(config.navigationFallback).toBeUndefined();
    expect(config.responseOverrides["404"]).toEqual({ rewrite: "/404.html" });
  });

  it("publishes the required social and touch metadata", () => {
    const home = readFileSync("site/index.html", "utf8");
    expect(home).toContain('content="https://hotkey-runbook.sociobot.in/assets/social-preview.jpg"');
    expect(home).toContain('content="1200"');
    expect(home).toContain('content="630"');
    expect(home).toContain('sizes="180x180" href="/apple-touch-icon.png"');
  });

  it("includes four captioned desktop walkthrough frames", () => {
    const home = readFileSync("site/index.html", "utf8");
    expect(home.match(/assets\/walkthrough\//g)).toHaveLength(4);
    expect(home.match(/<figcaption>/g)).toHaveLength(5);
  });

  it("loads critical styles from HTML before application scripts", () => {
    const pages = ["site/index.html", "site/demo/index.html", "site/privacy/index.html", "site/terms/index.html", "site/404.html"];
    for (const page of pages) {
      const html = readFileSync(page, "utf8");
      expect(html).toContain('rel="stylesheet" href="/style.css"');
      expect(html.indexOf('rel="stylesheet"')).toBeLessThan(html.indexOf('<script type="module"'));
    }
    expect(readFileSync("site/main.ts", "utf8")).not.toContain('import "./style.css"');
    expect(readFileSync("site/demo/main.ts", "utf8")).not.toContain('import "../style.css"');
  });

  it("keeps compact native and site controls at least 44 pixels high", () => {
    const nativeCss = readFileSync("src/style.css", "utf8");
    const siteCss = readFileSync("site/style.css", "utf8");
    expect(nativeCss).toContain(".button.small { min-height: 44px");
    expect(nativeCss).toContain(".empty > a { min-height: 44px");
    expect(siteCss).toContain(".wordmark { min-height:44px");
    expect(siteCss).toContain(".text-button { min-height:44px");
    expect(siteCss).toContain(".legal-page a { min-height:44px");
  });

  it("does not offer a checkout while preserving existing-license recovery", () => {
    const publicCopy = ["site/index.html", "site/terms/index.html", "site/privacy/index.html", "README.md"]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const nativeUi = readFileSync("src/main.ts", "utf8");
    expect(publicCopy).toContain("This page does not offer a checkout.");
    expect(nativeUi).toContain("This app does not offer checkout.");
    expect(publicCopy).not.toMatch(/\$29|one-time license/i);
    expect(nativeUi).not.toMatch(/\$29|one-time license/i);
    expect(publicCopy).not.toMatch(/href=["'][^"']*\/checkout/i);
    expect(nativeUi).not.toMatch(/https:\/\/api\.sociobot\.in\/api\/v1\/products\/hotkey-runbook\/checkout/i);
    expect(publicCopy).toContain("Restore a valid token from an earlier purchase.");
    expect(nativeUi).toContain("Restore a license you already have.");
  });
});
