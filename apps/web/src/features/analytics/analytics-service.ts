import { getAnalytics } from "@/lib/db/queries";

export async function getAnalyticsSnapshot() {
  return getAnalytics();
}
