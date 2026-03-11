"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import { runTopicIngestion } from "@/lib/operations/ingestion";

export async function ingestTopicsAction() {
  try {
    await requirePermission("viewTopics");
    await runTopicIngestion();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/topics?status=unauthorized");
    }
    throw error;
  }
  revalidatePath("/topics");
  revalidatePath("/dashboard");
  redirect("/topics?status=ingestion_completed");
}
