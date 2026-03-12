"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import { syncMetaInsights } from "@/lib/operations/analytics-sync";

export async function syncMetaInsightsAction() {
  try {
    await requirePermission("viewAnalytics");
    await syncMetaInsights();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/analytics?status=unauthorized");
    }

    redirect("/analytics?status=sync_failed");
  }

  revalidatePath("/analytics");
  revalidatePath("/dashboard");
  redirect("/analytics?status=sync_completed");
}
