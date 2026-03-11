"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Supabase environment keys are missing. Use mock mode or add env values.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Magic link sent. Check your inbox, then continue back into the workspace.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-[color:var(--foreground)]">Work email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@graffitirun.com"
          className="mt-2 w-full rounded-[1.1rem] border border-[color:var(--border)] bg-white/90 px-4 py-3 text-[color:var(--foreground)] outline-none ring-0 placeholder:text-[color:var(--muted)]"
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-[1.1rem] bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:opacity-70"
      >
        {status === "loading" ? "Sending link..." : "Send magic link"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-[color:var(--danger)]" : "text-[color:var(--ink-soft)]"}`}>{message}</p>
      ) : null}
    </form>
  );
}
