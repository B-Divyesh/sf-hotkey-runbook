import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporary: string[] = [];
afterEach(() => temporary.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));

function checksum(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function installShFixture(assetContents: string, expectedChecksum = checksum(assetContents)): { root: string; env: NodeJS.ProcessEnv } {
  const root = mkdtempSync(join(tmpdir(), "hkr-install-sh-"));
  temporary.push(root);
  const bin = join(root, "bin");
  const home = join(root, "home");
  const asset = join(root, "Hotkey.Runbook.AppImage");
  const manifest = join(root, "latest.json");
  const curl = join(bin, "curl");
  execFileSync("mkdir", ["-p", bin, home]);
  writeFileSync(asset, assetContents);
  writeFileSync(manifest, JSON.stringify({ platforms: { "linux-x86_64": { file: "Hotkey.Runbook.AppImage", sha256: expectedChecksum, url: "https://assets.invalid/Hotkey.Runbook.AppImage" } } }));
  writeFileSync(curl, "#!/bin/sh\nset -eu\nif [ \"$1\" = \"-fsSL\" ]; then cp \"$HOTKEY_TEST_MANIFEST\" \"$4\"; else cp \"$HOTKEY_TEST_ASSET\" \"$4\"; fi\n");
  chmodSync(curl, 0o755);
  return { root, env: { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}`, HOTKEY_TEST_MANIFEST: manifest, HOTKEY_TEST_ASSET: asset } };
}

describe("public installers", () => {
  it("@claim:installer-sh-checksum verifies the macOS/Linux asset before it is placed on PATH", () => {
    const success = installShFixture("verified AppImage bytes");
    execFileSync("sh", ["public/install.sh"], { cwd: process.cwd(), env: success.env, stdio: "pipe" });
    expect(readFileSync(join(success.root, "home/.local/bin/hotkey-runbook"), "utf8")).toBe("verified AppImage bytes");

    const rejected = installShFixture("tampered AppImage bytes", checksum("expected AppImage bytes"));
    const result = spawnSync("sh", ["public/install.sh"], { cwd: process.cwd(), env: rejected.env, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("SHA-256 verification failed");
    expect(existsSync(join(rejected.root, "home/.local/bin/hotkey-runbook"))).toBe(false);
  });

  it("@claim:installer-ps1-checksum compares the downloaded file before the Windows installer can start", () => {
    const script = readFileSync("public/install.ps1", "utf8");
    const hash = script.indexOf("[System.Security.Cryptography.SHA256]::Create()");
    const guard = script.indexOf('throw "SHA-256 verification failed; nothing was installed."');
    const start = script.indexOf("Start-Process msiexec.exe");
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(guard).toBeGreaterThan(hash);
    expect(start).toBeGreaterThan(guard);
    expect(script).toContain("$asset.sha256.ToLowerInvariant()");

    if (process.platform === "win32") {
      const root = mkdtempSync(join(tmpdir(), "hkr-install-ps1-"));
      temporary.push(root);
      const harness = join(root, "verify-installer.ps1");
      writeFileSync(harness, `
param([string]$Installer, [string]$Root, [string]$ExpectedHash)
$good = Join-Path $Root 'good.msi'
$bad = Join-Path $Root 'bad.msi'
[IO.File]::WriteAllText($good, 'verified MSI bytes')
[IO.File]::WriteAllText($bad, 'tampered MSI bytes')
$sha = $ExpectedHash
$global:HKRManifest = @{ platforms = @{ 'windows-x86_64' = @{ file = 'Hotkey.Runbook.msi'; sha256 = $sha; url = 'https://assets.invalid/Hotkey.Runbook.msi' } } } | ConvertTo-Json -Depth 5
$global:HKRAsset = $good
$global:HKRStarted = $false
function Invoke-RestMethod { param([string]$Uri) return ($global:HKRManifest | ConvertFrom-Json) }
function Invoke-WebRequest { param([string]$Uri, [string]$OutFile) Copy-Item $global:HKRAsset $OutFile }
function Start-Process { param([string]$FilePath, [object[]]$ArgumentList, [switch]$Wait, [switch]$PassThru) $global:HKRStarted = $true; return [pscustomobject]@{ ExitCode = 0 } }
& $Installer
if (-not $global:HKRStarted) { throw 'The verified installer did not start.' }
$global:HKRAsset = $bad
$global:HKRStarted = $false
try { & $Installer; throw 'The tampered installer was accepted.' } catch {
  if ($_.Exception.Message -notmatch 'SHA-256 verification failed') { throw }
}
if ($global:HKRStarted) { throw 'The tampered installer started.' }
`);
      execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", harness, "-Installer", join(process.cwd(), "public/install.ps1"), "-Root", root, "-ExpectedHash", checksum("verified MSI bytes")]);
    }
  });
});
