import { NextResponse } from "next/server";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import { getAuthState } from "@/features/auth/auth-service";
import { updateDraftReviewStatus } from "@/features/drafts/mutations";
import { currentWorkspace } from "@/lib/workspace";

type RouteProps = {
  params: Promise<{ id: string }>;
};

type StatusAction = "approve" | "request_changes" | "reject";

const statusMap: Record<StatusAction, { draftStatus: "approved" | "in_review" | "rejected"; action: "approved" | "requested_changes" | "rejected"; notes: string }> =
  {
    approve: {
      draftStatus: "approved",
      action: "approved",
      notes: "Draft approved for scheduling.",
    },
    request_changes: {
      draftStatus: "in_review",
      action: "requested_changes",
      notes: "Draft returned for edits.",
    },
    reject: {
      draftStatus: "rejected",
      action: "rejected",
      notes: "Draft rejected during review.",
    },
  };

export async function POST(request: Request, { params }: RouteProps) {
  try {
    await requirePermission("approveDrafts");
    const { id } = await params;
    const body = (await request.json()) as { action?: StatusAction };
    const actionKey = body.action;

    if (!actionKey || !(actionKey in statusMap)) {
      return NextResponse.json({ ok: false, error: "A valid action is required." }, { status: 400 });
    }

    const auth = await getAuthState();
    const actorUserId = auth.signedIn ? auth.user.id : currentWorkspace.currentUser.id;
    const config = statusMap[actionKey];
    const result = await updateDraftReviewStatus(id, actorUserId, config.draftStatus, config.action, config.notes);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ ok: false, error: "Unauthorized", status: "unauthorized" }, { status: 403 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown status update error",
      },
      { status: 500 },
    );
  }
}
