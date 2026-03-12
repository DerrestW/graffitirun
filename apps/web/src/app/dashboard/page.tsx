import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { getAnalyticsSnapshot } from "@/features/analytics/analytics-service";
import { listDrafts } from "@/features/drafts/draft-service";
import { listPublishJobs } from "@/features/publishing/publishing-service";
import { listTopics } from "@/features/topics/topic-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { formatCompactNumber, formatPercent } from "@/lib/formatters";

const cardTone = [
  {
    shell: "bg-[linear-gradient(135deg,#102c38,#173c4b)] text-white shadow-[0_24px_60px_rgba(20,56,74,0.24)]",
    label: "text-white/76",
    value: "text-white",
    detail: "text-white/88",
  },
  {
    shell: "bg-[linear-gradient(135deg,#d96b31,#b34f1c)] text-white shadow-[0_24px_60px_rgba(179,79,28,0.22)]",
    label: "text-white/74",
    value: "text-white",
    detail: "text-white/84",
  },
  {
    shell: "surface section-card border border-[color:var(--border)] text-[color:var(--foreground)]",
    label: "text-[color:var(--muted)]",
    value: "text-[color:var(--foreground)]",
    detail: "text-[color:var(--ink-soft)]",
  },
  {
    shell: "bg-[linear-gradient(135deg,#f4ead7,#e9dcc7)] text-[color:var(--foreground)] border border-[#d7cab8] shadow-[0_24px_60px_rgba(20,56,74,0.08)]",
    label: "text-[#6c5d4f]",
    value: "text-[#172126]",
    detail: "text-[#4f5a60]",
  },
];

export default async function DashboardPage() {
  const [workspace, analytics, topics, drafts, jobs] = await Promise.all([
    getActiveWorkspace(),
    getAnalyticsSnapshot(),
    listTopics(),
    listDrafts(),
    listPublishJobs(),
  ]);

  const stats = [
    { label: "Published this week", value: String(analytics.postsPublished), detail: analytics.recentDelta },
    { label: "Average reach", value: formatCompactNumber(analytics.avgReach), detail: "per post" },
    { label: "Engagement rate", value: formatPercent(analytics.avgEngagementRate), detail: "safe shareable content" },
    { label: "Estimated earnings", value: `$${formatCompactNumber(analytics.estimatedEarnings)}`, detail: "mock local metrics" },
  ];

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Dashboard"
        title="Operate the content engine"
        description="Discovery, review, publishing, and analytics are all visible from one operational workspace."
        badge={workspace.workspaceName}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <article key={stat.label} className={`rounded-[1.75rem] p-6 ${cardTone[index].shell}`}>
            <p className={`text-xs uppercase tracking-[0.28em] ${cardTone[index].label}`}>{stat.label}</p>
            <p className={`mt-5 display-font text-5xl font-semibold tracking-[-0.05em] ${cardTone[index].value}`}>{stat.value}</p>
            <p className={`mt-3 max-w-[14rem] text-sm leading-6 ${cardTone[index].detail}`}>{stat.detail}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="surface section-card rounded-[1.75rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Today&apos;s opportunities</p>
              <h2 className="mt-2 display-font text-2xl font-semibold">Topic queue</h2>
            </div>
            <StatusPill label={`${topics.length} candidates`} tone="accent" />
          </div>
          <div className="mt-5 space-y-4">
            {topics.map((topic) => (
              <div key={topic.id} className="rounded-[1.25rem] border border-white/55 bg-white/80 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill label={topic.category} tone="accent" />
                  <StatusPill label={`score ${topic.scores.final}`} />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">{topic.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{topic.summary}</p>
              </div>
            ))}
          </div>
        </article>
        <div className="grid gap-6">
          <article className="surface section-card rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Drafts in review</p>
                <h2 className="mt-2 display-font text-2xl font-semibold">Studio status</h2>
              </div>
              <StatusPill label={`${drafts.length} active`} tone="warning" />
            </div>
            <div className="mt-5 space-y-4">
              {drafts.map((draft) => (
                <div key={draft.id} className="rounded-[1.25rem] border border-white/55 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[color:var(--foreground)]">{draft.selectedHeadline}</p>
                    <StatusPill label={draft.status} />
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--ink-soft)]">{draft.selectedSummary}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="surface section-card rounded-[1.75rem] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Publishing health</p>
                <h2 className="mt-2 display-font text-2xl font-semibold">Queue snapshot</h2>
              </div>
              <StatusPill label={`${jobs.length} jobs`} tone="success" />
            </div>
            <div className="mt-5 space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-[1.25rem] border border-white/55 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[color:var(--foreground)]">{job.channelName}</p>
                    <StatusPill
                      label={job.status}
                      tone={job.status === "failed" ? "danger" : job.status === "succeeded" ? "success" : "accent"}
                    />
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--ink-soft)]">{job.errorMessage ?? "No publish errors in the current mock state."}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
