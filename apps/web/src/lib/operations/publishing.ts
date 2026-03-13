import "server-only";

import { requirePermission } from "@/lib/authz";
import { getPublishingAdapter } from "@/lib/integrations/publishing-adapters";
import {
  fetchFacebookPostInsights,
  getMetaIntegrationStatus,
  publishPhotoToFacebookPage,
  resolveMetaConnection,
  type MetaConnection,
} from "@/lib/integrations/meta";
import { mapTemplate, mapTopic } from "@/lib/db/mappers";
import { renderDraftPng } from "@/lib/rendering/image-renderer";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/db/queries";
import type { Database } from "@/lib/db/database.types";
import type { Draft, Template, Topic } from "@/lib/domain";

const preferMockPublishing = process.env.NODE_ENV === "development";

export async function runPublishJob(jobId: string) {
  await requirePermission("publishDrafts");
  const [workspace, supabase] = await Promise.all([getWorkspaceContext(), Promise.resolve(createAdminSupabaseClient())]);
  const meta = getMetaIntegrationStatus();

  if ((preferMockPublishing && !meta.publishingReady) || !supabase) {
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

  const [draftResult, captionsResult] = await Promise.all([
    supabase.from("drafts").select("*").eq("workspace_id", workspace.workspaceId).eq("id", job.draft_id).maybeSingle(),
    supabase.from("captions").select("*").eq("workspace_id", workspace.workspaceId).eq("draft_id", job.draft_id),
  ]);
  const draftRow = draftResult.data as Database["public"]["Tables"]["drafts"]["Row"] | null;
  const captionRows = (captionsResult.data ?? []) as Database["public"]["Tables"]["captions"]["Row"][];

  if (!draftRow) {
    throw new Error("Draft not found for publish job.");
  }

  const [templateResult, topicResult, topicChecksResult] = await Promise.all([
    draftRow.template_id ? supabase.from("templates").select("*").eq("workspace_id", workspace.workspaceId).eq("id", draftRow.template_id).maybeSingle() : Promise.resolve({ data: null }),
    draftRow.topic_id ? supabase.from("topics").select("*").eq("workspace_id", workspace.workspaceId).eq("id", draftRow.topic_id).maybeSingle() : Promise.resolve({ data: null }),
    draftRow.topic_id ? supabase.from("topic_checks").select("*").eq("workspace_id", workspace.workspaceId).eq("topic_id", draftRow.topic_id) : Promise.resolve({ data: [] }),
  ]);

  const draft = {
    id: draftRow.id,
    workspaceId: draftRow.workspace_id,
    topicId: draftRow.topic_id ?? "",
    templateId: draftRow.template_id ?? "",
    status: draftRow.status,
    selectedHeadline: draftRow.selected_headline ?? "Untitled draft",
    selectedSummary: draftRow.selected_summary ?? "",
    selectedHook: draftRow.selected_hook ?? "",
    renderedAssetPath: draftRow.rendered_asset_path ?? "",
    scheduledFor: draftRow.scheduled_for ?? undefined,
    comments: [],
    versions: [],
    captions: captionRows.map((caption) => ({
      id: caption.id,
      variantName: caption.variant_name,
      captionText: caption.caption_text,
      ctaText: caption.cta_text ?? "",
      hashtagsText: caption.hashtags_text ?? "",
    })),
  };
  const templateRow = templateResult.data as Database["public"]["Tables"]["templates"]["Row"] | null;
  const topicRow = topicResult.data as Database["public"]["Tables"]["topics"]["Row"] | null;
  const topicChecks = (topicChecksResult.data ?? []) as Database["public"]["Tables"]["topic_checks"]["Row"][];
  const template = templateRow ? mapTemplate(templateRow) : null;
  const topic = topicRow ? mapTopic(topicRow, topicChecks) : buildFallbackTopic(draft);

  if (!template || !topic) {
    throw new Error("Draft publish inputs are incomplete.");
  }

  await supabase
    .from("publish_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      error_message: null,
    } as never)
    .eq("id", job.id);

  const channelResult =
    job.channel_id !== null
      ? await supabase.from("publishing_channels").select("*").eq("workspace_id", workspace.workspaceId).eq("id", job.channel_id).maybeSingle()
      : { data: null };
  const channel = channelResult.data as Database["public"]["Tables"]["publishing_channels"]["Row"] | null;
  const facebookConnection =
    (channel?.channel_type ?? "facebook_page") === "facebook_page" ? (await resolveMetaConnection()) ?? getChannelMetaConnection(channel) : null;
  const result =
    (channel?.channel_type ?? "facebook_page") === "facebook_page" && meta.publishingReady
      ? await publishDraftToFacebook({
          draft,
          template,
          topic,
          connection: facebookConnection,
        })
      : await getPublishingAdapter(channel?.channel_type ?? "facebook_page").publish(draft);
  const completedAt = new Date().toISOString();

  await supabase
    .from("publish_jobs")
    .update({
      status: result.accepted ? "succeeded" : "failed",
      completed_at: completedAt,
      response_json: {
        connector: channel?.channel_type ?? "facebook_page",
        channelType: channel?.channel_type ?? "facebook_page",
        message: result.message,
        externalPostId: result.externalPostId ?? null,
        externalUrl: "externalUrl" in result ? result.externalUrl ?? null : null,
        publishResponse: "publishResponse" in result ? result.publishResponse ?? null : null,
        insightsResponse: "insightsResponse" in result ? result.insightsResponse ?? null : null,
      },
      error_message: result.accepted ? null : result.message,
    } as never)
    .eq("id", job.id);

  if (result.accepted) {
    const publishedPostResult = await supabase
      .from("published_posts")
      .insert({
        workspace_id: workspace.workspaceId,
        draft_id: draft.id,
        channel_id: job.channel_id,
        external_post_id: result.externalPostId ?? `stub_${job.id}`,
        external_url: "externalUrl" in result ? result.externalUrl ?? `https://facebook.com/${result.externalPostId ?? job.id}` : `https://facebook.com/stub/${result.externalPostId ?? job.id}`,
        published_at: completedAt,
      } as never)
      .select("id")
      .single();
    const publishedPostRow = publishedPostResult.data as { id: string } | null;
    const publishedPostId = publishedPostRow?.id;

    await supabase
      .from("drafts")
      .update({ status: "published", published_post_id: publishedPostId ?? null } as never)
      .eq("id", draft.id)
      .eq("workspace_id", workspace.workspaceId);

    if ("insights" in result && result.insights && publishedPostId) {
      const insights = result.insights as {
        impressions: number;
        reach: number;
        clicks: number;
        reactions: number;
        comments: number;
        shares: number;
        estimatedEarnings: number;
      };
      await supabase.from("performance_metrics").insert({
        workspace_id: workspace.workspaceId,
        published_post_id: publishedPostId,
        metric_date: completedAt.slice(0, 10),
        impressions: insights.impressions,
        reach: insights.reach,
        clicks: insights.clicks,
        reactions: insights.reactions,
        comments: insights.comments,
        shares: insights.shares,
        saves: 0,
        estimated_earnings: insights.estimatedEarnings,
      } as never);
    }

    await supabase.from("approval_logs").insert({
      workspace_id: workspace.workspaceId,
      draft_id: draft.id,
      action: "published",
      actor_user_id: workspace.currentUser.id,
      notes: result.message,
    } as never);
  }

  return result;
}

