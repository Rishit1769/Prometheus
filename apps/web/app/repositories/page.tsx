import Link from "next/link";
import { auth } from "@/lib/auth";
import { signIn } from "@/lib/auth";
import { getLatestSyncForUser, listRepositoriesForUser } from "@/lib/github/queries";
import { SyncRepositoriesButton } from "./sync-repositories-button";
import { SyncReadmesButton } from "./sync-readmes-button";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  return new Date(value).toISOString().slice(0, 10);
}

function syncSummary(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "Last synchronization succeeded.";
    case "PARTIAL":
      return "Last synchronization completed with some issues.";
    case "FAILED":
      return "Last synchronization failed.";
    case "RATE_LIMITED":
      return "Last synchronization stopped because the GitHub rate limit was reached.";
    default:
      return "Never synchronized.";
  }
}

export default async function RepositoriesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">GitHub Repositories</h1>
        <p className="mt-4 text-slate-600">
          Sign in with GitHub to synchronize your public repositories.
        </p>
        <Link className="mt-6 text-indigo-600 hover:underline" href="/">
          Return home
        </Link>
      </main>
    );
  }

  const [repositories, latestSync] = await Promise.all([
    listRepositoriesForUser(userId),
    getLatestSyncForUser(userId),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
      <Link className="text-sm text-indigo-600 hover:underline" href="/">
        ← PROMETHEUS
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">GitHub Repositories</h1>
      <p className="mt-2 text-slate-600">
        Last synchronized: {latestSync ? formatDate(latestSync.completedAt ?? latestSync.startedAt) : "Never"}
      </p>
      <form action={async () => { "use server"; await signIn("github", { redirectTo: "/repositories" }); }} className="mt-3">
        <button className="text-sm text-indigo-600 hover:underline" type="submit">Reconnect GitHub</button>
      </form>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{syncSummary(latestSync?.status ?? "")}</p>
            <p className="mt-1 text-2xl font-semibold">Repositories: {repositories.length}</p>
            {latestSync?.errorMessage ? (
              <p className="mt-2 max-w-xl text-sm text-amber-700">{latestSync.errorMessage}</p>
            ) : null}
          </div>
          <SyncRepositoriesButton />
          <SyncReadmesButton />
        </div>
      </section>

      {repositories.length === 0 ? (
        <p className="mt-8 text-slate-600">No public repositories have been synchronized yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {repositories.map((repository) => (
            <li key={repository.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
              <div className="min-w-0">
                <a className="font-medium text-indigo-600 hover:underline" href={repository.url}>
                  {repository.fullName}
                </a>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {repository.description ?? "No description"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
                {repository.isFork ? <span className="rounded bg-slate-100 px-2 py-0.5">fork</span> : null}
                {repository.isArchived ? <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">archived</span> : null}
                {repository.isTemplate ? <span className="rounded bg-slate-100 px-2 py-0.5">template</span> : null}
                <span>{repository.primaryLanguage ?? "Unknown"}</span>
                <span>·</span>
                <span>README: {repository.readmeEvidence?.status ?? "Not synced"}</span>
                <span>·</span>
                <span>Updated {formatDate(repository.githubUpdatedAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
