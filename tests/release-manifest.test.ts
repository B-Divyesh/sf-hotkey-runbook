import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporary: string[] = [];
afterEach(() => temporary.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));

describe("release manifest", () => {
  it("keeps uploaded deb and exe filenames identical in SHA256SUMS", () => {
    const root = mkdtempSync(join(tmpdir(), "hkr-release-"));
    temporary.push(root);
    const input = join(root, "artifacts");
    const output = join(root, "release-assets");
    const files: Record<string, string> = {
      "macos-arm64/Hotkey.Runbook_arm64.dmg": "mac arm",
      "macos-x86_64/Hotkey.Runbook_x64.dmg": "mac intel",
      "windows-x86_64/Hotkey.Runbook_x64_en-US.msi": "windows msi",
      "windows-x86_64/Hotkey.Runbook_x64-setup.exe": "windows exe",
      "linux-x86_64/Hotkey.Runbook_amd64.AppImage": "linux app",
      "linux-x86_64/Hotkey.Runbook_amd64.deb": "linux deb",
    };
    for (const [relative, content] of Object.entries(files)) { const file = join(input, relative); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); }
    execFileSync("node", ["scripts/release-manifest.mjs", input, output], { cwd: process.cwd(), env: { ...process.env, RELEASE_VERSION: "v9.9.9", GITHUB_REPOSITORY: "example/hotkey" } });
    const sums = readFileSync(join(output, "SHA256SUMS"), "utf8");
    expect(sums).toContain("Hotkey.Runbook_x64-setup.exe");
    expect(sums).toContain("Hotkey.Runbook_amd64.deb");
    expect(readFileSync(join(output, "Hotkey.Runbook_x64-setup.exe"), "utf8")).toBe("windows exe");
    expect(readFileSync(join(output, "Hotkey.Runbook_amd64.deb"), "utf8")).toBe("linux deb");
  });
});
