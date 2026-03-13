import { notFound } from "next/navigation";
import { ActionBanner } from "@/components/action-banner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { DraftStudioEditor } from "@/features/drafts/components/draft-studio-editor";
import { getDraftDetailsById } from "@/features/drafts/draft-service";
import { listTemplates } from "@/features/templates/template-service";
import { listTopics } from "@/features/topics/topic-service";
import { getTopicById } from "@/lib/db/queries";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";

type DraftPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string; template?: string }>;
};

export default async function DraftPage({ params, searchParams }: DraftPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [workspace, draft, templates, topics] = await Promise.all([getActiveWorkspace(), getDraftDetailsById(id), listTemplates(), listTopics()]);
  const template = templates.find((item) => item.id === draft?.templateId);
  const persistedTopic = draft?.topicId ? await getTopicById(draft.topicId) : null;
  const topic = draft ? topics.find((item) => item.id === draft.topicId) ?? persistedTopic ?? buildFallbackTopicFromDraft(draft) : null;
  if (!draft || !template || !topic) {
    notFound();
  }

  return (
    <AppShell workspace={workspace}>
      <ActionBanner status={resolvedSearchParams?.status} />
      <PageHeader
        eyebrow="Draft Studio"
        title="Refine copy, review provenance, and approve manually"
        description="The draft studio exposes versions, captions, and manual edits."
        badge={draft.status.replace("_", " ")}
      />
      <DraftStudioEditor
        draft={draft}
        template={template}
        templates={templates}
        topic={topic}
        initialTemplateId={resolvedSearchParams?.template}
      />
    </AppShell>
  );
}

function buildFallbackTopicFromDraft(draft: NonNullable<Awaited<ReturnType<typeof getDraftDetailsById>>>) {
  return {
    id: draft.topicId,
    workspaceId: draft.workspaceId,
    title: draft.selectedHeadline,
    summary: draft.selectedSummary,
    category: "archived",
    sourceUrl: "",
    sourceDomain: "saved-draft",
    publishedAt: draft.scheduledFor ?? new Date().toISOString(),
    imageUrl: "",
    insetImageUrl: "",
    status: "drafted" as const,
    scores: {
      freshness: 0,
      viral: 0,
      brandFit: 0,
      rightsRisk: 0,
      tragedyRisk: 0,
      politicalRisk: 0,
      duplicateRisk: 0,
      final: 0,
    },
    safetyNotes: ["Historical draft loaded without an active topic queue entry."],
    rightsNotes: ["Replace or upload a fresh image before publish if the original asset is unavailable."],
  };
}
