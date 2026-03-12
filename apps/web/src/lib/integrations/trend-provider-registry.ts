import type { TrendProvider } from "../services/contracts";
import { normalizedTopicCandidates } from "../mock-data";
import { rssCuratedProvider } from "./rss-curated-provider";
import { mockFixtureTrendProvider } from "../services/mock-services";

const manualEntryProvider: TrendProvider = {
  providerKey: "manual_entry",
  async fetch() {
    return normalizedTopicCandidates.filter((candidate) => candidate.providerKey === "manual_entry");
  },
};

const fallbackRssProvider: TrendProvider = {
  providerKey: "rss_curated",
  async fetch() {
    const liveCandidates = await rssCuratedProvider.fetch();
    return liveCandidates.length > 0
      ? liveCandidates
      : normalizedTopicCandidates.filter((candidate) => candidate.providerKey === "rss_curated");
  },
};

export const trendProviders: TrendProvider[] = [mockFixtureTrendProvider, fallbackRssProvider, manualEntryProvider];
