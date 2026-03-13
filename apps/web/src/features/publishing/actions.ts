"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/db/queries";
import { runPublishJob } from "@/lib/operations/publishing";

export async function runPublishJobAction(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) {
    redirect("/publishing");
  }

  try {
    await requirePermission("publishDrafts");
    await runPublishJob(jobId);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/publishing?status=unauthorized");
    }
    throw error;
  }
  revalidatePath("/publishing");
  revalidatePath("/dashboard");
  redirect("/publishing?status=publish_executed");
}

export async function clearPublishJobsAction(formData: FormData) {
  const mode = String(formData.get("mode") ?? "");

  try {
    await requirePermission("publishDrafts");
    const [workspace, supabase] = await Promise.all([getWorkspaceContext(), Promise.resolve(createAdminSupabaseClient())]);

    if (!supabase) {
      redirect("/publishing?status=publish_clear_failed");
    }

    let query = supabase.from("publish_jobs").delete().eq("workspace_id", workspace.workspaceId);

    if (mode === "completed") {
      query = query.in("status", ["succeeded", "failed"]);
    } else if (mode === "stale") {
      const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      query = query.in("status", ["queued", "running"]).lt("scheduled_for", staleCutoff);
    } else {
      redirect("/publishing");
    }

    await query;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/publishing?status=unauthorized");
    }
    throw error;
  }

  revalidatePath("/publishing");
  revalidatePath("/dashboard");
  redirect(`/publishing?status=${mode === "stale" ? "publish_stale_cleared" : "publish_completed_cleared"}`);
}
