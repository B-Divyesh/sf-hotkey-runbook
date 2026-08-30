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
});
