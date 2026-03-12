import "server-only";

import type { Database } from "@/lib/db/database.types";
import type { AnalyticsSnapshot, Draft, PublishJob, Template, Topic, WorkspaceContext } from "@/lib/domain";
import { getAuthState } from "@/features/auth/auth-service";
import { analyticsSnapshot, drafts, publishJobs, templates, topics } from "@/lib/mock-data";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import {
  getBlockedCategories,
  mapAnalytics,
  mapDraft,
  mapPublishJob,
  mapTemplate,
  mapTopic,
  mapWorkspace,
} from "@/lib/db/mappers";

const preferMockData = process.env.NODE_ENV === "development";

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  if (preferMockData) {
    const { currentWorkspace } = await import("@/lib/workspace");
    return currentWorkspace;
  }

  const [auth, supabase] = await Promise.all([getAuthState(), Promise.resolve(createAdminSupabaseClient())]);

  if (!supabase || auth.provider === "mock" || !auth.signedIn) {
    const { currentWorkspace } = await import("@/lib/workspace");
    return currentWorkspace;
  }

  const memberResult = await supabase
    .from("workspace_members")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const member = memberResult.data as Database["public"]["Tables"]["workspace_members"]["Row"] | null;

  if (!member) {
    const { currentWorkspace } = await import("@/lib/workspace");
    return currentWorkspace;
  }

  const [workspaceResult, settingsResult] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", member.workspace_id).maybeSingle(),
    supabase.from("workspace_settings").select("*").eq("workspace_id", member.workspace_id).maybeSingle(),
  ]);
  const workspace = workspaceResult.data as Database["public"]["Tables"]["workspaces"]["Row"] | null;
  const settings = settingsResult.data as Database["public"]["Tables"]["workspace_settings"]["Row"] | null;

  if (!workspace) {
    const { currentWorkspace } = await import("@/lib/workspace");
    return currentWorkspace;
  }

  return mapWorkspace(workspace, settings, member, {
    id: auth.user.id,
    email: auth.user.email,
    fullName: auth.user.fullName,
    authProvider: auth.provider,
  });
}

export async function getTopics(): Promise<Topic[]> {
  if (preferMockData) {
    return topics;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return topics;
  }

  const workspace = await getWorkspaceContext();
  const topicResult = await supabase
    .from("topics")
    .select("*")
    .eq("workspace_id", workspace.workspaceId)
    .order("final_score", { ascending: false });
  const topicRows = topicResult.data as Database["public"]["Tables"]["topics"]["Row"][] | null;

  if (!topicRows?.length) {
    return topics;
  }

  const checksResult = await supabase.from("topic_checks").select("*").eq("workspace_id", workspace.workspaceId);
  const checks = checksResult.data as Database["public"]["Tables"]["topic_checks"]["Row"][] | null;
  const groupedChecks = new Map<string, Database["public"]["Tables"]["topic_checks"]["Row"][]>();

  for (const check of checks ?? []) {
    const current = groupedChecks.get(check.topic_id) ?? [];
    current.push(check);
    groupedChecks.set(check.topic_id, current);
  }

  return topicRows.map((row) => mapTopic(row, groupedChecks.get(row.id) ?? []));
}

export async function getTopicById(id: string): Promise<Topic | null> {
  const supabase = createAdminSupabaseClient();

  if (preferMockData && !supabase) {
    return topics.find((topic) => topic.id === id) ?? null;
  }

  if (!supabase) {
    return topics.find((topic) => topic.id === id) ?? null;
  }

  const workspace = await getWorkspaceContext();
  const topicResult = await supabase.from("topics").select("*").eq("workspace_id", workspace.workspaceId).eq("id", id).maybeSingle();
  const row = topicResult.data as Database["public"]["Tables"]["topics"]["Row"] | null;

  if (!row) {
    return topics.find((topic) => topic.id === id) ?? null;
  }

  const checksResult = await supabase.from("topic_checks").select("*").eq("workspace_id", workspace.workspaceId).eq("topic_id", id);
  const checks = checksResult.data as Database["public"]["Tables"]["topic_checks"]["Row"][] | null;

  return mapTopic(row, checks ?? []);
}

export async function getTemplates(): Promise<Template[]> {
  const supabase = createAdminSupabaseClient();

  if (preferMockData && !supabase) {
    return templates;
  }

  if (!supabase) {
    return templates;
  }

  const workspace = await getWorkspaceContext();
  const result = await supabase.from("templates").select("*").eq("workspace_id", workspace.workspaceId).order("is_default", { ascending: false });
  const data = result.data as Database["public"]["Tables"]["templates"]["Row"][] | null;

  return data?.length ? data.map(mapTemplate) : templates;
}

