export function getAuthEnv(env: Partial<Record<string, string | undefined>> = process.env) {
  const required = ["AUTH_SECRET", "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"] as const;
  const missing = required.filter((key) => !env[key]);
  return { ok: missing.length === 0, missing };
}
