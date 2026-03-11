import { getTopics } from "@/lib/db/queries";
import { normalizedTopicCandidates } from "@/lib/mock-data";

export async function listTopics() {
  return getTopics();
}

export async function listNormalizedTopicCandidates() {
  return normalizedTopicCandidates;
}
