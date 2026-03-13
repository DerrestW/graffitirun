import { NextResponse } from "next/server";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import { getAuthState } from "@/features/auth/auth-service";
import { scheduleDraftPublish, updateDraftReviewStatus } from "@/features/drafts/mutations";
import { runPublishJob } from "@/lib/operations/publishing";
import { currentWorkspace } from "@/lib/workspace";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    await requirePermission("publishDrafts");
    const { id } = await params;
    const auth = await getAuthState();
    const actorUserId = auth.signedIn ? auth.user.id : currentWorkspace.currentUser.id;

    await updateDraftReviewStatus(id, actorUserId, "approved", "approved", "Draft approved during direct publish.");
    const scheduledFor = new Date().toISOString().slice(0, 16);
    const scheduleResult = await scheduleDraftPublish(id, actorUserId, scheduledFor);
    await runPublishJob(scheduleResult.jobId);

    return NextResponse.json({ ok: true, status: "publish_executed" });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ ok: false, error: "Unauthorized", status: "unauthorized" }, { status: 403 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown publish error",
      },
      { status: 500 },
    );
  }
}
