import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporary: string[] = [];
afterEach(() => temporary.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));

describe("release manifest", () => {
  it("keeps package manifests pinned to the published site manifest", () => {
    const latest = JSON.parse(readFileSync("public/latest.json", "utf8"));
    const version = latest.version.replace(/^v/, "");
    const macArm = latest.platforms["macos-arm64"];
    const macIntel = latest.platforms["macos-x86_64"];
    const windows = latest.platforms["windows-x86_64"];
    const cask = readFileSync("homebrew/Casks/hotkey-runbook.rb", "utf8");
    const scoop = JSON.parse(readFileSync("scoop-bucket/hotkey-runbook.json", "utf8"));
    const winget = readFileSync("winget/manifests/h/HotkeyRunbook/HotkeyRunbook.yaml", "utf8");

    expect(cask).toContain(`version "${version}"`);
    expect(cask).toContain(macArm.sha256);
    expect(cask).toContain(macIntel.sha256);
    expect(scoop).toMatchObject({ version, url: windows.url, hash: windows.sha256 });
    expect(winget).toContain(`PackageVersion: ${version}`);
    expect(winget).toContain(`InstallerUrl: ${windows.url}`);
    expect(winget).toContain(`InstallerSha256: ${windows.sha256.toUpperCase()}`);
  });

  it("keeps uploaded deb and exe filenames identical in SHA256SUMS", () => {
    const root = mkdtempSync(join(tmpdir(), "hkr-release-"));
    temporary.push(root);
    const input = join(root, "artifacts");
    const output = join(root, "release-assets");
    const files: Record<string, string> = {
      "macos-arm64/Hotkey.Runbook_arm64.dmg": "mac arm",
      "macos-x86_64/Hotkey.Runbook_x64.dmg": "mac intel",
      "windows-x86_64/Hotkey.Runbook_x64_en-US.msi": "windows msi",
      "windows-x86_64/Hotkey Runbook_x64-setup.exe": "windows exe",
      "linux-x86_64/Hotkey.Runbook_amd64.AppImage": "linux app",
      "linux-x86_64/Hotkey Runbook_amd64.deb": "linux deb",
    };
    for (const [relative, content] of Object.entries(files)) { const file = join(input, relative); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); }
    execFileSync("node", ["scripts/release-manifest.mjs", input, output], { cwd: process.cwd(), env: { ...process.env, RELEASE_VERSION: "v9.9.9", GITHUB_REPOSITORY: "example/hotkey" } });
    const sums = readFileSync(join(output, "SHA256SUMS"), "utf8");
    expect(sums).toContain("Hotkey.Runbook_x64-setup.exe");
    expect(sums).toContain("Hotkey.Runbook_amd64.deb");
    expect(sums).not.toContain("Hotkey Runbook");
    expect(readFileSync(join(output, "Hotkey.Runbook_x64-setup.exe"), "utf8")).toBe("windows exe");
    expect(readFileSync(join(output, "Hotkey.Runbook_amd64.deb"), "utf8")).toBe("linux deb");
  });

  it("@claim:installer-integrity emits downloadable names with matching SHA-256 entries", () => {
    const root = mkdtempSync(join(tmpdir(), "hkr-release-claim-"));
    temporary.push(root);
    const input = join(root, "artifacts");
    const output = join(root, "release-assets");
    const files: Record<string, string> = {
      "macos-arm64/app.dmg": "mac arm",
      "macos-x86_64/app.dmg": "mac intel",
      "windows-x86_64/app.msi": "windows msi",
      "windows-x86_64/Hotkey Runbook.exe": "windows exe",
      "linux-x86_64/app.AppImage": "linux app",
      "linux-x86_64/Hotkey Runbook.deb": "linux deb",
    };
    for (const [relative, content] of Object.entries(files)) {
      const file = join(input, relative);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
    execFileSync("node", ["scripts/release-manifest.mjs", input, output], { cwd: process.cwd(), env: { ...process.env, RELEASE_VERSION: "v9.9.9", GITHUB_REPOSITORY: "example/hotkey" } });
    execFileSync("sha256sum", ["-c", "SHA256SUMS"], { cwd: output });
    const manifest = JSON.parse(readFileSync(join(output, "latest.json"), "utf8"));
    expect(manifest.version).toBe("v9.9.9");
    expect(Object.keys(manifest.platforms)).toEqual(["macos-arm64", "macos-x86_64", "windows-x86_64", "linux-x86_64"]);
    const workflow = readFileSync(".github/workflows/release.yml", "utf8");
    expect(workflow).toContain("macos-latest");
    expect(workflow).toContain("windows-latest");
    expect(workflow).toContain("ubuntu-latest");
    expect(workflow).toContain("softprops/action-gh-release");
  });
});
