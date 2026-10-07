import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDeveloperIntelligenceForUser } from "@/lib/github/queries";
import type { DeveloperDomainIntelligence } from "@/lib/intelligence/types";
import { AnalyzeDeveloperButton } from "./analyze-button";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { FRONTEND: "Frontend", BACKEND: "Backend", DATABASE: "Database", AI_ML: "AI / ML", DEVOPS: "DevOps", TESTING: "Testing", SYSTEMS: "Systems", MOBILE: "Mobile" };

export default async function DeveloperPage() {
  const session = await auth();
  if (!session?.user?.id) return <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-3xl font-semibold">Developer Intelligence</h1><p className="mt-4 text-slate-600">Sign in with GitHub to view evidence-backed intelligence.</p><Link className="mt-6 inline-block text-indigo-600 hover:underline" href="/">Return home</Link></main>;
  const intelligence = await getDeveloperIntelligenceForUser(session.user.id);
  const output = intelligence?.output as { domains?: DeveloperDomainIntelligence[] } | null;
  return <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16"><Link className="text-sm text-indigo-600 hover:underline" href="/">← PROMETHEUS</Link><div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Developer Intelligence</h1><p className="mt-2 text-slate-600">Evidence-backed signals from public repository evidence.</p></div><AnalyzeDeveloperButton /></div>{!intelligence ? <p className="mt-10 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No analysis exists yet. Analyze the synchronized repositories to create a capability vector.</p> : <><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Analysis coverage</p><p className="mt-1 text-3xl font-semibold">{intelligence.analyzedRepositories} / {intelligence.eligibleRepositories} repositories</p><p className="mt-2 text-sm text-slate-600">{Math.round(intelligence.coverage * 100)}% coverage · {intelligence.status}</p>{intelligence.profileSummary ? <p className="mt-4 text-slate-700">{intelligence.profileSummary}</p> : null}</section><section className="mt-8"><h2 className="text-xl font-semibold">Engineering Domains</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{(output?.domains ?? []).map((domain) => <article className="rounded-xl border border-slate-200 bg-white p-4" key={domain.domain}><div className="flex items-center justify-between"><h3 className="font-medium">{labels[domain.domain]}</h3><span className="text-sm text-slate-500">{domain.level === 0 ? "NO EVIDENCE" : `LEVEL ${domain.level}`}</span></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${domain.level * 20}%` }} /></div><p className="mt-2 text-sm text-slate-600">{domain.repositoryCount} repositories · {Math.round(domain.confidence * 100)}% confidence</p><p className="mt-2 text-sm text-slate-500">{domain.summary}</p></article>)}</div></section></>}</main>;
}
