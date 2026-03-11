import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BarList } from "@/components/bar-list";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { getAnalyticsSnapshot } from "@/features/analytics/analytics-service";
import { listDrafts } from "@/features/drafts/draft-service";
import { listPublishJobs } from "@/features/publishing/publishing-service";
import { listTopics } from "@/features/topics/topic-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { formatCompactNumber, formatDateTime, formatPercent } from "@/lib/formatters";

export default async function DashboardPage() {
  const [workspace, analytics, topics, drafts, jobs] = await Promise.all([
    getActiveWorkspace(),
    getAnalyticsSnapshot(),
    listTopics(),
    listDrafts(),
    listPublishJobs(),
  ]);

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow={workspace.workspaceName}
        title="Content operations at a glance"
        description="Review ranked opportunities, move drafts through approval, and keep the publishing queue ready for Facebook wiring without sacrificing source traceability."
        badge={workspace.approvalRequired ? "Approval Enabled" : "Approval Optional"}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Published This Week" value={String(analytics.postsPublished)} detail={analytics.recentDelta} />
        <MetricCard label="Average Reach" value={formatCompactNumber(analytics.avgReach)} detail="Across last 7 days of seeded metrics" />
        <MetricCard label="Engagement Rate" value={formatPercent(analytics.avgEngagementRate)} detail="High-share categories are leading this week" />
        <MetricCard label="Estimated Earnings" value={`$${formatCompactNumber(analytics.estimatedEarnings)}`} detail="Mocked revenue trend aligned to dashboard KPI" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="surface rounded-[1.75rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Ranked Topics</p>
              <h2 className="mt-2 display-font text-2xl font-semibold">Today’s best opportunities</h2>
            </div>
            <Link href="/topics" className="text-sm font-medium text-[color:var(--accent-strong)]">
              Open queue
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {topics.map((topic) => (
              <div key={topic.id} className="surface-strong rounded-[1.5rem] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={topic.category} tone="accent" />
                      <StatusPill label={`score ${topic.scores.final}`} />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">{topic.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{topic.summary}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-white/80 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Published</p>
                    <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">{formatDateTime(topic.publishedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
        <div className="grid gap-6">
          <article className="surface rounded-[1.75rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Review Status</p>
            <h2 className="mt-2 display-font text-2xl font-semibold">Draft approvals</h2>
            <div className="mt-5 space-y-4">
              {drafts.map((draft) => (
                <div key={draft.id} className="rounded-[1.25rem] bg-white/75 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[color:var(--foreground)]">{draft.selectedHeadline}</p>
                    <StatusPill label={draft.status.replace("_", " ")} tone="warning" />
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{draft.selectedSummary}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="surface rounded-[1.75rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Queue health</p>
            <h2 className="mt-2 display-font text-2xl font-semibold">Publishing readiness</h2>
            <div className="mt-5 space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-[1.25rem] bg-white/75 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[color:var(--foreground)]">{job.channelName}</p>
                    <StatusPill
                      label={job.status}
                      tone={job.status === "succeeded" ? "success" : job.status === "failed" ? "danger" : "accent"}
                    />
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{formatDateTime(job.scheduledFor)}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="surface rounded-[1.75rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Performance Mix</p>
            <h2 className="mt-2 display-font text-2xl font-semibold">Top categories</h2>
            <div className="mt-5">
              <BarList items={analytics.categoryPerformance.map((item) => ({ label: item.category, value: item.value }))} />
            </div>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
