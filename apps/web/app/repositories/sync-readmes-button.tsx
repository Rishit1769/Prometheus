"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type State = { phase: "idle" } | { phase: "syncing" } | { phase: "done"; message: string } | { phase: "error"; message: string };

export function SyncReadmesButton() {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "idle" });

  async function synchronize() {
    setState({ phase: "syncing" });
    try {
      const response = await fetch("/api/github/readmes/sync", { method: "POST" });
      const body = (await response.json().catch(() => null)) as
        | { created?: number; updated?: number; unchanged?: number; error?: { message?: string } }
        | null;
      if (!response.ok) {
        setState({ phase: "error", message: body?.error?.message ?? "README synchronization failed." });
        return;
      }
      setState({
        phase: "done",
        message: `README evidence: ${body?.created ?? 0} created, ${body?.updated ?? 0} updated, ${body?.unchanged ?? 0} unchanged.`,
      });
      router.refresh();
    } catch {
      setState({ phase: "error", message: "Unable to reach the README synchronization endpoint." });
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        disabled={state.phase === "syncing"}
        onClick={synchronize}
        type="button"
      >
        {state.phase === "syncing" ? "Syncing README evidence…" : "Sync README evidence"}
      </button>
      {state.phase === "done" || state.phase === "error" ? (
        <p className={`max-w-xs text-right text-sm ${state.phase === "done" ? "text-green-700" : "text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
