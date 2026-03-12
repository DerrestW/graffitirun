import { AppShell } from "@/components/app-shell";
import { ActionBanner } from "@/components/action-banner";
import { BarList } from "@/components/bar-list";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { SyncMetaInsightsButton } from "@/features/analytics/components/sync-meta-insights-button";
import { getAnalyticsSnapshot } from "@/features/analytics/analytics-service";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { formatCompactNumber, formatPercent } from "@/lib/formatters";
import { getMetaIntegrationStatus } from "@/lib/integrations/meta";

type AnalyticsPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const resolvedSearchParams = await searchParams;
  const [workspace, analytics] = await Promise.all([getActiveWorkspace(), getAnalyticsSnapshot()]);
  const meta = getMetaIntegrationStatus();

  return (
    <AppShell workspace={workspace}>
      <ActionBanner status={resolvedSearchParams?.status} />
      <PageHeader
        eyebrow="Analytics"
        title="Operational insight with live-sync-ready structure"
        description="Local dashboards use seeded metrics, but the service shape and database tables already match a future connector-driven sync loop for Facebook performance data."
        badge={analytics.recentDelta}
      />
      <div className="flex justify-end">
        <SyncMetaInsightsButton />
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Posts Published" value={String(analytics.postsPublished)} detail="Seeded last-7-day output" />
        <MetricCard label="Average Reach" value={formatCompactNumber(analytics.avgReach)} detail="Per published post" />
        <MetricCard label="Average Shares" value={formatCompactNumber(analytics.avgShares)} detail="Shareability signal across top categories" />
        <MetricCard label="Engagement Rate" value={formatPercent(analytics.avgEngagementRate)} detail="Used by future insight agent" />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <MetricCard
          label="Estimated Earnings"
          value={`$${formatCompactNumber(analytics.estimatedEarnings)}`}
          detail="Stored now and ready for connector-backed monetization sync when available."
        />
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Meta insights readiness</p>
          <div className="mt-4 space-y-3 text-sm text-[color:var(--ink-soft)]">
            <p>Performance sync: {meta.insightsReady ? "configured" : "not configured"}</p>
            <p>Monetization sync: {meta.monetizationReady ? "configured" : "not configured"}</p>
            <p>Until enabled, earnings stay seeded or manually imported.</p>
          </div>
        </article>
        <article className="surface rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Connector note</p>
          <div className="mt-4 space-y-3 text-sm text-[color:var(--ink-soft)]">
            <p>Operational metrics and monetization metrics should sync separately.</p>
            <p>This keeps normal analytics useful even when Meta does not expose earnings for a Page.</p>
          </div>
        </article>
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
