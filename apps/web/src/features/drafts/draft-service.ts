import type { Draft, DraftVersion, Topic } from "@/lib/domain";
import { getDraftById } from "@/lib/db/queries";
import { drafts } from "@/lib/mock-data";
import { listTemplates } from "@/features/templates/template-service";
import { listTopics } from "@/features/topics/topic-service";
import { buildDraftPayload } from "./workflow";

export async function listDrafts() {
  return drafts;
}

function buildSyntheticDraft(topic: Topic, templateId: string): Draft {
  const payload = buildDraftPayload(topic);
  const trimmedTitle = topic.title.replace(/[.!?]+$/, "");
  const alternateHeadline =
    trimmedTitle.length > 62 ? `${trimmedTitle.slice(0, 59).trimEnd()}...` : `${trimmedTitle} Explained`;
  const alternateSummary = topic.summary
    ? topic.summary
    : `A tighter ${topic.category} rewrite with a cleaner first sentence and a stronger payoff.`;
  const internalReviewNote =
    topic.safetyNotes[0] ?? `Review framing and claims before publishing this ${topic.category} story.`;

  const versions: DraftVersion[] = [
    {
      versionNumber: 1,
      headline: payload.headline,
      summary: payload.summary,
      hookFact: internalReviewNote,
      bodyCopy: `Generated from ${topic.sourceDomain}. Preserve the core fact while rewriting the framing for Graffiti Run.`,
    },
    {
      versionNumber: 2,
      headline: alternateHeadline,
      summary: alternateSummary,
      hookFact: topic.rightsNotes[0] ?? internalReviewNote,
      bodyCopy: `Alt version optimized for faster scannability while keeping the same source topic.`,
    },
  ];

  return {
    id: `draft-preview-${topic.id}`,
    workspaceId: topic.workspaceId,
    topicId: topic.id,
    templateId,
    status: "new",
    selectedHeadline: versions[0].headline,
    selectedSummary: versions[0].summary,
    selectedHook: versions[0].hookFact,
    renderedAssetPath: `/api/renders/drafts/${topic.id}`,
    comments: [
      {
        id: `comment-preview-${topic.id}`,
        author: "System",
        body: `Preview draft synthesized from the ${topic.title} topic. Save or publish actions should create a persisted draft next.`,
        createdAt: topic.publishedAt,
      },
    ],
    versions,
    captions: payload.captions.map((caption, index) => ({
      id: `caption-preview-${topic.id}-${index + 1}`,
      ...caption,
    })),
  };
}

export async function getDraftDetailsById(id: string) {
  const persistedDraft = await getDraftById(id);
  if (persistedDraft) {
    return persistedDraft;
  }

  const matchedDraft = drafts.find((draft) => draft.id === id || draft.topicId === id);
  if (matchedDraft) {
    return matchedDraft;
  }

  const [topics, templates] = await Promise.all([listTopics(), listTemplates()]);
  const topic = topics.find((item) => item.id === id);
  if (!topic) {
    return null;
  }

  const defaultTemplate = templates.find((item) => item.isDefault) ?? templates[0];
  if (!defaultTemplate) {
    return null;
  }

  return buildSyntheticDraft(topic, defaultTemplate.id);
}
