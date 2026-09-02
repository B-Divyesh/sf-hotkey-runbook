import { readFile, writeFile } from "node:fs/promises";

const manifestPath = process.argv[2] || "public/latest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const version = manifest.version.replace(/^v/, "");
const macArm = manifest.platforms["macos-arm64"];
const macIntel = manifest.platforms["macos-x86_64"];
const windows = manifest.platforms["windows-x86_64"];

if (!manifest.commit?.match(/^[a-f0-9]{40}$/) || !macArm || !macIntel || !windows) {
  throw new Error("The release manifest is incomplete; do not synchronize installer metadata.");
}

let cask = await readFile("homebrew/Casks/hotkey-runbook.rb", "utf8");
cask = cask.replace(/version "[^"]+"/, `version "${version}"`)
  .replace(/sha256 arm:\s+"[a-f0-9]+",\n\s+intel:\s+"[a-f0-9]+"/, `sha256 arm:   "${macArm.sha256}",\n         intel: "${macIntel.sha256}"`);
await writeFile("homebrew/Casks/hotkey-runbook.rb", cask);

const scoop = JSON.parse(await readFile("scoop-bucket/hotkey-runbook.json", "utf8"));
scoop.version = version;
scoop.url = windows.url;
scoop.hash = windows.sha256;
await writeFile("scoop-bucket/hotkey-runbook.json", `${JSON.stringify(scoop, null, 2)}\n`);

let winget = await readFile("winget/manifests/h/HotkeyRunbook/HotkeyRunbook.yaml", "utf8");
winget = winget.replace(/PackageVersion: .+/, `PackageVersion: ${version}`)
  .replace(/InstallerUrl: .+/, `InstallerUrl: ${windows.url}`)
  .replace(/InstallerSha256: .+/, `InstallerSha256: ${windows.sha256.toUpperCase()}`);
await writeFile("winget/manifests/h/HotkeyRunbook/HotkeyRunbook.yaml", winget);

process.stdout.write(`Synchronized installer metadata for ${manifest.version} (${manifest.commit}).\n`);
