export const minimumBuildFreeBytes: number;

export function assertSufficientBuildSpace(freeBytes: number, minimumBytes?: number): void;
export function clearBuildCaches(root: string): void;
export function freeBytesAt(path: string): number;
