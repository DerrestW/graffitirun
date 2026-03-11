import "server-only";

import { requirePermission } from "@/lib/authz";
import { getPublishingAdapter } from "@/lib/integrations/publishing-adapters";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getDraftById, getWorkspaceContext } from "@/lib/db/queries";
import type { Database } from "@/lib/db/database.types";

export async function runPublishJob(jobId: string) {
  await requirePermission("publishDrafts");
  const [workspace, supabase] = await Promise.all([getWorkspaceContext(), Promise.resolve(createAdminSupabaseClient())]);

  if (!supabase) {
    return {
      accepted: true,
      message: "Local mock mode executed publish job without persistence.",
    };
  }

  const jobResult = await supabase
    .from("publish_jobs")
    .select("*")
    .eq("workspace_id", workspace.workspaceId)
    .eq("id", jobId)
    .maybeSingle();
  const job = jobResult.data as Database["public"]["Tables"]["publish_jobs"]["Row"] | null;

  if (!job) {
    throw new Error("Publish job not found.");
  }

  const draft = await getDraftById(job.draft_id);
  if (!draft) {
    throw new Error("Draft not found for publish job.");
  }

  await supabase
    .from("publish_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", job.id);

  const channelResult =
    job.channel_id !== null
      ? await supabase.from("publishing_channels").select("*").eq("workspace_id", workspace.workspaceId).eq("id", job.channel_id).maybeSingle()
      : { data: null };
  const channel = channelResult.data as Database["public"]["Tables"]["publishing_channels"]["Row"] | null;
  const adapter = getPublishingAdapter(channel?.channel_type ?? "facebook_page");
  const result = await adapter.publish(draft);
  const completedAt = new Date().toISOString();

  await supabase
    .from("publish_jobs")
    .update({
      status: result.accepted ? "succeeded" : "failed",
      completed_at: completedAt,
      response_json: {
        connector: "facebook_page",
        channelType: channel?.channel_type ?? "facebook_page",
        message: result.message,
        externalPostId: result.externalPostId ?? null,
      },
      error_message: result.accepted ? null : result.message,
    })
    .eq("id", job.id);

  if (result.accepted) {
    await supabase.from("drafts").update({ status: "published" }).eq("id", draft.id).eq("workspace_id", workspace.workspaceId);
    await supabase.from("published_posts").insert({
      workspace_id: workspace.workspaceId,
      draft_id: draft.id,
      channel_id: job.channel_id,
      external_post_id: result.externalPostId ?? `stub_${job.id}`,
      external_url: `https://facebook.com/stub/${result.externalPostId ?? job.id}`,
      published_at: completedAt,
    });
    await supabase.from("approval_logs").insert({
      workspace_id: workspace.workspaceId,
      draft_id: draft.id,
      action: "published",
      actor_user_id: workspace.currentUser.id,
      notes: result.message,
    });
  }

  return result;
}
