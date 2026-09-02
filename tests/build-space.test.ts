import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertSufficientBuildSpace, minimumBuildFreeBytes } from "../scripts/prepare-clean-build.mjs";

const temporary: string[] = [];
afterEach(() => temporary.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));

describe("clean native build preparation", () => {
  it("@regression:disk-exhaustion rejects the reported low-space condition before Cargo runs", () => {
    expect(() => assertSufficientBuildSpace(minimumBuildFreeBytes - 1)).toThrow(
      /clear safe build\/package caches/,
    );
    expect(() => assertSufficientBuildSpace(minimumBuildFreeBytes)).not.toThrow();
  });

  it("@regression:disk-exhaustion removes only disposable build and package caches", () => {
    const root = join(tmpdir(), `hotkey-build-space-${Date.now()}`);
    temporary.push(root);
    const source = join(root, "src-tauri", "src", "lib.rs");
    const target = join(root, "src-tauri", "target", "debug", "artifact");
    const vite = join(root, "node_modules", ".vite", "metadata.json");
    const results = join(root, "test-results", "run.json");
    const report = join(root, "playwright-report", "index.html");
    for (const file of [source, target, vite, results, report]) {
      mkdirSync(join(file, ".."), { recursive: true });
      writeFileSync(file, "fixture");
    }

    execFileSync("node", ["scripts/prepare-clean-build.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HOTKEY_BUILD_ROOT: root,
        HOTKEY_SKIP_NPM_CACHE_CLEAN: "1",
        HOTKEY_MINIMUM_BUILD_FREE_BYTES: "0",
      },
    });

    expect(existsSync(source)).toBe(true);
    expect(existsSync(join(root, "src-tauri", "target"))).toBe(false);
    expect(existsSync(join(root, "node_modules", ".vite"))).toBe(false);
    expect(existsSync(join(root, "test-results"))).toBe(false);
    expect(existsSync(join(root, "playwright-report"))).toBe(false);
  });
});
