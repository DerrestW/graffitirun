import { notFound } from "next/navigation";
import { ActionBanner } from "@/components/action-banner";
import { AppShell } from "@/components/app-shell";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import {
  addReviewCommentAction,
  approveDraftAction,
  rejectDraftAction,
  requestDraftChangesAction,
  schedulePublishAction,
} from "@/features/drafts/actions";
import { getDraftDetailsById } from "@/features/drafts/draft-service";
import { listTemplates } from "@/features/templates/template-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { formatDateTime } from "@/lib/formatters";

type DraftPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string }>;
};

export default async function DraftPage({ params, searchParams }: DraftPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [workspace, draft, templates] = await Promise.all([getActiveWorkspace(), getDraftDetailsById(id), listTemplates()]);
  const template = templates.find((item) => item.id === draft?.templateId);

  if (!draft || !template) {
    notFound();
  }

  return (
    <AppShell workspace={workspace}>
      <ActionBanner status={resolvedSearchParams?.status} />
      <PageHeader
        eyebrow="Draft Studio"
        title="Refine copy, review provenance, and approve manually"
        description="The draft studio keeps business logic out of the UI while still showing everything an editor or reviewer needs: source context, version history, comments, captions, and render output."
        badge={draft.status.replace("_", " ")}
      />
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.95fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Rendered Preview</p>
              <h2 className="mt-2 display-font text-2xl font-semibold">{template.name}</h2>
            </div>
            <StatusPill label={`${template.width}x${template.height}`} tone="accent" />
          </div>
          <div className="mt-5 overflow-hidden rounded-[1.75rem] bg-[color:var(--navy)] p-5 text-white">
            <div className="flex h-[28rem] flex-col justify-between rounded-[1.5rem] border border-white/15 bg-gradient-to-br from-white/18 to-white/6 p-6">
              <div className="flex items-center justify-between">
                <StatusPill label="Graffiti Run" tone="accent" />
                <p className="text-sm text-white/72">{template.templateType}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-white/58">Featured Headline</p>
                <h3 className="mt-4 display-font text-4xl font-semibold leading-tight">{draft.selectedHeadline}</h3>
                <p className="mt-4 max-w-md text-base leading-7 text-white/80">{draft.selectedSummary}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-white/72">
                <span>{draft.selectedHook}</span>
                <span>{template.accentColor}</span>
              </div>
            </div>
          </div>
        </article>
        <div className="grid gap-6">
          <article className="surface rounded-[1.75rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Version Stack</p>
            <div className="mt-5 space-y-4">
              {draft.versions.map((version) => (
                <div key={version.versionNumber} className="rounded-[1.25rem] bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[color:var(--foreground)]">Version {version.versionNumber}</p>
                    <StatusPill label={version.versionNumber === draft.versions.length ? "current" : "history"} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[color:var(--foreground)]">{version.headline}</p>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{version.summary}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="surface rounded-[1.75rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Captions</p>
            <div className="mt-5 space-y-4">
              {draft.captions.map((caption) => (
                <div key={caption.id} className="rounded-[1.25rem] bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[color:var(--foreground)]">{caption.variantName}</p>
                    <StatusPill label="caption" />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{caption.captionText}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{caption.hashtagsText}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
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
          <form action={addReviewCommentAction} className="mt-5 space-y-3">
            <input type="hidden" name="draftId" value={draft.id} />
            <textarea
              name="comment"
              required
              rows={4}
              placeholder="Add an internal review note..."
              className="w-full rounded-[1.25rem] border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-[color:var(--foreground)] outline-none"
            />
            <FormSubmitButton
              idleLabel="Add comment"
              pendingLabel="Saving..."
              className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-white disabled:opacity-70"
            />
          </form>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Approval Actions</p>
          <div className="mt-5 grid gap-4">
            <form action={approveDraftAction}>
              <input type="hidden" name="draftId" value={draft.id} />
              <FormSubmitButton
                idleLabel="Approve"
                pendingLabel="Approving..."
                className="w-full rounded-[1.25rem] bg-[color:var(--success)] px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70"
              />
              <span className="mt-2 block text-sm text-[color:var(--ink-soft)]">Moves draft into approved status and writes the decision log.</span>
            </form>
            <form action={requestDraftChangesAction}>
              <input type="hidden" name="draftId" value={draft.id} />
              <FormSubmitButton
                idleLabel="Request edits"
                pendingLabel="Updating..."
                className="w-full rounded-[1.25rem] bg-white/85 px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--foreground)] disabled:opacity-70"
              />
              <span className="mt-2 block text-sm text-[color:var(--ink-soft)]">Keeps the draft in review and records a requested-changes action.</span>
            </form>
            <form action={rejectDraftAction}>
              <input type="hidden" name="draftId" value={draft.id} />
              <FormSubmitButton
                idleLabel="Reject"
                pendingLabel="Rejecting..."
                className="w-full rounded-[1.25rem] bg-[color:var(--danger)] px-5 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70"
              />
              <span className="mt-2 block text-sm text-[color:var(--ink-soft)]">Rejects unsafe or weak drafts while preserving the audit trail.</span>
            </form>
          </div>
          <div className="mt-5 rounded-[1.25rem] bg-[color:var(--accent-soft)] p-4 text-sm text-[color:var(--accent-strong)]">
            Scheduled for {draft.scheduledFor ? formatDateTime(draft.scheduledFor) : "not yet scheduled"}
          </div>
          <form action={schedulePublishAction} className="mt-5 space-y-3 rounded-[1.25rem] bg-white/85 p-4">
            <input type="hidden" name="draftId" value={draft.id} />
            <label className="block text-sm font-medium text-[color:var(--foreground)]">
              Schedule publish job
              <input
                type="datetime-local"
                name="scheduledFor"
                required
                defaultValue={draft.scheduledFor ? draft.scheduledFor.slice(0, 16) : ""}
                className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm text-[color:var(--foreground)] outline-none"
              />
            </label>
            <FormSubmitButton
              idleLabel="Queue publish job"
              pendingLabel="Queuing..."
              className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            />
          </form>
        </article>
      </section>
    </AppShell>
  );
}
