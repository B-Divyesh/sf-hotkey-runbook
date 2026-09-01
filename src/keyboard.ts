export type CatalogKeyAction =
  | { type: "focus-parameters" }
  | { type: "select"; index: number }
  | null;

export function isFilterShortcut(key: string, metaKey: boolean, ctrlKey: boolean): boolean {
  return (metaKey || ctrlKey) && key.toLowerCase() === "k";
}

export function isConfirmShortcut(key: string, metaKey: boolean, ctrlKey: boolean): boolean {
  return (metaKey || ctrlKey) && key === "Enter";
}

export function catalogKeyAction(key: string, length: number, selectedIndex: number): CatalogKeyAction {
  if (!length) return null;
  if (key === "Enter") return { type: "focus-parameters" };
  if (key !== "ArrowDown" && key !== "ArrowUp") return null;
  const change = key === "ArrowDown" ? 1 : -1;
  return { type: "select", index: (selectedIndex + change + length) % length };
}
