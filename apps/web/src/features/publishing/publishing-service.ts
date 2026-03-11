import { getPublishJobs } from "@/lib/db/queries";

export async function listPublishJobs() {
  return getPublishJobs();
}
