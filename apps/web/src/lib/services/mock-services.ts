import type {
  AnalyticsSyncService,
  AssetProvider,
  DraftGenerationService,
  PublishingAdapter,
  RightsCheckService,
  SafetyCheckService,
  TemplateRenderingService,
  TopicScoringService,
  TrendProvider,
} from "./contracts.ts";
import { drafts, normalizedAssetCandidates, normalizedTopicCandidates, topics } from "../mock-data.ts";

export const mockFixtureTrendProvider: TrendProvider = {
  providerKey: "mock_fixture",
  async fetch() {
    return normalizedTopicCandidates.filter((candidate) => candidate.providerKey === "mock_fixture");
  },
};

export const mockAssetLibraryProvider: AssetProvider = {
  providerKey: "mock_asset_library",
  async fetchAssets() {
    return normalizedAssetCandidates;
  },
};

export const mockSafetyService: SafetyCheckService = {
  async evaluate(candidate) {
    return {
      passed: candidate.rawCategory !== "politics",
      score: candidate.rawCategory === "politics" ? 10 : 92,
      notes: candidate.rawCategory === "politics" ? ["Blocked by workspace safety policy."] : ["Safe for manual review queue."],
    };
  },
};

export const mockRightsService: RightsCheckService = {
  async evaluate() {
    return {
      approvedAssets: normalizedAssetCandidates,
      score: 78,
      notes: ["Mock asset library is approved.", "External publisher media still requires replacement."],
    };
  },
};

export const mockScoringService: TopicScoringService = {
  async score(candidate) {
    const topic = topics.find((item) => item.title === candidate.title);

    if (!topic) {
      throw new Error("Mock topic not found for candidate.");
    }

    return topic;
  },
};

export const mockDraftGenerationService: DraftGenerationService = {
  async generate(topic) {
    const draft = drafts.find((item) => item.topicId === topic.id) ?? drafts[0];
    return {
      draft,
      captionVariants: draft.captions,
    };
  },
};

export const mockTemplateRenderingService: TemplateRenderingService = {
  async render(template, draft) {
    return {
      assetPath: draft.renderedAssetPath,
      previewPath: `/previews/${template.id}-${draft.id}.png`,
    };
  },
};

export const facebookPublishingAdapter: PublishingAdapter = {
  channelKey: "facebook_page",
  async publish(draft) {
    return {
      accepted: true,
      externalPostId: `stub_${draft.id}`,
      message: "Facebook adapter executed in stub mode. Replace with live credentials to publish for real.",
    };
  },
};

export const mockAnalyticsSyncService: AnalyticsSyncService = {
  async sync() {
    return {
      syncedPosts: 12,
      message: "Seeded metrics refreshed from local mock pipeline.",
    };
  },
};
