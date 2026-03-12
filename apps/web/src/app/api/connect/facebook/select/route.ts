import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectFacebookPage, getPublicAppOrigin, type MetaPageOption } from "@/lib/integrations/meta";

export async function POST(request: Request) {
  const formData = await request.formData();
  const pageId = String(formData.get("pageId") ?? "");
  const origin = getPublicAppOrigin(request.url);
  const cookieStore = await cookies();
  const encodedPages = cookieStore.get("gr_fb_pages")?.value;

  if (!pageId || !encodedPages) {
    return NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_pick_page`);
  }

  try {
    const pages = decodePagesCookie(encodedPages);
    const page = pages.find((item) => item.id === pageId);

    if (!page) {
      return NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_pick_page`);
    }

    await connectFacebookPage(page);
    const response = NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_connected`);
    response.cookies.delete("gr_fb_pages");
    return response;
  } catch {
    return NextResponse.redirect(`${origin}/settings/connections?connector=facebook&status=facebook_oauth_failed`);
  }
}

function decodePagesCookie(value: string): MetaPageOption[] {
  const raw = Buffer.from(value, "base64url").toString("utf8");
  const parsed = JSON.parse(raw) as MetaPageOption[];
  return Array.isArray(parsed) ? parsed : [];
}
