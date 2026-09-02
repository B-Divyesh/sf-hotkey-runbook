import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

const input = process.argv[2] || "artifacts";
const output = process.argv[3] || "release-assets";
const version = process.env.RELEASE_VERSION || "v0.1.3";
const repository = process.env.GITHUB_REPOSITORY || "B-Divyesh/sf-hotkey-runbook";
const commit = process.env.RELEASE_COMMIT || process.env.GITHUB_SHA || "unrecorded";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) files.push(...(entry.isDirectory() ? await walk(join(directory, entry.name)) : [join(directory, entry.name)]));
  return files;
}
const all = await walk(input);
const pick = (folder, extension) => all.find((file) => relative(input, file).toLowerCase().includes(folder) && file.toLowerCase().endsWith(extension));
const selected = {
  "macos-arm64": pick("macos-arm64", ".dmg"),
  "macos-x86_64": pick("macos-x86_64", ".dmg"),
  "windows-x86_64": pick("windows-x86_64", ".msi"),
  "linux-x86_64": pick("linux-x86_64", ".appimage"),
};
for (const [platform, file] of Object.entries(selected)) if (!file) throw new Error(`Missing release asset for ${platform}`);
await mkdir(output, { recursive: true });
const sums = [];
const platforms = {};
for (const [platform, source] of Object.entries(selected)) {
  const original = basename(source);
  const extension = original.slice(original.lastIndexOf("."));
  const filename = `Hotkey-Runbook_${version.replace(/^v/, "")}_${platform}${extension}`;
  const destination = join(output, filename);
  await cp(source, destination);
  const sha256 = createHash("sha256").update(await readFile(destination)).digest("hex");
  sums.push(`${sha256}  ${filename}`);
  platforms[platform] = { file: filename, sha256, url: `https://github.com/${repository}/releases/download/${version}/${encodeURIComponent(filename)}` };
}
for (const file of all.filter((item) => /\.(deb|exe)$/i.test(item))) {
  // GitHub exposes spaces in uploaded Tauri filenames as periods. Use the
  // published name in both the asset and checksum list.
  const filename = basename(file).replaceAll(" ", ".");
  const destination = join(output, filename);
  await cp(file, destination);
  sums.push(`${createHash("sha256").update(await readFile(destination)).digest("hex")}  ${filename}`);
}
await writeFile(join(output, "SHA256SUMS"), `${sums.join("\n")}\n`);
await writeFile(join(output, "latest.json"), `${JSON.stringify({ version, commit, publishedAt: new Date().toISOString(), platforms }, null, 2)}\n`);
