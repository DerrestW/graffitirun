import { NextResponse } from "next/server";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import { connectFacebookPage } from "@/lib/integrations/meta";

export async function POST(request: Request) {
  try {
    await requirePermission("publishDrafts");
    const body = (await request.json()) as {
      pageId?: string;
      pageName?: string;
      accessToken?: string;
    };

    const pageId = String(body.pageId ?? "").trim();
    const pageName = String(body.pageName ?? "").trim() || "Facebook Page";
    const accessToken = String(body.accessToken ?? "").trim();

    if (!pageId || !accessToken) {
      return NextResponse.json({ ok: false, error: "Page ID and access token are required." }, { status: 400 });
    }

    await connectFacebookPage({
      id: pageId,
      name: pageName,
      accessToken,
      tasks: ["MANAGE", "ANALYZE", "CREATE_CONTENT"],
      source: "oauth",
    });

    return NextResponse.json({ ok: true, status: "facebook_connected" });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ ok: false, error: "Unauthorized", status: "unauthorized" }, { status: 403 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save Facebook token.",
      },
      { status: 500 },
    );
  }
}
