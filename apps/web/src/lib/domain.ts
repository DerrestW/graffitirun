export type WorkspaceRole = "owner" | "admin" | "editor" | "reviewer" | "analyst";

export type DraftStatus =
  | "new"
  | "in_review"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published"
  | "archived";

export type TopicStatus = "candidate" | "drafted" | "rejected" | "archived";

export type Topic = {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  category: string;
  sourceUrl: string;
  sourceDomain: string;
  publishedAt: string;
  imageUrl: string;
  insetImageUrl?: string;
  status: TopicStatus;
  scores: {
    freshness: number;
    viral: number;
    brandFit: number;
    rightsRisk: number;
    tragedyRisk: number;
    politicalRisk: number;
    duplicateRisk: number;
    final: number;
  };
  safetyNotes: string[];
  rightsNotes: string[];
};

export type CaptionVariant = {
  id: string;
  variantName: string;
  captionText: string;
  ctaText: string;
  hashtagsText: string;
};

export type DraftVersion = {
  versionNumber: number;
  headline: string;
  summary: string;
  hookFact: string;
  bodyCopy: string;
};

export type Draft = {
  id: string;
  workspaceId: string;
  topicId: string;
  templateId: string;
  status: DraftStatus;
  selectedHeadline: string;
  selectedSummary: string;
  selectedHook: string;
  renderedAssetPath: string;
  scheduledFor?: string;
  comments: Array<{ id: string; author: string; body: string; createdAt: string }>;
  versions: DraftVersion[];
  captions: CaptionVariant[];
};

export type Template = {
  id: string;
  workspaceId: string;
  name: string;
  templateType: "story" | "square" | "carousel" | "text_fact";
  layoutLabel?: string;
  headlinePlacement?: string;
  subheadlinePlacement?: string;
  backgroundStyle?: string;
  width: number;
  height: number;
  isDefault: boolean;
  accentColor: string;
  headlineLimit: number;
  notes: string;
  config?: TemplateRenderConfig;
};

export type TemplateRenderConfig = {
  background: {
    overlayOpacity: number;
    overlayStartColor?: string;
    overlayEndColor?: string;
    focalPoint?: { x: number; y: number };
  };
  logo?: {
    x: number;
    y: number;
    width: number;
  };
  headline: {
    x: number;
    y: number;
    width: number;
    fontSize: number;
    rotation: number;
    paddingX: number;
    paddingY: number;
    backgroundColor: string;
    color: string;
    radius?: number;
  };
  subheadline: {
    x: number;
    y: number;
    width: number;
    fontSize: number;
    color: string;
    paddingX?: number;
    paddingY?: number;
    backgroundColor?: string;
    radius?: number;
  };
  emphasis: {
    color: string;
    keywords: string[];
    mode?: "keywords" | "every_fifth" | "none";
  };
  insetImage?: {
    x: number;
    y: number;
    size: number;
    borderWidth: number;
    borderColor: string;
    cornerRadius?: number;
  };
};

export type TemplatePlacementOverrides = {
  headline?: Partial<Pick<TemplateRenderConfig["headline"], "x" | "y" | "width" | "fontSize" | "rotation">>;
  subheadline?: Partial<Pick<TemplateRenderConfig["subheadline"], "x" | "y" | "width" | "fontSize">>;
  insetImage?: Partial<Pick<NonNullable<TemplateRenderConfig["insetImage"]>, "x" | "y" | "size">>;
  background?: {
    focalPoint?: { x: number; y: number };
  };
};

export type PublishJob = {
  id: string;
  workspaceId: string;
  draftId: string;
  channelName: string;
  status: "queued" | "running" | "succeeded" | "failed";
  scheduledFor: string;
  errorMessage?: string;
};

export type AnalyticsSnapshot = {
  postsPublished: number;
  avgReach: number;
  avgEngagementRate: number;
  avgShares: number;
  estimatedEarnings: number;
  recentDelta: string;
  categoryPerformance: Array<{ category: string; value: number }>;
  templatePerformance: Array<{ template: string; value: number }>;
  postingWindows: Array<{ label: string; value: number }>;
};

export type WorkspaceContext = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: WorkspaceRole;
  timezone: string;
  approvalRequired: boolean;
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    authProvider: "supabase" | "mock";
  };
};

export type NormalizedTopicCandidate = {
  providerKey: string;
  sourceType: "mock_json" | "rss" | "manual";
  externalRef: string;
  title: string;
  canonicalUrl?: string;
  domain?: string;
  snippet?: string;
  publishedAt?: string;
  imageUrl?: string;
  insetImageUrl?: string;
  author?: string;
  language?: string;
  rawCategory?: string;
  tags?: string[];
  rightsConfidence: "unknown" | "low" | "medium" | "high";
  ingestionNotes?: string[];
};

export type NormalizedAssetCandidate = {
  providerKey: string;
  assetType: "image";
  sourceUrl?: string;
  localPath?: string;
  attributionRequired: boolean;
  rightsStatus: "approved" | "review_required" | "blocked";
  watermarkRisk: "low" | "medium" | "high";
};

export type SourcePolicy = {
  providerKey: string;
  enabled: boolean;
  ingestionMode: "topic_signal" | "asset_source" | "manual_only";
  defaultRightsStatus: "approved" | "review_required" | "blocked";
  allowAutoDraft: boolean;
  allowAutoPublish: boolean;
  requiresAttributionReview: boolean;
  blockedCategories: string[];
};
