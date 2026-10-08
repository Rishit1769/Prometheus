"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalyzeDeveloperButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function analyze() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/developer/analyze", { method: "POST" });
      const body = await response.json().catch(() => null) as {
        repositoriesAnalyzed?: number;
        repositoriesReused?: number;
        repositoriesFailed?: number;
        status?: string;
        diagnostics?: { stage?: string; code?: string; providerStatus?: number | null; message?: string; validationIssuePaths?: string[] };
        error?: { message?: string; diagnostic?: { summary?: string } };
      } | null;
      if (!response.ok) {
        setMessage(body?.error?.diagnostic?.summary ?? body?.error?.message ?? "Developer intelligence analysis failed.");
        if (response.status === 502) router.refresh();
        return;
      }
      if (body?.status === "EMPTY") {
        setMessage("No eligible public repositories are available to analyze.");
      } else {
        const failed = body?.repositoriesFailed ?? 0;
        const diagnostic = body?.diagnostics;
        const details = diagnostic
          ? ` First failure: ${diagnostic.stage}/${diagnostic.code}${diagnostic.providerStatus ? ` (HTTP ${diagnostic.providerStatus})` : ""}${diagnostic.validationIssuePaths?.length ? ` at ${diagnostic.validationIssuePaths.join(", ")}` : ""}. ${diagnostic.message ?? ""}`
          : "";
        setMessage(`Analyzed ${body?.repositoriesAnalyzed ?? 0} repositories; reused ${body?.repositoriesReused ?? 0}.${failed ? ` ${failed} failed; coverage is partial.` : ""}${details}`);
        router.refresh();
      }
    } catch {
      setMessage("Unable to reach the analysis endpoint.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="flex flex-col items-end gap-2"><button className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50" disabled={busy} onClick={analyze} type="button">{busy ? "Analyzing…" : "Analyze Developer"}</button>{message ? <p aria-live="polite" className="max-w-md text-right text-sm text-slate-600">{message}</p> : null}</div>;
}
