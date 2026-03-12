import { notFound } from "next/navigation";
import { ActionBanner } from "@/components/action-banner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { DraftStudioEditor } from "@/features/drafts/components/draft-studio-editor";
import { DraftReviewControls } from "@/features/drafts/components/draft-review-controls";
import { getDraftDetailsById } from "@/features/drafts/draft-service";
import { listTemplates } from "@/features/templates/template-service";
import { listTopics } from "@/features/topics/topic-service";
import { getTopicById } from "@/lib/db/queries";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { formatDateTime } from "@/lib/formatters";

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
  const isPreviewDraft = Boolean(draft?.id.startsWith("draft-preview-"));

  if (!draft || !template || !topic) {
    notFound();
  }

  return (
    <AppShell workspace={workspace}>
      <ActionBanner status={resolvedSearchParams?.status} />
      <PageHeader
        eyebrow="Draft Studio"
        title="Refine copy, review provenance, and approve manually"
        description="The draft studio exposes versions, captions, comments, and publish readiness without coupling route rendering to server actions."
        badge={draft.status.replace("_", " ")}
      />
      <DraftStudioEditor
        draft={draft}
        template={template}
        templates={templates}
        topic={topic}
        initialTemplateId={resolvedSearchParams?.template}
      />
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.95fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Review Comments</p>
          <div className="mt-5 space-y-4">
            {draft.comments.map((comment) => (
              <div key={comment.id} className="rounded-[1.25rem] bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[color:var(--foreground)]">{comment.author}</p>
                  <p className="text-sm text-[color:var(--ink-soft)]">{formatDateTime(comment.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">{comment.body}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Publish Readiness</p>
          <div className="mt-5 grid gap-4">
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="text-sm font-medium text-[color:var(--foreground)]">Scheduled for</p>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                {draft.scheduledFor ? formatDateTime(draft.scheduledFor) : "Not yet scheduled"}
              </p>
            </div>
            <div className="rounded-[1.25rem] bg-white/80 p-4">
              <p className="text-sm font-medium text-[color:var(--foreground)]">Source handling</p>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                {isPreviewDraft
                  ? "This draft is synthesized directly from the selected topic so you can review the right copy and image before persisting anything."
                  : "Mock-backed local development keeps the studio stable while adapters and persistence are reintroduced incrementally."}
              </p>
            </div>
          </div>
        </article>
      </section>
      <DraftReviewControls
        draftId={draft.id}
        defaultScheduledFor={draft.scheduledFor ? draft.scheduledFor.slice(0, 16) : ""}
        disabled={isPreviewDraft}
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
