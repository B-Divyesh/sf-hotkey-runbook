import type { RunbookParameter } from "./types";

export function validateParameter(parameter: RunbookParameter, raw: unknown): string | null {
  if ((raw === undefined || raw === null || raw === "") && parameter.required) return `${parameter.label} is required.`;
  if (raw === undefined || raw === null || raw === "") return null;
  const value = String(raw);
  if (parameter.type === "integer" && !/^-?\d+$/.test(value)) return `${parameter.label} must be a whole number.`;
  if (parameter.type === "choice" && !parameter.choices?.includes(value)) return `Choose a listed value for ${parameter.label}.`;
  if (parameter.type === "boolean" && !["true", "false"].includes(value)) return `${parameter.label} must be true or false.`;
  if (parameter.pattern) {
    try { if (!new RegExp(parameter.pattern).test(value)) return `${parameter.label} does not match its required format.`; }
    catch { return `${parameter.label} has an invalid validation pattern.`; }
  }
  if (value.includes("\0")) return `${parameter.label} contains an invalid null character.`;
  return null;
}

export function matchesRunbook(query: string, runbook: { name: string; description: string; tags: string[] }): boolean {
  const needle = query.trim().toLocaleLowerCase();
  return !needle || [runbook.name, runbook.description, ...runbook.tags].some((part) => part.toLocaleLowerCase().includes(needle));
}
