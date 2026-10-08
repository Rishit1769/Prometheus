import type { DeveloperSummaryInput } from "../types";

export const DEVELOPER_SUMMARY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    profileSummary: { type: "string", maxLength: 2000 },
    limitations: { type: "array", maxItems: 20, items: { type: "string", maxLength: 300 } },
  },
  required: ["profileSummary", "limitations"],
} as const;

export const DEVELOPER_SUMMARY_SYSTEM_PROMPT = `Write a concise evidence-limited developer profile summary from the supplied deterministic capability vector.
Do not assign or alter domain levels. Do not claim seniority, expertise, code quality, authorship,
or production reliability. Say demonstrated evidence indicates, and mention limitations when
appropriate. Return exactly one JSON object with exactly two fields: "profileSummary" (a string of
at most 2000 characters) and "limitations" (an array of strings, each at most 300 characters).
Do not add Markdown fences or extra fields.`;

export function developerSummaryPrompt(input: DeveloperSummaryInput): string {
  return `Summarize this deterministic aggregation. Do not reinterpret scores or invent capabilities.

AGGREGATION_JSON:
${JSON.stringify(input)}`;
}
