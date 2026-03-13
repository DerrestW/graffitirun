import "server-only";

import type { Database } from "@/lib/db/database.types";
import { getDraftById, getWorkspaceContext } from "@/lib/db/queries";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { buildDraftStatusUpdate, buildSchedulePublishJobInput } from "@/features/drafts/workflow";

export async function addReviewComment(draftId: string, actorUserId: string, comment: string) {
  const workspace = await getWorkspaceContext();
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return { ok: true, status: "comment_added", mode: "mock" as const };
  }

  await supabase.from("review_comments").insert({
    workspace_id: workspace.workspaceId,
    draft_id: draftId,
    user_id: actorUserId,
    comment,
  } as never);

  await supabase.from("approval_logs").insert({
    workspace_id: workspace.workspaceId,
    draft_id: draftId,
    action: "commented",
    actor_user_id: actorUserId,
    notes: comment,
  } as never);

  return { ok: true, status: "comment_added", mode: "supabase" as const };
}

export async function updateDraftReviewStatus(
  draftId: string,
  actorUserId: string,
  status: Database["public"]["Tables"]["drafts"]["Row"]["status"],
  action: "approved" | "requested_changes" | "rejected",
  notes: string,
) {
  const workspace = await getWorkspaceContext();
  const supabase = createAdminSupabaseClient();
  const statusCode = action === "approved" ? "draft_approved" : action === "requested_changes" ? "changes_requested" : "draft_rejected";

  if (!supabase) {
    return { ok: true, status: statusCode, mode: "mock" as const };
  }

  const updatePayload: Partial<Database["public"]["Tables"]["drafts"]["Row"]> = buildDraftStatusUpdate(status, actorUserId);

  await supabase.from("drafts").update(updatePayload as never).eq("id", draftId).eq("workspace_id", workspace.workspaceId);
  await supabase.from("approval_logs").insert({
    workspace_id: workspace.workspaceId,
    draft_id: draftId,
    action,
    actor_user_id: actorUserId,
    notes,
  } as never);

  return { ok: true, status: statusCode, mode: "supabase" as const };
}

export async function scheduleDraftPublish(draftId: string, actorUserId: string, scheduledFor: string) {
  const [workspace, draft] = await Promise.all([getWorkspaceContext(), getDraftById(draftId)]);
  const supabase = createAdminSupabaseClient();

  if (!supabase || !draft) {
    return { ok: true, status: "publish_queued", mode: "mock" as const, jobId: `mock-${draftId}` };
  }

  const { data: existingJobs } = await supabase
    .from("publish_jobs")
    .select("*")
    .eq("workspace_id", workspace.workspaceId)
    .eq("draft_id", draftId)
    .limit(1);
  const existingJob = (existingJobs as Database["public"]["Tables"]["publish_jobs"]["Row"][] | null)?.[0] ?? null;

  const { data: channels } = await supabase
    .from("publishing_channels")
    .select("*")
    .eq("workspace_id", workspace.workspaceId)
    .order("created_at", { ascending: true })
    .limit(1);
  const channel = (channels as Database["public"]["Tables"]["publishing_channels"]["Row"][] | null)?.[0] ?? null;

  const scheduleInput = buildSchedulePublishJobInput({
    workspaceId: workspace.workspaceId,
    actorUserId,
    draft,
    channelId: channel?.id ?? null,
    scheduledFor,
  });

  await supabase.from("drafts").update(scheduleInput.draftUpdate as never).eq("id", draftId).eq("workspace_id", workspace.workspaceId);

  let jobId = existingJob?.id ?? null;

  if (existingJob) {
    await supabase.from("publish_jobs").update(scheduleInput.publishJob as never).eq("id", existingJob.id);
  } else {
    const inserted = await supabase.from("publish_jobs").insert(scheduleInput.publishJob as never).select("id").single();
    const insertedRow = inserted.data as { id: string } | null;
    jobId = insertedRow?.id ?? null;
  }

  await supabase.from("approval_logs").insert({
    workspace_id: workspace.workspaceId,
    draft_id: draftId,
    action: "scheduled",
    actor_user_id: actorUserId,
    notes: scheduleInput.approvalLogNote,
  } as never);

  return { ok: true, status: "publish_queued", mode: "supabase" as const, jobId: jobId ?? `draft-${draftId}` };
}
