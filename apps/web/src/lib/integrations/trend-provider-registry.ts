import type { TrendProvider } from "../services/contracts.ts";
import { normalizedTopicCandidates } from "../mock-data.ts";
import { mockFixtureTrendProvider } from "../services/mock-services.ts";

const manualEntryProvider: TrendProvider = {
  providerKey: "manual_entry",
  async fetch() {
    return normalizedTopicCandidates.filter((candidate) => candidate.providerKey === "manual_entry");
  },
};

const rssCuratedProvider: TrendProvider = {
  providerKey: "rss_curated",
  async fetch() {
    return normalizedTopicCandidates.filter((candidate) => candidate.providerKey === "rss_curated");
  },
};

export const trendProviders: TrendProvider[] = [mockFixtureTrendProvider, rssCuratedProvider, manualEntryProvider];
