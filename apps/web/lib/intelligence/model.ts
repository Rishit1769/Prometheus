import { randomUUID } from "node:crypto";
import { developerSummaryPrompt, DEVELOPER_SUMMARY_JSON_SCHEMA, DEVELOPER_SUMMARY_SYSTEM_PROMPT } from "./prompts/developer-aggregation-v1";
import { repositoryAnalysisPrompt, REPOSITORY_ANALYSIS_JSON_SCHEMA, REPOSITORY_ANALYSIS_SYSTEM_PROMPT } from "./prompts/repository-analysis-v1";
import type { DeveloperSummaryInput, IntelligenceModel, RepositoryAnalysisInput } from "./types";
import { groundRepositoryAnalysisOutput, validateDeveloperSummaryOutput, validateRepositoryAnalysisOutput } from "./validate";
import { IntelligenceError, safeDiagnosticMessage } from "./errors";

type OpenAIResponse = {
  error?: { type?: string; code?: string; message?: string };
  choices?: { finish_reason?: string | null; message?: { content?: string | null; reasoning_content?: string | null } }[];
};

function parseModelJson(content: string | null | undefined, finishReason?: string | null): unknown {
  if (!content?.trim()) {
    throw new IntelligenceError({
      stage: "parse",
      code: finishReason === "length" ? "OUTPUT_TRUNCATED" : "EMPTY_MODEL_OUTPUT",
      providerStatus: 200,
      message: finishReason === "length"
        ? "The model exhausted its output budget before producing structured JSON."
        : "The provider returned no final structured output.",
    });
  }
  try {
    return JSON.parse(content);
  } catch {
    throw new IntelligenceError({ stage: "parse", code: "INVALID_MODEL_JSON", providerStatus: 200, message: "The provider returned malformed JSON instead of the requested structured output." });
  }
}

function providerError(responseStatus: number, payload: OpenAIResponse, rawBody: string, apiKey: string, provider: string): IntelligenceError {
  const providerErrorCode = payload.error?.type ?? payload.error?.code ?? "HTTP_ERROR";
  const message = payload.error?.message ?? rawBody.slice(0, 300) ?? `Provider returned HTTP ${responseStatus}.`;
  return new IntelligenceError({
    stage: "provider",
    code: safeDiagnosticMessage(providerErrorCode, apiKey).replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 80),
    providerStatus: responseStatus,
    message: safeDiagnosticMessage(`${provider} provider: ${message}`, apiKey),
  });
}

export class OpenAIIntelligenceModel implements IntelligenceModel {
  readonly provider: string;
  readonly modelName: string;
  readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;
  private readonly sessionId?: string;
  private readonly userAgent: string;

  constructor(options: { apiKey: string; modelName: string; provider?: string; baseUrl?: string; fetchFn?: typeof fetch; sessionId?: string; userAgent?: string }) {
    this.apiKey = options.apiKey;
    this.modelName = options.modelName;
    this.provider = options.provider ?? "openai";
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.fetchFn = options.fetchFn ?? fetch;
    this.sessionId = options.sessionId;
    this.userAgent = options.userAgent ?? "prometheus-intelligence/0.4";
  }

  private async complete(system: string, user: string, schemaName: string, schema: Record<string, unknown>): Promise<unknown> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": this.userAgent,
    };
    if (this.provider === "opencode") headers["x-opencode-session"] = this.sessionId ?? randomUUID();

    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          model: this.modelName,
          temperature: 0,
          max_tokens: this.provider === "opencode" ? 12000 : 4000,
          ...(this.provider === "opencode" ? { reasoning_effort: "low" } : {}),
          response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        }),
      });
    } catch {
      throw new IntelligenceError({ stage: "provider", code: "NETWORK_ERROR", message: "Unable to reach the configured AI provider." });
    }

    if (!response.ok) {
      const rawBody = await response.text().catch(() => "");
      let parsed: OpenAIResponse = {};
      try { parsed = JSON.parse(rawBody) as OpenAIResponse; } catch { /* use a safe status-only diagnostic */ }
      throw providerError(response.status, parsed, rawBody, this.apiKey, this.provider);
    }

    let payload: OpenAIResponse;
    try {
      payload = (await response.json()) as OpenAIResponse;
    } catch {
      throw new IntelligenceError({ stage: "parse", code: "INVALID_PROVIDER_ENVELOPE", providerStatus: response.status, message: "The provider returned a malformed response envelope." });
    }
    return parseModelJson(payload.choices?.[0]?.message?.content, payload.choices?.[0]?.finish_reason);
  }

  async analyzeRepository(input: RepositoryAnalysisInput) {
    return groundRepositoryAnalysisOutput(validateRepositoryAnalysisOutput(await this.complete(REPOSITORY_ANALYSIS_SYSTEM_PROMPT, repositoryAnalysisPrompt(input), "repository_analysis", REPOSITORY_ANALYSIS_JSON_SCHEMA)), input);
  }

  async summarizeDeveloper(input: DeveloperSummaryInput) {
    return validateDeveloperSummaryOutput(await this.complete(DEVELOPER_SUMMARY_SYSTEM_PROMPT, developerSummaryPrompt(input), "developer_summary", DEVELOPER_SUMMARY_JSON_SCHEMA));
  }
}

export function createConfiguredIntelligenceModel(env: Record<string, string | undefined> = process.env): IntelligenceModel | null {
  const apiKey = env.AI_API_KEY ?? env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const provider = env.AI_PROVIDER ?? "openai";
  if (provider !== "openai" && provider !== "opencode") throw new Error("Unsupported AI provider.");
  const defaultBaseUrl = provider === "opencode" ? "https://opencode.ai/zen/v1" : "https://api.openai.com/v1";
  return new OpenAIIntelligenceModel({ apiKey, provider, modelName: env.AI_MODEL ?? env.OPENAI_MODEL ?? (provider === "opencode" ? "deepseek-v4.1-flash" : "gpt-4.1-mini"), baseUrl: env.AI_BASE_URL ?? env.OPENAI_BASE_URL ?? defaultBaseUrl });
}
