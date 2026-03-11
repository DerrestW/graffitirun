import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { currentWorkspace } from "@/lib/workspace";

export type AppAuthState = {
  signedIn: boolean;
  provider: "supabase" | "mock";
  user: {
    id: string;
    email: string;
    fullName: string;
  };
};

export const getAuthState = cache(async (): Promise<AppAuthState> => {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      signedIn: true,
      provider: "mock",
      user: {
        id: currentWorkspace.currentUser.id,
        email: currentWorkspace.currentUser.email,
        fullName: currentWorkspace.currentUser.fullName,
      },
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      signedIn: false,
      provider: "supabase",
      user: {
        id: "",
        email: "",
        fullName: "",
      },
    };
  }

  return {
    signedIn: true,
    provider: "supabase",
    user: mapSupabaseUser(user),
  };
});

function mapSupabaseUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? "",
    fullName:
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : user.email ?? "Workspace User",
  };
}
