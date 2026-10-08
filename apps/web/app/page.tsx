import { auth, signIn, signOut } from "@/lib/auth";
import Image from "next/image";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">PROMETHEUS</p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">Intelligence should inherit intelligence.</h1>
      {!user ? (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Developer identity</h2>
          <p className="mt-2 text-slate-600">Sign in with GitHub to create your PROMETHEUS identity.</p>
          <form action={async () => { "use server"; await signIn("github"); }} className="mt-6">
            <button className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700" type="submit">Continue with GitHub</button>
          </form>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4">
            {user.image ? <Image className="h-16 w-16 rounded-full" src={user.image} width={64} height={64} alt="" unoptimized /> : null}
            <div><h2 className="text-xl font-semibold">{user.name ?? "GitHub developer"}</h2><p className="text-slate-600">Authenticated developer</p></div>
          </div>
          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="font-medium text-slate-500">Email</dt><dd className="mt-1">{user.email ?? "Not provided"}</dd></div>
            <div><dt className="font-medium text-slate-500">GitHub username</dt><dd className="mt-1">{user.githubUsername ?? "Not available"}</dd></div>
            <div><dt className="font-medium text-slate-500">GitHub profile</dt><dd className="mt-1">{user.githubProfileUrl ? <a className="text-indigo-600 hover:underline" href={user.githubProfileUrl}>Open profile</a> : "Not available"}</dd></div>
          </dl>
          <form action={async () => { "use server"; await signOut(); }} className="mt-8"><button className="rounded-lg border border-slate-300 px-5 py-3 font-medium hover:bg-slate-50" type="submit">Log out</button></form>
          <form action={async () => { "use server"; await signIn("github", { redirectTo: "/" }); }} className="mt-3"><button className="text-sm text-indigo-600 hover:underline" type="submit">Reconnect GitHub</button></form>
        </section>
      )}
    </main>
  );
}
