import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FREE_HISTORY_LIMIT, FREE_RUNBOOK_LIMIT, FULL_HISTORY_LIMIT, visibleFreeItems } from "../src/limits";

describe("product claims", () => {
  it("@claim:free-tier-limits enforces 3 visible runbooks and 10 visible history entries", () => {
    const values = Array.from({ length: FULL_HISTORY_LIMIT }, (_, index) => index);
    expect(visibleFreeItems(values, FREE_RUNBOOK_LIMIT, false)).toEqual([0, 1, 2]);
    expect(visibleFreeItems(values, FREE_HISTORY_LIMIT, false)).toHaveLength(10);
    expect(visibleFreeItems(values, FREE_HISTORY_LIMIT, true)).toHaveLength(100);
  });

  it("@claim:local-privacy limits runtime network code to release and license services", () => {
    const sources = ["src/main.ts", "src/bridge.ts", "src/license.ts", "site/main.ts", "site/demo/main.ts"]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const origins = [...sources.matchAll(/https:\/\/[^\s"'`<]+/g)].map((match) => match[0].replace(/[);},]+$/, ""));
    expect(origins.every((origin) => origin.startsWith("https://api.sociobot.in") || origin.startsWith("https://api.github.com") || origin.startsWith("https://github.com"))).toBe(true);
    expect(sources).not.toMatch(/segment\.com|googletagmanager|openai\.azure\.com/i);
    const native = readFileSync("src-tauri/src/lib.rs", "utf8");
    expect(native).toMatch(/join\(if demo \{\s*"demo-history\.json"\s*\} else \{\s*"history\.json"/);
  });
});
