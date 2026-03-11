"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requirePermission } from "@/lib/authz";
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
