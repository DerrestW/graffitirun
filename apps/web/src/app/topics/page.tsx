import Link from "next/link";
import { ActionBanner } from "@/components/action-banner";
import { AppShell } from "@/components/app-shell";
import { FormSubmitButton } from "@/components/form-submit-button";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { createDraftFromTopicAction } from "@/features/drafts/actions";
import { ingestTopicsAction } from "@/features/topics/actions";
import { listNormalizedTopicCandidates, listTopics } from "@/features/topics/topic-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";

type TopicsPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const resolvedSearchParams = await searchParams;
  const [workspace, topics, normalized] = await Promise.all([
    getActiveWorkspace(),
    listTopics(),
    listNormalizedTopicCandidates(),
  ]);

  return (
    <AppShell workspace={workspace}>
      <ActionBanner status={resolvedSearchParams?.status} />
      <PageHeader
        eyebrow="Topic Queue"
        title="Rank, filter, and convert safe topics"
        description="The ingestion pipeline stays provider-driven and mock-safe locally, while the review surface exposes scoring, rights posture, and provenance before any draft is generated."
        badge={`${topics.length} queued`}
      />
      <div className="flex justify-end">
        <form action={ingestTopicsAction}>
          <FormSubmitButton
            idleLabel="Run ingestion"
            pendingLabel="Ingesting..."
            className="rounded-full bg-[color:var(--navy)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
          />
        </form>
      </div>
      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <div className="grid gap-3 md:grid-cols-4">
            {["weather", "animals", "travel", "rights review"].map((filter) => (
              <div key={filter} className="rounded-[1.25rem] bg-white/70 px-4 py-3 text-sm font-medium text-[color:var(--ink-soft)]">
                {filter}
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {topics.map((topic) => (
              <article key={topic.id} className="surface-strong rounded-[1.5rem] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={topic.category} tone="accent" />
                      <StatusPill label={`freshness ${topic.scores.freshness}`} />
                      <StatusPill label={`viral ${topic.scores.viral}`} />
                      <StatusPill label={`rights ${100 - topic.scores.rightsRisk}`} tone="warning" />
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-[color:var(--foreground)]">{topic.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{topic.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-[color:var(--ink-soft)]">
                      <span>Source: {topic.sourceDomain}</span>
                      <span>Final score: {topic.scores.final}</span>
                      <span>Status: {topic.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <form action={createDraftFromTopicAction}>
                      <input type="hidden" name="topicId" value={topic.id} />
                      <FormSubmitButton
                        idleLabel="Generate draft"
                        pendingLabel="Creating..."
                        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:opacity-70"
                      />
                    </form>
                    <Link href="/drafts/draft-1" className="text-sm font-medium text-[color:var(--accent-strong)]">
                      View seeded demo
                    </Link>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Safety Notes</p>
                    <ul className="mt-3 space-y-2 text-sm text-[color:var(--ink-soft)]">
                      {topic.safetyNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[1.25rem] bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Rights Notes</p>
                    <ul className="mt-3 space-y-2 text-sm text-[color:var(--ink-soft)]">
                      {topic.rightsNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Normalized Candidates</p>
          <h2 className="mt-2 display-font text-2xl font-semibold">Adapter output</h2>
          <div className="mt-5 space-y-4">
            {normalized.map((candidate) => (
              <div key={candidate.externalRef} className="rounded-[1.25rem] bg-white/75 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[color:var(--foreground)]">{candidate.providerKey}</p>
                  <StatusPill label={candidate.sourceType} />
                </div>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{candidate.title}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  rights confidence {candidate.rightsConfidence}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
