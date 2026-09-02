import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sha256 = /^[a-f0-9]{64}$/;
const commit = /^[a-f0-9]{40}$/;

export function assertReleaseIdentity({ manifest, metadata, sourceCommit, installedIdentity }) {
  if (!commit.test(sourceCommit)) throw new Error("Expected a full source commit.");
  if (manifest.commit !== sourceCommit) {
    throw new Error(`Release manifest commit ${manifest.commit} does not match tagged source ${sourceCommit}.`);
  }
  if (metadata.sourceCommit !== sourceCommit || metadata.tag !== manifest.version) {
    throw new Error("Installer metadata does not identify the tagged source and release version.");
  }
  if (manifest.installedBuild?.commit !== sourceCommit || metadata.installedBuild?.commit !== sourceCommit) {
    throw new Error("The installed-build identity does not identify the tagged source.");
  }
  if (installedIdentity) {
    if (installedIdentity.commit !== sourceCommit || installedIdentity.version !== manifest.version.replace(/^v/, "")) {
      throw new Error("The installed binary identity does not match the release manifest.");
    }
  }
  for (const [platform, asset] of Object.entries(manifest.platforms || {})) {
    const installer = metadata.platforms?.[platform];
    if (!asset?.file || !sha256.test(asset.sha256 || "") || !asset.url?.includes(`/releases/download/${manifest.version}/`)) {
      throw new Error(`Manifest has invalid ${platform} installer metadata.`);
    }
    if (!installer || installer.file !== asset.file || installer.sha256 !== asset.sha256 || installer.url !== asset.url) {
      throw new Error(`Installer metadata for ${platform} diverges from latest.json.`);
    }
  }
}

async function main() {
  const [directory, sourceCommit, identityJson] = process.argv.slice(2);
  if (!directory || !sourceCommit) {
    throw new Error("Usage: node scripts/verify-release-identity.mjs <release-assets-dir> <source-commit> [installed-identity-json]");
  }
  const root = resolve(directory);
  const manifest = JSON.parse(await readFile(resolve(root, "latest.json"), "utf8"));
  const metadata = JSON.parse(await readFile(resolve(root, "installer-metadata.json"), "utf8"));
  const installedIdentity = identityJson ? JSON.parse(identityJson) : undefined;
  assertReleaseIdentity({ manifest, metadata, sourceCommit, installedIdentity });
  process.stdout.write(`Release ${manifest.version} identifies ${sourceCommit}.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
