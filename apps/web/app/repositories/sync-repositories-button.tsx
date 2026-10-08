"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Tone = "success" | "partial" | "error";
type State =
  | { phase: "idle" }
  | { phase: "syncing" }
  | { phase: "done"; message: string; tone: Tone }
  | { phase: "error"; message: string };

interface SyncResponse {
  repositoriesCreated?: number;
  repositoriesUpdated?: number;
  repositoriesFailed?: number;
  error?: { code?: string; message?: string };
}

export function SyncRepositoriesButton() {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "idle" });

  async function synchronize() {
    setState({ phase: "syncing" });
    try {
      const response = await fetch("/api/github/repositories/sync", { method: "POST" });
      const body = (await response.json().catch(() => null)) as SyncResponse | null;

      if (!response.ok) {
        setState({
          phase: "error",
          message:
            body?.error?.code === "GITHUB_REAUTH_REQUIRED"
              ? "Your GitHub authorization expired or was revoked. Use Reconnect GitHub to continue."
              : body?.error?.message ?? "Repository synchronization failed.",
        });
        return;
      }

      const created = body?.repositoriesCreated ?? 0;
      const updated = body?.repositoriesUpdated ?? 0;
      const failed = body?.repositoriesFailed ?? 0;
      setState({
        phase: "done",
        tone: failed > 0 ? "partial" : "success",
        message:
          failed > 0
            ? `Synchronized ${created} new and ${updated} existing repositories (${failed} incomplete).`
            : `Synchronized ${created} new and ${updated} existing repositories.`,
      });
      router.refresh();
    } catch {
      setState({ phase: "error", message: "Unable to reach the synchronization endpoint." });
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        disabled={state.phase === "syncing"}
        onClick={synchronize}
        type="button"
      >
        {state.phase === "syncing" ? "Synchronizing…" : "Sync repositories"}
      </button>
      {state.phase === "done" ? (
        <p className={`max-w-xs text-right text-sm ${state.tone === "success" ? "text-green-700" : "text-amber-700"}`}>
          {state.message}
        </p>
      ) : null}
      {state.phase === "error" ? (
        <p className="max-w-xs text-right text-sm text-red-700">{state.message}</p>
      ) : null}
    </div>
  );
}
