import type {
  AnalyticsSnapshot,
  CaptionVariant,
  Draft,
  DraftVersion,
  PublishJob,
  Template,
  Topic,
  WorkspaceContext,
} from "@/lib/domain";
import type { Database, Json } from "@/lib/db/database.types";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type WorkspaceSettingsRow = Database["public"]["Tables"]["workspace_settings"]["Row"];
type WorkspaceMemberRow = Database["public"]["Tables"]["workspace_members"]["Row"];
type TopicRow = Database["public"]["Tables"]["topics"]["Row"];
type TopicCheckRow = Database["public"]["Tables"]["topic_checks"]["Row"];
type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
type DraftRow = Database["public"]["Tables"]["drafts"]["Row"];
type DraftVersionRow = Database["public"]["Tables"]["draft_versions"]["Row"];
type CaptionRow = Database["public"]["Tables"]["captions"]["Row"];
type ReviewCommentRow = Database["public"]["Tables"]["review_comments"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type PublishJobRow = Database["public"]["Tables"]["publish_jobs"]["Row"];
type PublishingChannelRow = Database["public"]["Tables"]["publishing_channels"]["Row"];
type PerformanceMetricRow = Database["public"]["Tables"]["performance_metrics"]["Row"];

function getStringArray(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function getTemplateConfigValue(value: Json, key: string, fallback: string | number) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return fallback;
  }

  const raw = value[key];
  return typeof raw === typeof fallback ? raw : fallback;
}

export function mapWorkspace(
  workspace: WorkspaceRow,
  settings: WorkspaceSettingsRow | null,
  member: WorkspaceMemberRow | null,
  user: { id: string; email: string; fullName: string; authProvider: "supabase" | "mock" },
): WorkspaceContext {
  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    role: member?.role ?? "owner",
    timezone: settings?.timezone ?? "America/Chicago",
    approvalRequired: settings?.approval_required ?? true,
    currentUser: user,
  };
}

export function mapTopic(row: TopicRow, checks: TopicCheckRow[]): Topic {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    summary: row.summary ?? "Topic summary pending.",
    category: row.category ?? "uncategorized",
    sourceUrl: row.source_url ?? "",
    sourceDomain: row.source_domain ?? "unknown",
    publishedAt: row.published_at_source ?? row.created_at,
    imageUrl: row.image_url ?? "",
    status: row.status,
    scores: {
      freshness: row.freshness_score,
      viral: row.viral_score,
      brandFit: row.brand_fit_score,
      rightsRisk: row.rights_risk_score,
      tragedyRisk: row.tragedy_risk_score,
      politicalRisk: row.political_risk_score,
      duplicateRisk: row.duplicate_risk_score,
      final: row.final_score,
    },
    safetyNotes: checks.filter((check) => check.check_type.includes("safety")).map((check) => check.notes ?? check.result),
    rightsNotes: checks.filter((check) => check.check_type.includes("rights")).map((check) => check.notes ?? check.result),
  };
}

export function mapTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    templateType: row.template_type,
    width: row.width,
    height: row.height,
    isDefault: row.is_default,
    accentColor: String(getTemplateConfigValue(row.config_json, "accentColor", "#ee6c4d")),
    headlineLimit: Number(getTemplateConfigValue(row.config_json, "headlineLimit", 48)),
    notes: String(getTemplateConfigValue(row.config_json, "notes", "Workspace-scoped template.")),
  };
}

export function mapCaption(row: CaptionRow): CaptionVariant {
  return {
    id: row.id,
    variantName: row.variant_name,
    captionText: row.caption_text,
    ctaText: row.cta_text ?? "",
    hashtagsText: row.hashtags_text ?? "",
  };
}

export function mapDraftVersion(row: DraftVersionRow): DraftVersion {
  return {
    versionNumber: row.version_number,
    headline: row.headline,
    summary: row.summary ?? "",
    hookFact: row.hook_fact ?? "",
    bodyCopy: row.body_copy ?? "",
  };
}

export function mapDraft(
  row: DraftRow,
  versions: DraftVersionRow[],
  captions: CaptionRow[],
  comments: ReviewCommentRow[],
  users: UserRow[],
): Draft {
  const userMap = new Map(users.map((user) => [user.id, user]));

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    topicId: row.topic_id ?? "",
    templateId: row.template_id ?? "",
    status: row.status,
    selectedHeadline: row.selected_headline ?? "Untitled draft",
    selectedSummary: row.selected_summary ?? "Summary pending.",
    selectedHook: row.selected_hook ?? "Hook pending.",
    renderedAssetPath: row.rendered_asset_path ?? "",
    scheduledFor: row.scheduled_for ?? undefined,
    versions: versions.sort((a, b) => a.version_number - b.version_number).map(mapDraftVersion),
    captions: captions.map(mapCaption),
    comments: comments.map((comment) => ({
      id: comment.id,
      author: userMap.get(comment.user_id)?.full_name ?? userMap.get(comment.user_id)?.email ?? comment.user_id,
      body: comment.comment,
      createdAt: comment.created_at,
    })),
  };
}

export function mapPublishJob(row: PublishJobRow, channel: PublishingChannelRow | null): PublishJob {
  const status = row.status === "canceled" ? "failed" : row.status;

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    draftId: row.draft_id,
    channelName: channel?.display_name ?? "Publishing Channel",
    status,
    scheduledFor: row.scheduled_for ?? row.created_at,
    errorMessage: row.error_message ?? undefined,
  };
}

export function mapAnalytics(metrics: PerformanceMetricRow[]): AnalyticsSnapshot {
  const totalPosts = new Set(metrics.map((metric) => metric.published_post_id)).size;
  const totals = metrics.reduce(
    (accumulator, metric) => {
      accumulator.reach += metric.reach;
      accumulator.shares += metric.shares;
      accumulator.engagement += metric.reactions + metric.comments + metric.shares + metric.saves + metric.clicks;
      accumulator.impressions += metric.impressions;
      accumulator.earnings += metric.estimated_earnings;
      return accumulator;
    },
    { reach: 0, shares: 0, engagement: 0, impressions: 0, earnings: 0 },
  );

  return {
    postsPublished: totalPosts,
    avgReach: totalPosts ? Math.round(totals.reach / totalPosts) : 0,
    avgEngagementRate: totals.impressions ? Number(((totals.engagement / totals.impressions) * 100).toFixed(1)) : 0,
    avgShares: totalPosts ? Math.round(totals.shares / totalPosts) : 0,
    estimatedEarnings: Number(totals.earnings.toFixed(2)),
    recentDelta: "Live sync pending comparison window",
    categoryPerformance: [],
    templatePerformance: [],
    postingWindows: [],
  };
}

export function getBlockedCategories(settings: WorkspaceSettingsRow | null) {
  return getStringArray(settings?.blocked_categories_json ?? []);
}
