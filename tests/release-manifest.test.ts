import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertReleaseIdentity } from "../scripts/verify-release-identity.mjs";

const temporary: string[] = [];
afterEach(() => temporary.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));

describe("release manifest", () => {
  it("keeps the native package versions in lockstep and records a valid published manifest", () => {
    const latest = JSON.parse(readFileSync("public/latest.json", "utf8"));
    const packageManifest = JSON.parse(readFileSync("package.json", "utf8"));
    const tauriManifest = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
    const version = latest.version.replace(/^v/, "");
    const macArm = latest.platforms["macos-arm64"];
    const macIntel = latest.platforms["macos-x86_64"];
    const windows = latest.platforms["windows-x86_64"];
    const cask = readFileSync("homebrew/Casks/hotkey-runbook.rb", "utf8");
    const scoop = JSON.parse(readFileSync("scoop-bucket/hotkey-runbook.json", "utf8"));
    const winget = readFileSync("winget/manifests/h/HotkeyRunbook/HotkeyRunbook.yaml", "utf8");

    expect(latest.commit).toMatch(/^[a-f0-9]{40}$/);
    const cargo = readFileSync("src-tauri/Cargo.toml", "utf8");
    expect(packageManifest.version).toBe(tauriManifest.version);
    expect(cargo).toContain(`version = "${packageManifest.version}"`);
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    if (packageManifest.version === version) {
      expect(cask).toContain(`version "${version}"`);
      expect(cask).toContain(macArm.sha256);
      expect(cask).toContain(macIntel.sha256);
      expect(scoop).toMatchObject({ version, url: windows.url, hash: windows.sha256 });
      expect(winget).toContain(`PackageVersion: ${version}`);
      expect(winget).toContain(`InstallerUrl: ${windows.url}`);
      expect(winget).toContain(`InstallerSha256: ${windows.sha256.toUpperCase()}`);
    }
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
    execFileSync("node", ["scripts/release-manifest.mjs", input, output], { cwd: process.cwd(), env: { ...process.env, RELEASE_VERSION: "v9.9.9", RELEASE_COMMIT: "a".repeat(40), GITHUB_REPOSITORY: "example/hotkey" } });
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
    execFileSync("node", ["scripts/release-manifest.mjs", input, output], { cwd: process.cwd(), env: { ...process.env, RELEASE_VERSION: "v9.9.9", RELEASE_COMMIT: "b".repeat(40), GITHUB_REPOSITORY: "example/hotkey" } });
    execFileSync("sha256sum", ["-c", "SHA256SUMS"], { cwd: output });
    const manifest = JSON.parse(readFileSync(join(output, "latest.json"), "utf8"));
    const metadata = JSON.parse(readFileSync(join(output, "installer-metadata.json"), "utf8"));
    expect(manifest.version).toBe("v9.9.9");
    expect(manifest.commit).toBe("b".repeat(40));
    expect(Object.keys(manifest.platforms)).toEqual(["macos-arm64", "macos-x86_64", "windows-x86_64", "linux-x86_64"]);
    expect(manifest.installedBuild).toEqual({ version: "9.9.9", commit: "b".repeat(40), command: "hotkey-runbook --build-identity" });
    assertReleaseIdentity({
      manifest,
      metadata,
      sourceCommit: "b".repeat(40),
      installedIdentity: { version: "9.9.9", commit: "b".repeat(40) },
    });
    const workflow = readFileSync(".github/workflows/release.yml", "utf8");
    expect(workflow).toContain("macos-latest");
    expect(workflow).toContain("windows-latest");
    expect(workflow).toContain("ubuntu-latest");
    expect(workflow).toContain("softprops/action-gh-release");
  });

  it("@regression:release-source-identity rejects the stale-manifest failure before an installer is published", () => {
    const current = "b".repeat(40);
    const stale = "a".repeat(40);
    const platforms = Object.fromEntries(["macos-arm64", "macos-x86_64", "windows-x86_64", "linux-x86_64"].map((platform) => [platform, {
      file: `Hotkey-Runbook_9.9.9_${platform}.bin`,
      sha256: "c".repeat(64),
      url: `https://github.com/example/hotkey/releases/download/v9.9.9/Hotkey-Runbook_9.9.9_${platform}.bin`,
    }]));
    const manifest = { version: "v9.9.9", commit: stale, installedBuild: { version: "9.9.9", commit: stale, command: "hotkey-runbook --build-identity" }, platforms };
    const metadata = { tag: "v9.9.9", sourceCommit: stale, installedBuild: manifest.installedBuild, platforms };
    expect(() => assertReleaseIdentity({ manifest, metadata, sourceCommit: current, installedIdentity: { version: "9.9.9", commit: stale } }))
      .toThrow(/does not match tagged source/);
  });

  it("@regression:installed-build-identity watches the active Git ref instead of reusing a prior build", () => {
    const buildScript = readFileSync("src-tauri/build.rs", "utf8");
    expect(buildScript).toContain("watch_current_git_ref");
    expect(buildScript).toContain('git_dir.join("HEAD")');
    expect(buildScript).toContain("git_dir.join(reference)");
  });
});