export async function getDrafts(): Promise<Draft[]> {
  const supabase = createAdminSupabaseClient();

  if (preferMockData && !supabase) {
    return drafts;
  }

  if (!supabase) {
    return drafts;
  }

  const workspace = await getWorkspaceContext();
  const draftResult = await supabase.from("drafts").select("*").eq("workspace_id", workspace.workspaceId).order("updated_at", { ascending: false });
  const draftRows = draftResult.data as Database["public"]["Tables"]["drafts"]["Row"][] | null;

  if (!draftRows?.length) {
    return drafts;
  }

  const draftIds = draftRows.map((draft) => draft.id);
  const [versionsResult, captionsResult, commentsResult] = await Promise.all([
    supabase.from("draft_versions").select("*").in("draft_id", draftIds),
    supabase.from("captions").select("*").in("draft_id", draftIds),
    supabase.from("review_comments").select("*").in("draft_id", draftIds),
  ]);
  const versions = versionsResult.data as Database["public"]["Tables"]["draft_versions"]["Row"][] | null;
  const captions = captionsResult.data as Database["public"]["Tables"]["captions"]["Row"][] | null;
  const comments = commentsResult.data as Database["public"]["Tables"]["review_comments"]["Row"][] | null;
  const commentUserIds = [...new Set((comments ?? []).map((comment) => comment.user_id))];
  const usersResult =
    commentUserIds.length > 0 ? await supabase.from("users").select("*").in("id", commentUserIds) : { data: [] };
  const users = usersResult.data as Database["public"]["Tables"]["users"]["Row"][] | null;

  return draftRows.map((row) =>
    mapDraft(
      row,
      (versions ?? []).filter((version) => version.draft_id === row.id),
      (captions ?? []).filter((caption) => caption.draft_id === row.id),
      (comments ?? []).filter((comment) => comment.draft_id === row.id),
      users ?? [],
    ),
  );
}

export async function getDraftById(id: string): Promise<Draft | null> {
  const draftList = await getDrafts();
  return draftList.find((draft) => draft.id === id) ?? null;
}

export async function getPublishJobs(): Promise<PublishJob[]> {
  const supabase = createAdminSupabaseClient();

  if (preferMockData && !supabase) {
    return publishJobs;
  }

  if (!supabase) {
    return publishJobs;
  }

  const workspace = await getWorkspaceContext();
  const [jobResult, channelResult] = await Promise.all([
    supabase.from("publish_jobs").select("*").eq("workspace_id", workspace.workspaceId).order("scheduled_for", { ascending: true }),
    supabase.from("publishing_channels").select("*").eq("workspace_id", workspace.workspaceId),
  ]);
  const jobRows = jobResult.data as Database["public"]["Tables"]["publish_jobs"]["Row"][] | null;
  const channels = channelResult.data as Database["public"]["Tables"]["publishing_channels"]["Row"][] | null;

  if (!jobRows?.length) {
    return publishJobs;
  }

  const channelMap = new Map((channels ?? []).map((channel) => [channel.id, channel]));
  return jobRows.map((row) => mapPublishJob(row, row.channel_id ? channelMap.get(row.channel_id) ?? null : null));
}

export async function getAnalytics(): Promise<AnalyticsSnapshot> {
  const supabase = createAdminSupabaseClient();

  if (preferMockData && !supabase) {
    return analyticsSnapshot;
  }

  if (!supabase) {
    return analyticsSnapshot;
  }

  const workspace = await getWorkspaceContext();
  const metricsResult = await supabase.from("performance_metrics").select("*").eq("workspace_id", workspace.workspaceId);
  const metrics = metricsResult.data as Database["public"]["Tables"]["performance_metrics"]["Row"][] | null;

  if (!metrics?.length) {
    return analyticsSnapshot;
  }

  const liveAnalytics = mapAnalytics(metrics);
  if (!liveAnalytics.categoryPerformance.length) {
    return {
      ...analyticsSnapshot,
      ...liveAnalytics,
      categoryPerformance: analyticsSnapshot.categoryPerformance,
      templatePerformance: analyticsSnapshot.templatePerformance,
      postingWindows: analyticsSnapshot.postingWindows,
    };
  }

  return liveAnalytics;
}

export async function getWorkspacePolicySummary() {
  if (preferMockData) {
    return {
      blockedCategories: ["politics"],
    };
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      blockedCategories: ["politics"],
    };
  }

  const workspace = await getWorkspaceContext();
  const { data: settings } = await supabase.from("workspace_settings").select("*").eq("workspace_id", workspace.workspaceId).maybeSingle();

  return {
    blockedCategories: getBlockedCategories(settings),
  };
}