async function publishDraftToFacebook({
  draft,
  template,
  topic,
  connection,
}: {
  draft: Draft;
  template: Template;
  topic: Topic;
  connection?: MetaConnection | null;
}) {
  const image = await renderDraftPng({ draft, template, topic });
  const caption = [draft.captions[0]?.captionText ?? draft.selectedSummary, draft.captions[0]?.ctaText, draft.captions[0]?.hashtagsText]
    .filter(Boolean)
    .join("\n\n");
  const publishResult = await publishPhotoToFacebookPage({
    caption,
    image,
    fileName: `${draft.id}.png`,
    connection,
  });

  let insights:
    | {
        impressions: number;
        reach: number;
        clicks: number;
        reactions: number;
        comments: number;
        shares: number;
        estimatedEarnings: number;
      }
    | undefined;
  let insightsResponse: unknown = null;

  const insightTargetId = publishResult.postId ?? publishResult.id;
  try {
    const insightResult = await fetchFacebookPostInsights(insightTargetId, connection);
    insights = {
      impressions: insightResult.impressions,
      reach: insightResult.reach,
      clicks: insightResult.clicks,
      reactions: insightResult.reactions,
      comments: insightResult.comments,
      shares: insightResult.shares,
      estimatedEarnings: insightResult.estimatedEarnings,
    };
    insightsResponse = insightResult.raw;
  } catch (error) {
    insightsResponse = { error: error instanceof Error ? error.message : "Insights sync failed." };
  }

  return {
    accepted: true,
    externalPostId: publishResult.postId ?? publishResult.id,
    externalUrl: publishResult.permalinkUrl,
    message: publishResult.permalinkUrl
      ? `Published to Facebook successfully. ${publishResult.permalinkUrl}`
      : "Published to Facebook successfully.",
    publishResponse: publishResult.raw,
    insightsResponse,
    insights,
  };
}

function getChannelMetaConnection(channel: Database["public"]["Tables"]["publishing_channels"]["Row"] | null): MetaConnection | null {
  if (!channel?.access_token_encrypted || !channel.channel_metadata_json || typeof channel.channel_metadata_json !== "object" || Array.isArray(channel.channel_metadata_json)) {
    return null;
  }

  const metadata = channel.channel_metadata_json as Record<string, unknown>;
  const pageId = typeof metadata.page_id === "string" ? metadata.page_id : "";
  const pageName = typeof metadata.page_name === "string" ? metadata.page_name : channel.display_name;

  if (!pageId) {
    return null;
  }

  return {
    pageId,
    pageName,
    accessToken: channel.access_token_encrypted,
    source: "channel",
  };
}

function buildFallbackTopic(draft: Draft) {
  return {
    id: draft.topicId,
    workspaceId: draft.workspaceId,
    title: draft.selectedHeadline,
    summary: draft.selectedSummary,
    category: "archived",
    sourceUrl: "",
    sourceDomain: "saved-draft",
    publishedAt: draft.scheduledFor ?? new Date().toISOString(),
    imageUrl: "",
    insetImageUrl: "",
    status: "drafted" as const,
    scores: {
      freshness: 0,
      viral: 0,
      brandFit: 0,
      rightsRisk: 0,
      tragedyRisk: 0,
      politicalRisk: 0,
      duplicateRisk: 0,
      final: 0,
    },
    safetyNotes: ["Historical draft loaded without an active topic queue entry."],
    rightsNotes: ["Replace or upload a fresh image before publish if the original asset is unavailable."],
  };
}
