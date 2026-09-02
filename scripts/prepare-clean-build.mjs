import { execFileSync } from "node:child_process";
import { existsSync, rmSync, statfsSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// A fresh Tauri test + Clippy profile used 4.3 GiB in the repair worker.
// Keep headroom for linker temp files instead of letting Cargo fail partway through.
export const minimumBuildFreeBytes = 5 * 1024 * 1024 * 1024;

const cacheDirectories = [
  "src-tauri/target",
  "node_modules/.vite",
  "test-results",
  "playwright-report",
];

export function assertSufficientBuildSpace(freeBytes, minimumBytes = minimumBuildFreeBytes) {
  if (freeBytes < minimumBytes) {
    throw new Error(
      `Only ${freeBytes} bytes are free for the native build; clear safe build/package caches and provide at least ${minimumBytes} bytes.`,
    );
  }
}

export function clearBuildCaches(root) {
  const absoluteRoot = resolve(root);
  for (const relative of cacheDirectories) {
    const cache = resolve(absoluteRoot, relative);
    if (!cache.startsWith(`${absoluteRoot}${sep}`)) {
      throw new Error(`Refusing to clear a path outside the repository: ${cache}`);
    }
    if (existsSync(cache)) {
      rmSync(cache, { recursive: true, force: true });
    }
  }
}

export function freeBytesAt(path) {
  const stats = statfsSync(path);
  return Number(stats.bavail) * Number(stats.bsize);
}

function configuredMinimumBuildFreeBytes() {
  const configured = process.env.HOTKEY_MINIMUM_BUILD_FREE_BYTES;
  if (configured === undefined) return minimumBuildFreeBytes;
  const bytes = Number(configured);
  if (!Number.isSafeInteger(bytes) || bytes < 0) {
    throw new Error("HOTKEY_MINIMUM_BUILD_FREE_BYTES must be a non-negative integer.");
  }
  return bytes;
}

function main() {
  const repositoryRoot = process.env.HOTKEY_BUILD_ROOT
    ? resolve(process.env.HOTKEY_BUILD_ROOT)
    : resolve(dirname(fileURLToPath(import.meta.url)), "..");

  clearBuildCaches(repositoryRoot);
  if (process.env.HOTKEY_SKIP_NPM_CACHE_CLEAN !== "1") {
    execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["cache", "clean", "--force"], {
      cwd: repositoryRoot,
      stdio: "inherit",
    });
  }
  const freeBytes = freeBytesAt(repositoryRoot);
  assertSufficientBuildSpace(freeBytes, configuredMinimumBuildFreeBytes());
  process.stdout.write(`Prepared clean native build space: ${freeBytes} bytes free.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
