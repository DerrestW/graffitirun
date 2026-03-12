import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildFacebookOauthUrl, getPublicAppOrigin } from "@/lib/integrations/meta";

export async function GET(request: Request) {
  try {
    const origin = getPublicAppOrigin(request.url);
    const state = randomUUID();
    const redirectUrl = buildFacebookOauthUrl({ origin, state });
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("gr_fb_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    const origin = getPublicAppOrigin(request.url);
    return NextResponse.redirect(
      `${origin}/settings/connections?connector=facebook&status=facebook_oauth_failed&error=${encodeURIComponent(
        error instanceof Error ? error.message : "OAuth start failed.",
      )}`,
    );
  }
}
