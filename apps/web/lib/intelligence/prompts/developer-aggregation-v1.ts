import type { DeveloperSummaryInput } from "../types";

export const DEVELOPER_SUMMARY_SYSTEM_PROMPT = `Write a concise evidence-limited developer profile summary from the supplied deterministic capability vector.
Do not assign or alter domain levels. Do not claim seniority, expertise, code quality, authorship,
or production reliability. Say demonstrated evidence indicates, and mention limitations when
appropriate. Return only JSON with profileSummary and limitations.`;

export function developerSummaryPrompt(input: DeveloperSummaryInput): string {
  return `Summarize this deterministic aggregation. Do not reinterpret scores or invent capabilities.

AGGREGATION_JSON:
${JSON.stringify(input)}`;
}
