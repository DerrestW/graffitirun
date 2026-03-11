import { AppShell } from "@/components/app-shell";
import { BarList } from "@/components/bar-list";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { getAnalyticsSnapshot } from "@/features/analytics/analytics-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { formatCompactNumber, formatPercent } from "@/lib/formatters";

export default async function AnalyticsPage() {
  const [workspace, analytics] = await Promise.all([getActiveWorkspace(), getAnalyticsSnapshot()]);

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Analytics"
        title="Operational insight with live-sync-ready structure"
        description="Local dashboards use seeded metrics, but the service shape and database tables already match a future connector-driven sync loop for Facebook performance data."
        badge={analytics.recentDelta}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Posts Published" value={String(analytics.postsPublished)} detail="Seeded last-7-day output" />
        <MetricCard label="Average Reach" value={formatCompactNumber(analytics.avgReach)} detail="Per published post" />
        <MetricCard label="Average Shares" value={formatCompactNumber(analytics.avgShares)} detail="Shareability signal across top categories" />
        <MetricCard label="Engagement Rate" value={formatPercent(analytics.avgEngagementRate)} detail="Used by future insight agent" />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Category Performance</p>
          <h2 className="mt-2 display-font text-2xl font-semibold">Winners by category</h2>
          <div className="mt-5">
            <BarList items={analytics.categoryPerformance.map((item) => ({ label: item.category, value: item.value }))} />
          </div>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Template Performance</p>
          <h2 className="mt-2 display-font text-2xl font-semibold">Format impact</h2>
          <div className="mt-5">
            <BarList
              items={analytics.templatePerformance.map((item) => ({ label: item.template, value: item.value }))}
              accent="var(--navy)"
            />
          </div>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Posting Windows</p>
          <h2 className="mt-2 display-font text-2xl font-semibold">Best time blocks</h2>
          <div className="mt-5">
            <BarList
              items={analytics.postingWindows.map((item) => ({ label: item.label, value: item.value }))}
              accent="var(--success)"
            />
          </div>
        </article>
      </section>
    </AppShell>
  );
}
