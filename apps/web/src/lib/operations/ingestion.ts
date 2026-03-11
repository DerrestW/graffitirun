import "server-only";

import { requirePermission } from "@/lib/authz";
import { getTrendProviders } from "@/lib/integrations/trend-providers";
import { scoreCandidate } from "@/lib/operations/ingestion-scoring";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/db/queries";
import type { Database } from "@/lib/db/database.types";

type IngestionResult = {
  provider: string;
  fetched: number;
  accepted: number;
  skipped: number;
};

export async function runTopicIngestion(): Promise<IngestionResult[]> {
  await requirePermission("viewTopics");
  const [workspace, supabase, providers] = await Promise.all([
    getWorkspaceContext(),
    Promise.resolve(createAdminSupabaseClient()),
    Promise.resolve(getTrendProviders()),
  ]);
  const providerPayloads = await Promise.all(providers.map(async (provider) => ({ provider: provider.providerKey, candidates: await provider.fetch() })));
  const normalizedTopicCandidates = providerPayloads.flatMap((entry) => entry.candidates);

  if (!supabase) {
    return providerPayloads.map((entry) => ({
      provider: entry.provider,
      fetched: entry.candidates.length,
      accepted: entry.candidates.length,
      skipped: 0,
    }));
  }

  const existingTopicsResult = await supabase
    .from("topics")
    .select("external_ref,title")
    .eq("workspace_id", workspace.workspaceId);
  const existingTopics =
    (existingTopicsResult.data as Pick<Database["public"]["Tables"]["topics"]["Row"], "external_ref" | "title">[] | null) ?? [];
  const seenRefs = new Set(existingTopics.map((topic) => topic.external_ref).filter(Boolean));
  const seenTitles = new Set(existingTopics.map((topic) => topic.title.toLowerCase()));

  const providerKeys = [...new Set(normalizedTopicCandidates.map((candidate) => candidate.providerKey))];
  const sourceRows = new Map<string, string>();

  for (const provider of providerKeys) {
    const existingSource = await supabase
      .from("sources")
      .select("id")
      .eq("workspace_id", workspace.workspaceId)
      .eq("provider_name", provider)
      .limit(1)
      .maybeSingle();

    if (existingSource.data?.id) {
      sourceRows.set(provider, existingSource.data.id);
      continue;
    }

    const inserted = await supabase
      .from("sources")
      .insert({
        workspace_id: workspace.workspaceId,
        provider_name: provider,
        source_type: provider === "rss_curated" ? "rss" : provider === "manual_entry" ? "manual" : "mock_json",
        source_url: provider === "rss_curated" ? "https://example.com/feed.xml" : "file:///data/mock_topics.json",
        status: "active",
        rights_policy: provider === "mock_fixture" ? "approved" : "review_required",
      })
      .select("id")
      .single();

    if (inserted.data?.id) {
      sourceRows.set(provider, inserted.data.id);
    }
  }

  const results = new Map<string, IngestionResult>();

  for (const candidate of normalizedTopicCandidates) {
    const providerResult = results.get(candidate.providerKey) ?? {
      provider: candidate.providerKey,
      fetched: 0,
      accepted: 0,
      skipped: 0,
    };
    providerResult.fetched += 1;

    if ((candidate.externalRef && seenRefs.has(candidate.externalRef)) || seenTitles.has(candidate.title.toLowerCase())) {
      providerResult.skipped += 1;
      results.set(candidate.providerKey, providerResult);
      continue;
    }

    const scores = scoreCandidate(candidate);
    const insertedTopic = await supabase
      .from("topics")
      .insert({
        workspace_id: workspace.workspaceId,
        source_id: sourceRows.get(candidate.providerKey) ?? null,
        external_ref: candidate.externalRef,
        title: candidate.title,
        summary: candidate.snippet ?? null,
        source_url: candidate.canonicalUrl ?? null,
        source_domain: candidate.domain ?? null,
        image_url: candidate.imageUrl ?? null,
        published_at_source: candidate.publishedAt ?? null,
        category: candidate.rawCategory ?? null,
        language: candidate.language ?? "en",
        freshness_score: scores.freshness,
        viral_score: scores.viral,
        brand_fit_score: scores.brandFit,
        political_risk_score: scores.politicalRisk,
        rights_risk_score: scores.rightsRisk,
        tragedy_risk_score: scores.tragedyRisk,
        duplicate_risk_score: scores.duplicateRisk,
        final_score: scores.final,
        status: "candidate",
      })
      .select("id")
      .single();

    if (!insertedTopic.data?.id) {
      providerResult.skipped += 1;
      results.set(candidate.providerKey, providerResult);
      continue;
    }

    const topicId = insertedTopic.data.id;
    await supabase.from("topic_checks").insert([
      {
        workspace_id: workspace.workspaceId,
        topic_id: topicId,
        check_type: "safety_ingestion",
        result: candidate.rawCategory === "politics" ? "blocked" : "pass",
        score: candidate.rawCategory === "politics" ? 10 : 92,
        notes: candidate.ingestionNotes?.[0] ?? "Ingestion safety pass.",
      },
      {
        workspace_id: workspace.workspaceId,
        topic_id: topicId,
        check_type: "rights_ingestion",
        result: candidate.rightsConfidence === "high" ? "pass" : "review",
        score: candidate.rightsConfidence === "high" ? 86 : 72,
        notes: candidate.rightsConfidence === "high" ? "Higher confidence source policy." : "Requires rights review before publish.",
      },
    ]);

    seenRefs.add(candidate.externalRef);
    seenTitles.add(candidate.title.toLowerCase());
    providerResult.accepted += 1;
    results.set(candidate.providerKey, providerResult);
  }

  return [...results.values()];
}
