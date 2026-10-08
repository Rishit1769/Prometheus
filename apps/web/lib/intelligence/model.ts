import { developerSummaryPrompt, DEVELOPER_SUMMARY_SYSTEM_PROMPT } from "./prompts/developer-aggregation-v1";
import { repositoryAnalysisPrompt, REPOSITORY_ANALYSIS_SYSTEM_PROMPT } from "./prompts/repository-analysis-v1";
import type { DeveloperSummaryInput, IntelligenceModel, RepositoryAnalysisInput } from "./types";
import { groundRepositoryAnalysisOutput, validateDeveloperSummaryOutput, validateRepositoryAnalysisOutput } from "./validate";

type OpenAIResponse = { choices?: { message?: { content?: string | null } }[] };

function parseModelJson(content: string | null | undefined): unknown {
  if (!content) throw new Error("Model returned no structured output.");
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Model returned invalid structured output.");
  }
}

export class OpenAIIntelligenceModel implements IntelligenceModel {
  readonly provider: string;
  readonly modelName: string;
  readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: { apiKey: string; modelName: string; provider?: string; baseUrl?: string; fetchFn?: typeof fetch }) {
    this.apiKey = options.apiKey;
    this.modelName = options.modelName;
    this.provider = options.provider ?? "openai";
    this.baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.fetchFn = options.fetchFn ?? fetch;
  }

  private async complete(system: string, user: string): Promise<unknown> {
    const response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          model: this.modelName,
          temperature: 0,
          max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!response.ok) throw new Error("Intelligence model request failed.");
    const payload = (await response.json()) as OpenAIResponse;
    return parseModelJson(payload.choices?.[0]?.message?.content);
  }

  async analyzeRepository(input: RepositoryAnalysisInput) {
    return groundRepositoryAnalysisOutput(validateRepositoryAnalysisOutput(await this.complete(REPOSITORY_ANALYSIS_SYSTEM_PROMPT, repositoryAnalysisPrompt(input))), input);
  }

  async summarizeDeveloper(input: DeveloperSummaryInput) {
    return validateDeveloperSummaryOutput(await this.complete(DEVELOPER_SUMMARY_SYSTEM_PROMPT, developerSummaryPrompt(input)));
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
