"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthButtonProps = {
  signedIn: boolean;
};

export function AuthButton({ signedIn }: AuthButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      router.push("/login");
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!signedIn) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-white"
    >
      Sign out
    </button>
  );
}
