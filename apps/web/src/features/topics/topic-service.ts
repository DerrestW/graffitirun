import "server-only";

import { cache } from "react";
import { getTrendProviders } from "@/lib/integrations/trend-providers";
import { scoreCandidate } from "@/lib/operations/ingestion-scoring";
import { normalizedTopicCandidates, topics } from "@/lib/mock-data";
import type { NormalizedTopicCandidate, Topic } from "@/lib/domain";

function buildTopicId(candidate: NormalizedTopicCandidate, index: number) {
  const base = candidate.externalRef || candidate.title || `topic-${index + 1}`;
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const hash = hashString(base);

  return `${slug.slice(0, 48)}-${hash}`;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36).slice(0, 8);
}

function mapCandidateToTopic(candidate: NormalizedTopicCandidate, index: number): Topic {
  const scores = scoreCandidate(candidate);

  return {
    id: buildTopicId(candidate, index),
    workspaceId: "workspace-graffiti-run",
    title: candidate.title,
    summary: candidate.snippet ?? "Live RSS topic ready for original rewrite.",
    category: candidate.rawCategory ?? "uncategorized",
    sourceUrl: candidate.canonicalUrl ?? "",
    sourceDomain: candidate.domain ?? "unknown",
    publishedAt: candidate.publishedAt ?? new Date().toISOString(),
    imageUrl: candidate.imageUrl ?? "",
    insetImageUrl: candidate.insetImageUrl ?? candidate.imageUrl,
    status: "candidate",
    scores: {
      freshness: scores.freshness,
      viral: scores.viral,
      brandFit: scores.brandFit,
      rightsRisk: scores.rightsRisk,
      tragedyRisk: scores.tragedyRisk,
      politicalRisk: scores.politicalRisk,
      duplicateRisk: scores.duplicateRisk,
      final: scores.final,
    },
    safetyNotes: ["Live feed candidate. Review claims and framing before publish."],
    rightsNotes: ["Image pulled from feed metadata when available.", "Replace with your own upload if the source image is weak."],
  };
}

export async function listTopics() {
  const candidates = await getTopicCandidatesSnapshot();

  if (candidates.length === 0) {
    return topics;
  }

  return candidates.map(mapCandidateToTopic).sort((left, right) => right.scores.final - left.scores.final);
}

export async function listNormalizedTopicCandidates() {
  const candidates = await getTopicCandidatesSnapshot();
  return candidates.length > 0 ? candidates : normalizedTopicCandidates;
}

const getTopicCandidatesSnapshot = cache(async () => {
  try {
    const providers = await getTrendProviders();
    const candidates = (await Promise.all(providers.map((provider) => provider.fetch()))).flat();
    if (candidates.length === 0) {
      return [] as NormalizedTopicCandidate[];
    }

    const rssCandidates = candidates.filter((candidate) => candidate.providerKey === "rss_curated");
    const liveCandidates = candidates.filter((candidate) => candidate.providerKey !== "mock_fixture");
    const sourceCandidates = rssCandidates.length > 0 ? rssCandidates : liveCandidates.length > 0 ? liveCandidates : candidates;

    return sourceCandidates;
  } catch {
    return [] as NormalizedTopicCandidate[];
  }
});
