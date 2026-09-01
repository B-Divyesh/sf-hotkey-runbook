import { describe, expect, it } from "vitest";
import { catalogKeyAction, isConfirmShortcut, isFilterShortcut } from "../src/keyboard";

describe("desktop keyboard workflow", () => {
  it("@claim:keyboard-first-desktop moves through a runbook, prepares it, and confirms it without a pointer", () => {
    expect(isFilterShortcut("k", false, true)).toBe(true);
    expect(isFilterShortcut("K", true, false)).toBe(true);
    expect(catalogKeyAction("ArrowDown", 3, 0)).toEqual({ type: "select", index: 1 });
    expect(catalogKeyAction("ArrowUp", 3, 0)).toEqual({ type: "select", index: 2 });
    expect(catalogKeyAction("Enter", 3, 1)).toEqual({ type: "focus-parameters" });
    expect(isConfirmShortcut("Enter", false, true)).toBe(true);
    expect(isConfirmShortcut("Enter", true, false)).toBe(true);
  });
});
