import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getAuthState } from "@/features/auth/auth-service";

export default async function LoginPage() {
  const auth = await getAuthState();

  if (auth.signedIn) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface rounded-[2rem] p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Graffiti Run</p>
          <h1 className="mt-4 display-font text-5xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Sign in to the content engine
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
            Supabase auth is now session-aware. Once signed in, workspace membership determines which account context and role you land in.
          </p>
          <LoginForm />
          <p className="mt-5 text-sm text-[color:var(--muted)]">
            In mock mode, the app skips auth and goes straight to the seeded workspace.
          </p>
        </section>
        <section className="surface rounded-[2rem] p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">What changed</p>
          <div className="mt-6 space-y-4 text-sm leading-6 text-[color:var(--ink-soft)]">
            <p>Request-scoped session handling via Supabase SSR helpers.</p>
            <p>User-to-workspace resolution using `workspace_members` instead of a fixed slug assumption.</p>
            <p>Magic-link sign-in and logout flow that is safe for local development.</p>
          </div>
          <div className="mt-8 rounded-[1.5rem] bg-white/80 p-5">
            <p className="text-sm font-medium text-[color:var(--foreground)]">Need setup help?</p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Copy <code>apps/web/.env.example</code> to <code>.env.local</code>, add your Supabase keys, then seed the database before signing in.
            </p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-[color:var(--accent-strong)]">
              Continue in mock mode
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
