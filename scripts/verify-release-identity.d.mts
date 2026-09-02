export interface ReleaseAsset {
  file: string;
  sha256: string;
  url: string;
}

export interface ReleaseIdentityInput {
  manifest: {
    version: string;
    commit: string;
    installedBuild?: { version: string; commit: string; command: string };
    platforms: Record<string, ReleaseAsset>;
  };
  metadata: {
    tag: string;
    sourceCommit: string;
    installedBuild?: { version: string; commit: string; command: string };
    platforms: Record<string, ReleaseAsset>;
  };
  sourceCommit: string;
  installedIdentity?: { version: string; commit: string };
}

export function assertReleaseIdentity(input: ReleaseIdentityInput): void;
