import { NextResponse } from "next/server";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import { getAuthState } from "@/features/auth/auth-service";
import { scheduleDraftPublish } from "@/features/drafts/mutations";
import { currentWorkspace } from "@/lib/workspace";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    await requirePermission("publishDrafts");
    const { id } = await params;
    const body = (await request.json()) as { scheduledFor?: string };
    const scheduledFor = String(body.scheduledFor ?? "").trim();

    if (!scheduledFor) {
      return NextResponse.json({ ok: false, error: "scheduledFor is required." }, { status: 400 });
    }

    const auth = await getAuthState();
    const actorUserId = auth.signedIn ? auth.user.id : currentWorkspace.currentUser.id;
    const result = await scheduleDraftPublish(id, actorUserId, scheduledFor);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ ok: false, error: "Unauthorized", status: "unauthorized" }, { status: 403 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown scheduling error",
      },
      { status: 500 },
    );
  }
}
