import type {
  CaptionVariant,
  Draft,
  NormalizedAssetCandidate,
  NormalizedTopicCandidate,
  SourcePolicy,
  Template,
  Topic,
} from "@/lib/domain";

export interface TrendProvider {
  providerKey: string;
  fetch(): Promise<NormalizedTopicCandidate[]>;
}

export interface AssetProvider {
  providerKey: string;
  fetchAssets(): Promise<NormalizedAssetCandidate[]>;
}

export interface TopicScoringService {
  score(candidate: NormalizedTopicCandidate, policy: SourcePolicy): Promise<Topic>;
}

export interface SafetyCheckService {
  evaluate(candidate: NormalizedTopicCandidate): Promise<{
    passed: boolean;
    score: number;
    notes: string[];
  }>;
}

export interface RightsCheckService {
  evaluate(candidate: NormalizedTopicCandidate): Promise<{
    approvedAssets: NormalizedAssetCandidate[];
    score: number;
    notes: string[];
  }>;
}

export interface DraftGenerationService {
  generate(topic: Topic): Promise<{
    draft: Draft;
    captionVariants: CaptionVariant[];
  }>;
}

export interface TemplateRenderingService {
  render(template: Template, draft: Draft): Promise<{
    assetPath: string;
    previewPath: string;
  }>;
}

export interface PublishingAdapter {
  channelKey: string;
  publish(draft: Draft): Promise<{
    accepted: boolean;
    externalPostId?: string;
    message: string;
  }>;
}

export interface AnalyticsSyncService {
  sync(workspaceId: string): Promise<{
    syncedPosts: number;
    message: string;
  }>;
}
