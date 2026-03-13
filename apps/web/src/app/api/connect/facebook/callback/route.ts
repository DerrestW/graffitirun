import { NextResponse } from "next/server";
import {
  connectFacebookPage,
  exchangeFacebookCodeForUserToken,
  fetchFacebookPageById,
  fetchFacebookPages,
  getMetaIntegrationConfig,
  getPublicAppOrigin,
  type MetaPageOption,
} from "@/lib/integrations/meta";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = getPublicAppOrigin(request.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const storedState = request.headers.get("cookie")?.match(/gr_fb_oauth_state=([^;]+)/)?.[1] ?? "";

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_oauth_failed`);
  }

  try {
    const redirectUri = `${origin}/api/connect/facebook/callback`;
    const userToken = await exchangeFacebookCodeForUserToken({ code, redirectUri });
    const pages = await fetchFacebookPages(userToken);
    const fallbackConfig = getMetaIntegrationConfig();
    const fallbackPageId = fallbackConfig.pageId;
    const resolvedPages =
      pages.length > 0
        ? pages
        : fallbackPageId
          ? [await fetchFacebookPageById(fallbackPageId, userToken)].filter((page): page is MetaPageOption => Boolean(page))
          : [];
    const envBackedPages =
      resolvedPages.length > 0
        ? resolvedPages
        : fallbackConfig.pageId && fallbackConfig.accessToken
          ? [
              {
                id: fallbackConfig.pageId,
                name: "Configured Facebook Page",
                accessToken: fallbackConfig.accessToken,
                tasks: ["MANAGE", "ANALYZE", "CREATE_CONTENT"],
              },
            ]
          : [];

    if (envBackedPages.length === 0) {
      const response = NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_no_pages`);
      response.cookies.delete("gr_fb_oauth_state");
      return response;
    }

    if (envBackedPages.length === 1) {
      await connectFacebookPage(envBackedPages[0]);
      const response = NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_connected`);
      response.cookies.delete("gr_fb_oauth_state");
      response.cookies.delete("gr_fb_pages");
      return response;
    }

    const response = NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_pick_page`);
    response.cookies.set("gr_fb_pages", encodePagesCookie(envBackedPages), {
      httpOnly: true,
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      path: "/",
      maxAge: 60 * 15,
    });
    response.cookies.delete("gr_fb_oauth_state");
    return response;
  } catch {
    const response = NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_oauth_failed`);
    response.cookies.delete("gr_fb_oauth_state");
    return response;
  }
}

function encodePagesCookie(pages: MetaPageOption[]) {
  return Buffer.from(JSON.stringify(pages), "utf8").toString("base64url");
}
