import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/dashboard";

  const supabase = await createServerSupabaseClient();

  if (supabase) {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      const emailOtpType = mapEmailOtpType(type);
      if (emailOtpType) {
        await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: emailOtpType,
        });
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

function mapEmailOtpType(value: string): "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" | null {
  switch (value) {
    case "signup":
    case "invite":
    case "magiclink":
    case "recovery":
    case "email_change":
    case "email":
      return value;
    default:
      return null;
  }
}
