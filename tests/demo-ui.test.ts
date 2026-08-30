import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { demoBannerTemplate } from "../src/demo-ui";

describe("native demo controls", () => {
  it("@claim:native-demo-controls renders persistent reset and exit controls only in demo mode", () => {
    const banner = demoBannerTemplate(true);
    expect(banner).toContain("Demo");
    expect(banner).toContain("sample data, nothing is saved to your real runbooks");
    expect(banner).toContain('data-action="reset-demo"');
    expect(banner).toContain('data-action="start-real"');
    expect(demoBannerTemplate(false)).toBe("");
    const app = readFileSync("src/main.ts", "utf8");
    expect(app).toMatch(/function render\(\)[\s\S]*renderDemoBanner\(\)/);
    expect(app).toContain("bridge.resetDemoProject()");
    expect(app).toContain("bridge.resetSampleProject()");
  });
});
