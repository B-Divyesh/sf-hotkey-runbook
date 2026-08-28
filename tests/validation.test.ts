import { describe, expect, it } from "vitest";
import { matchesRunbook, validateParameter } from "../src/validation";

describe("parameter validation", () => {
  it("requires values marked required", () => {
    expect(validateParameter({ name: "host", label: "Host", type: "text", required: true }, "")).toBe("Host is required.");
  });

  it("accepts only listed choices", () => {
    const parameter = { name: "env", label: "Environment", type: "choice" as const, choices: ["stage", "prod"] };
    expect(validateParameter(parameter, "dev")).toContain("listed value");
    expect(validateParameter(parameter, "stage")).toBeNull();
  });

  it("checks integers and author patterns", () => {
    expect(validateParameter({ name: "count", label: "Count", type: "integer" }, "3.5")).toContain("whole number");
    expect(validateParameter({ name: "ticket", label: "Ticket", type: "text", pattern: "^OPS-[0-9]+$" }, "OPS-42")).toBeNull();
  });
});

describe("runbook filtering", () => {
  const runbook = { name: "Restart indexer", description: "Restarts one worker", tags: ["maintenance", "search"] };
  it("matches names, descriptions, and tags without case sensitivity", () => {
    expect(matchesRunbook("INDEX", runbook)).toBe(true);
    expect(matchesRunbook("worker", runbook)).toBe(true);
    expect(matchesRunbook("search", runbook)).toBe(true);
    expect(matchesRunbook("database", runbook)).toBe(false);
  });
});
