"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import type { Database } from "@/lib/db/database.types";
import { getDraftById, getWorkspaceContext } from "@/lib/db/queries";
import { currentWorkspace } from "@/lib/workspace";
import { getAuthState } from "@/features/auth/auth-service";
import { buildDraftInsertRecord, buildDraftStatusUpdate, buildSchedulePublishJobInput } from "@/features/drafts/workflow";
import { listTemplates } from "@/features/templates/template-service";
import { listTopics } from "@/features/topics/topic-service";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

function redirectWithStatus(path: string, status: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}status=${status}`);
}

async function getActionContext() {
  const [auth, workspace] = await Promise.all([getAuthState(), getWorkspaceContext()]);

  return {
    auth,
    workspace,
    actorUserId: auth.signedIn ? auth.user.id : currentWorkspace.currentUser.id,
  };
}

export async function createDraftFromTopicAction(formData: FormData) {
  const topicId = String(formData.get("topicId") ?? "");
  let context: Awaited<ReturnType<typeof getActionContext>>;
  let supabase: ReturnType<typeof createAdminSupabaseClient>;
  let topics: Awaited<ReturnType<typeof listTopics>>;
  let templates: Awaited<ReturnType<typeof listTemplates>>;

  try {
    await requirePermission("createDrafts");
    [context, supabase, topics, templates] = await Promise.all([
      getActionContext(),
      Promise.resolve(createAdminSupabaseClient()),
      listTopics(),
      listTemplates(),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/topics?status=unauthorized");
    }
    throw error;
  }

  const topic = topics.find((item) => item.id === topicId);
  const template = templates.find((item) => item.isDefault) ?? templates[0];

  if (!topic || !template) {
    redirect("/topics");
  }

  if (!supabase) {
    redirect("/drafts/draft-1");
  }

  const persistedTopic = isUuid(topic.id)
    ? { ...topic, workspaceId: context.workspace.workspaceId }
    : await persistLiveTopic(supabase, context.workspace.workspaceId, topic);

  const records = buildDraftInsertRecord({
    workspaceId: context.workspace.workspaceId,
    actorUserId: context.actorUserId,
    topic: persistedTopic,
    template,
  });

  const { data: draftRow, error: draftError } = await supabase
    .from("drafts")
    .insert(records.draft as never)
    .select("*")
    .single();
  const createdDraft = draftRow as { id: string } | null;

  if (draftError || !createdDraft) {
    throw new Error(draftError?.message ?? "Failed to create draft.");
  }

  await Promise.all([
    supabase.from("draft_versions").insert({
      ...records.version,
      draft_id: createdDraft.id,
    } as never),
    supabase.from("captions").insert(
      records.captions.map((caption) => ({
        ...caption,
        draft_id: createdDraft.id,
      })) as never,
    ),
    supabase.from("approval_logs").insert({
      workspace_id: context.workspace.workspaceId,
      draft_id: createdDraft.id,
      action: "created",
      actor_user_id: context.actorUserId,
      notes: "Draft created from topic queue.",
    } as never),
  ]);

  revalidatePath("/topics");
  revalidatePath("/dashboard");
  revalidatePath("/publishing");
  redirectWithStatus(`/drafts/${createdDraft.id}`, "draft_created");
}

async function persistLiveTopic(
  supabase: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  workspaceId: string,
  topic: Awaited<ReturnType<typeof listTopics>>[number],
) {
  const existing = await supabase
    .from("topics")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("source_url", topic.sourceUrl)
    .maybeSingle();
  const existingTopic = existing.data as { id: string } | null;

  if (existingTopic) {
    return {
      ...topic,
      id: existingTopic.id,
      workspaceId,
    };
  }

  const inserted = await supabase
    .from("topics")
    .insert({
      workspace_id: workspaceId,
      source_id: null,
      external_ref: topic.id,
      title: topic.title,
      summary: topic.summary,
      source_url: topic.sourceUrl,
      source_domain: topic.sourceDomain,
      image_url: topic.imageUrl,
      published_at_source: topic.publishedAt,
      category: topic.category,
      language: "en",
      freshness_score: topic.scores.freshness,
      viral_score: topic.scores.viral,
      brand_fit_score: topic.scores.brandFit,
      political_risk_score: topic.scores.politicalRisk,
      rights_risk_score: topic.scores.rightsRisk,
      tragedy_risk_score: topic.scores.tragedyRisk,
      duplicate_risk_score: topic.scores.duplicateRisk,
      final_score: topic.scores.final,
      status: "candidate",
    } as never)
    .select("*")
    .single();
  const insertedTopic = inserted.data as { id: string } | null;

  if (inserted.error || !insertedTopic) {
    throw new Error(inserted.error?.message ?? "Failed to persist the selected topic.");
  }

  return {
    ...topic,
    id: insertedTopic.id,
    workspaceId,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function addReviewCommentAction(formData: FormData) {
  const draftId = String(formData.get("draftId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!draftId || !comment) {
    return;
  }

  let context: Awaited<ReturnType<typeof getActionContext>>;
  let supabase: ReturnType<typeof createAdminSupabaseClient>;

  try {
    await requirePermission("viewTopics");
    [context, supabase] = await Promise.all([getActionContext(), Promise.resolve(createAdminSupabaseClient())]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirectWithStatus(`/drafts/${draftId}`, "unauthorized");
    }
    throw error;
  }

  if (!supabase) {
    redirectWithStatus(`/drafts/${draftId}`, "comment_added");
  }

  await supabase.from("review_comments").insert({
    workspace_id: context.workspace.workspaceId,
    draft_id: draftId,
    user_id: context.actorUserId,
    comment,
  } as never);

  await supabase.from("approval_logs").insert({
    workspace_id: context.workspace.workspaceId,
    draft_id: draftId,
    action: "commented",
    actor_user_id: context.actorUserId,
    notes: comment,
  } as never);

  revalidatePath(`/drafts/${draftId}`);
  redirectWithStatus(`/drafts/${draftId}`, "comment_added");
}

async function updateDraftStatus(
  draftId: string,
  status: Database["public"]["Tables"]["drafts"]["Row"]["status"],
  action: string,
  notes: string,
) {
  let context: Awaited<ReturnType<typeof getActionContext>>;
  let supabase: ReturnType<typeof createAdminSupabaseClient>;

  try {
    await requirePermission("approveDrafts");
    [context, supabase] = await Promise.all([getActionContext(), Promise.resolve(createAdminSupabaseClient())]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirectWithStatus(`/drafts/${draftId}`, "unauthorized");
    }
    throw error;
  }

  if (!supabase) {
    redirectWithStatus(`/drafts/${draftId}`, action === "approved" ? "draft_approved" : action === "requested_changes" ? "changes_requested" : "draft_rejected");
  }

  const updatePayload: Partial<Database["public"]["Tables"]["drafts"]["Row"]> = buildDraftStatusUpdate(status, context.actorUserId);

  await supabase.from("drafts").update(updatePayload as never).eq("id", draftId).eq("workspace_id", context.workspace.workspaceId);
  await supabase.from("approval_logs").insert({
    workspace_id: context.workspace.workspaceId,
    draft_id: draftId,
    action,
    actor_user_id: context.actorUserId,
    notes,
  } as never);

  revalidatePath("/dashboard");
  revalidatePath(`/drafts/${draftId}`);
  revalidatePath("/publishing");
  redirectWithStatus(
    `/drafts/${draftId}`,
    action === "approved" ? "draft_approved" : action === "requested_changes" ? "changes_requested" : "draft_rejected",
  );
}

export async function approveDraftAction(formData: FormData) {
  const draftId = String(formData.get("draftId") ?? "");
  if (!draftId) {
    return;
  }

  await updateDraftStatus(draftId, "approved", "approved", "Draft approved for scheduling.");
}

export async function requestDraftChangesAction(formData: FormData) {
  const draftId = String(formData.get("draftId") ?? "");
  if (!draftId) {
    return;
  }

  await updateDraftStatus(draftId, "in_review", "requested_changes", "Draft returned for edits.");
}

export async function rejectDraftAction(formData: FormData) {
  const draftId = String(formData.get("draftId") ?? "");
  if (!draftId) {
    return;
  }

  await updateDraftStatus(draftId, "rejected", "rejected", "Draft rejected during review.");
}

export async function schedulePublishAction(formData: FormData) {
  const draftId = String(formData.get("draftId") ?? "");
  const scheduledFor = String(formData.get("scheduledFor") ?? "").trim();

  if (!draftId || !scheduledFor) {
    return;
  }

  let context: Awaited<ReturnType<typeof getActionContext>>;
  let supabase: ReturnType<typeof createAdminSupabaseClient>;
  let draft: Awaited<ReturnType<typeof getDraftById>>;

  try {
    await requirePermission("publishDrafts");
    [context, supabase, draft] = await Promise.all([
      getActionContext(),
      Promise.resolve(createAdminSupabaseClient()),
      getDraftById(draftId),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirectWithStatus(`/drafts/${draftId}`, "unauthorized");
    }
    throw error;
  }

  if (!supabase || !draft) {
    redirectWithStatus(`/drafts/${draftId}`, "publish_queued");
  }

  const { data: existingJobs } = await supabase
    .from("publish_jobs")
    .select("*")
    .eq("workspace_id", context.workspace.workspaceId)
    .eq("draft_id", draftId)
    .limit(1);
  const existingJob = (existingJobs as Database["public"]["Tables"]["publish_jobs"]["Row"][] | null)?.[0] ?? null;

  const { data: channels } = await supabase
    .from("publishing_channels")
    .select("*")
    .eq("workspace_id", context.workspace.workspaceId)
    .order("created_at", { ascending: true })
    .limit(1);
  const channel = (channels as Database["public"]["Tables"]["publishing_channels"]["Row"][] | null)?.[0] ?? null;

  const scheduleInput = buildSchedulePublishJobInput({
    workspaceId: context.workspace.workspaceId,
    actorUserId: context.actorUserId,
    draft,
    channelId: channel?.id ?? null,
    scheduledFor,
  });

  await supabase.from("drafts").update(scheduleInput.draftUpdate as never).eq("id", draftId).eq("workspace_id", context.workspace.workspaceId);

  if (existingJob) {
    await supabase.from("publish_jobs").update(scheduleInput.publishJob as never).eq("id", existingJob.id);
  } else {
    await supabase.from("publish_jobs").insert(scheduleInput.publishJob as never);
  }

  await supabase.from("approval_logs").insert({
    workspace_id: context.workspace.workspaceId,
    draft_id: draftId,
    action: "scheduled",
    actor_user_id: context.actorUserId,
    notes: scheduleInput.approvalLogNote,
  } as never);

  revalidatePath("/dashboard");
  revalidatePath("/publishing");
  revalidatePath(`/drafts/${draftId}`);
  redirectWithStatus(`/drafts/${draftId}`, "publish_queued");
}
