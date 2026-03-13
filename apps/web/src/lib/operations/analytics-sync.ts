import "server-only";

import { requirePermission } from "@/lib/authz";
import { getWorkspaceContext } from "@/lib/db/queries";
import { fetchFacebookPostInsights, getMetaIntegrationStatus, resolveMetaConnection, type MetaConnection } from "@/lib/integrations/meta";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function syncMetaInsights() {
  await requirePermission("viewAnalytics");
  const [workspace, supabase] = await Promise.all([getWorkspaceContext(), Promise.resolve(createAdminSupabaseClient())]);
  const meta = getMetaIntegrationStatus();

  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  if (!meta.insightsReady) {
    throw new Error("Meta insights are not configured.");
  }

  const publishedPostsResult = await supabase
    .from("published_posts")
    .select("*")
    .eq("workspace_id", workspace.workspaceId)
    .order("published_at", { ascending: false })
    .limit(25);
  const publishedPosts = (publishedPostsResult.data ?? []) as Array<{
    id: string;
    external_post_id: string;
    channel_id: string | null;
  }>;
  const channelIds = [...new Set(publishedPosts.map((post) => post.channel_id).filter(Boolean))] as string[];
  const channelResult =
    channelIds.length > 0 ? await supabase.from("publishing_channels").select("*").in("id", channelIds) : { data: [] };
  const channels = (channelResult.data ?? []) as Array<{
    id: string;
    display_name: string;
    access_token_encrypted: string | null;
    channel_metadata_json: unknown;
  }>;
  const channelMap = new Map(channels.map((channel) => [channel.id, channel]));

  let synced = 0;
  const preferredConnection = await resolveMetaConnection();

  for (const post of publishedPosts) {
    try {
      const connection = preferredConnection ?? (post.channel_id ? getChannelMetaConnection(channelMap.get(post.channel_id) ?? null) : null);
      const insights = await fetchFacebookPostInsights(post.external_post_id, connection);
      const metricDate = new Date().toISOString().slice(0, 10);

      await supabase.from("performance_metrics").delete().eq("published_post_id", post.id).eq("metric_date", metricDate);
      await supabase.from("performance_metrics").insert({
        workspace_id: workspace.workspaceId,
        published_post_id: post.id,
        metric_date: metricDate,
        impressions: insights.impressions,
        reach: insights.reach,
        clicks: insights.clicks,
        reactions: insights.reactions,
        comments: insights.comments,
        shares: insights.shares,
        saves: 0,
        estimated_earnings: insights.estimatedEarnings,
      } as never);
      synced += 1;
    } catch {
      // Continue syncing other posts even if one fails.
    }
  }

  return {
    syncedPosts: synced,
    message: synced > 0 ? `Synced Meta insights for ${synced} published post(s).` : "No published posts could be synced yet.",
  };
}

function getChannelMetaConnection(channel: {
  id: string;
  display_name: string;
  access_token_encrypted: string | null;
  channel_metadata_json: unknown;
} | null): MetaConnection | null {
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
