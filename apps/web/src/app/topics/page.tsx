import Link from "next/link";
import { ActionBanner } from "@/components/action-banner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { createDraftFromTopicAction } from "@/features/drafts/actions";
import { listNormalizedTopicCandidates, listTopics } from "@/features/topics/topic-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";

type TopicsPageProps = {
  searchParams?: Promise<{ status?: string; category?: string }>;
};

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const resolvedSearchParams = await searchParams;
  const [workspace, topics, normalized] = await Promise.all([
    getActiveWorkspace(),
    listTopics(),
    listNormalizedTopicCandidates(),
  ]);
  const selectedCategory = resolvedSearchParams?.category ?? "all";
  const preferredCategoryOrder = ["all", "weather", "animals", "travel", "sports", "running", "lifting", "health", "celebrity"];
  const categorySet = new Set(topics.map((topic) => topic.category));
  const categoryFilters = preferredCategoryOrder.filter((category) => category === "all" || categorySet.has(category));
  const filteredTopics = selectedCategory === "all" ? topics : topics.filter((topic) => topic.category === selectedCategory);
  const filteredNormalized =
    selectedCategory === "all" ? normalized : normalized.filter((candidate) => candidate.rawCategory === selectedCategory);

  return (
    <AppShell workspace={workspace}>
      <ActionBanner status={resolvedSearchParams?.status} />
      <PageHeader
        eyebrow="Topic Queue"
        title="Rank, filter, and convert safe topics"
        description="The ingestion pipeline stays provider-driven and mock-safe locally, while the review surface exposes scoring, rights posture, and provenance before any draft is generated."
        badge={`${filteredTopics.length} queued`}
      />
      <div className="flex justify-end">
        <Link
          href={`/topics?status=ingestion_completed${selectedCategory !== "all" ? `&category=${selectedCategory}` : ""}`}
          className="rounded-full bg-[linear-gradient(135deg,#14384a,#1f556d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(20,56,74,0.24)] transition hover:brightness-110"
        >
          Run ingestion
        </Link>
      </div>
      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <div className="flex flex-wrap gap-3">
            {categoryFilters.map((filter) => (
              <Link
                key={filter}
                href={filter === "all" ? "/topics" : `/topics?category=${filter}`}
                className={`rounded-full px-4 py-3 text-sm font-semibold capitalize transition ${
                  selectedCategory === filter
                    ? "bg-[color:var(--navy)] text-white shadow-[0_10px_24px_rgba(20,56,74,0.22)]"
                    : "bg-white/78 text-[color:var(--ink-soft)] hover:bg-white"
                }`}
              >
                {filter}
              </Link>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {filteredTopics.map((topic) => (
              <article key={topic.id} className="surface-strong rounded-[1.5rem] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={topic.category} tone="accent" />
                      <StatusPill label={`freshness ${topic.scores.freshness}`} />
                      <StatusPill label={`viral ${topic.scores.viral}`} />
                      <StatusPill
                        label={topic.scores.rightsRisk <= 20 ? "asset review low" : topic.scores.rightsRisk <= 30 ? "asset review medium" : "asset review high"}
                        tone="warning"
                      />
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
                      <button
                        type="submit"
                        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
                      >
                        Generate draft
                      </button>
                    </form>
                    <Link href={`/drafts/${topic.id}`} className="text-sm font-medium text-[color:var(--accent-strong)]">
                      Open topic studio
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
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Asset Review Notes</p>
                    <ul className="mt-3 space-y-2 text-sm text-[color:var(--ink-soft)]">
                      {topic.rightsNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs leading-5 text-[color:var(--muted)]">
                      Asset review is operational guidance only. It is not a legal clearance or rights determination.
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {filteredTopics.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-white/55 p-8 text-sm text-[color:var(--ink-soft)]">
                No topics match the selected category yet.
              </div>
            ) : null}
          </div>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Normalized Candidates</p>
          <h2 className="mt-2 display-font text-2xl font-semibold">Adapter output</h2>
          <div className="mt-5 space-y-4">
            {filteredNormalized.map((candidate) => (
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
