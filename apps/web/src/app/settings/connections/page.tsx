import Link from "next/link";
import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { ActionBanner } from "@/components/action-banner";
import { PageHeader } from "@/components/page-header";
import { ConnectionSetupPanel } from "@/features/settings/components/connection-setup-panel";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { getMetaIntegrationStatus, getStoredFacebookConnection, type MetaPageOption } from "@/lib/integrations/meta";
import { getXIntegrationStatus } from "@/lib/integrations/x";
import { connectionSettingsView } from "@/lib/settings";

const settingsTabs = [
  { href: "/settings/workspace", label: "Workspace" },
  { href: "/settings/branding", label: "Branding" },
  { href: "/settings/sources", label: "Sources" },
  { href: "/settings/connections", label: "Connections" },
];

type ConnectionsSettingsPageProps = {
  searchParams?: Promise<{ connector?: string; status?: string; error?: string }>;
};

export default async function ConnectionsSettingsPage({ searchParams }: ConnectionsSettingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const encodedPages = cookieStore.get("gr_fb_pages")?.value;
  const facebookPages = decodePagesCookie(encodedPages);
  const [workspace, metaStatus, xStatus, facebookConnection] = await Promise.all([
    getActiveWorkspace(),
    getMetaIntegrationStatus(),
    getXIntegrationStatus(),
    getStoredFacebookConnection(),
  ]);

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Connections"
        title="Plug in the social accounts that actually publish"
        description="This is where the product becomes customer-usable: secure social connectors, per-channel status, and future multi-network rollout without rewriting the workflow."
        badge="channel setup"
      />
      <ActionBanner status={resolvedSearchParams?.status} />
      {resolvedSearchParams?.error ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}
      <SettingsTabs currentHref="/settings/connections" />
      <ConnectionSetupPanel
        connector={resolvedSearchParams?.connector}
        metaStatus={metaStatus}
        xStatus={xStatus}
        facebookPages={facebookPages}
        facebookConnectedPage={
          facebookConnection
            ? {
                id: facebookConnection.pageId,
                name: facebookConnection.pageName ?? "Facebook Page",
                source: facebookConnection.source,
              }
            : null
        }
      />
      <section className="grid gap-6 lg:grid-cols-3">
        <ConnectionCard
          label="Facebook Page"
          description={connectionSettingsView.facebook.displayName}
          status={connectionSettingsView.facebook.status.replace("_", " ")}
          tone="accent"
          href="/settings/connections?connector=facebook"
        />
        <ConnectionCard
          label="Instagram"
          description="Future publishing lane"
          status={connectionSettingsView.instagram.status.replace("_", " ")}
          tone="default"
          href="/settings/connections?connector=instagram"
        />
        <ConnectionCard
          label="X"
          description={connectionSettingsView.x.displayName}
          status={connectionSettingsView.x.status.replace("_", " ")}
          tone="accent"
          href="/settings/connections?connector=x"
        />
      </section>
      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">What customers will control here</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            "Connect a Facebook Page and store tokens securely",
            "Choose a default publish channel per workspace",
            "View connector health and last sync status",
            "Add future Instagram, X, and multi-channel posting",
          ].map((item) => (
            <div key={item} className="rounded-[1.25rem] bg-white/80 p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
              {item}
            </div>
          ))}
        </div>
      </article>
    </AppShell>
  );
}

function decodePagesCookie(value: string | undefined): MetaPageOption[] {
  if (!value) {
    return [];
  }

  try {
    const raw = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as MetaPageOption[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function SettingsTabs({ currentHref }: { currentHref: string }) {
  return (
    <div className="surface rounded-[1.5rem] p-2">
      <div className="flex flex-wrap gap-2">
        {settingsTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-3 text-sm font-semibold no-underline transition ${
              currentHref === tab.href
                ? "border border-[#0f2d3b] bg-[color:var(--navy)] !text-white shadow-[0_10px_24px_rgba(20,56,74,0.24)] hover:brightness-110"
                : "border border-[color:var(--border)] bg-white !text-[color:var(--foreground)] shadow-[0_6px_18px_rgba(15,23,42,0.06)] hover:bg-[#fffaf3]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ConnectionCard({
  label,
  description,
  status,
  tone,
  href,
}: {
  label: string;
  description: string;
  status: string;
  tone: "accent" | "default";
  href: string;
}) {
  return (
    <article className="surface rounded-[1.75rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-[color:var(--foreground)]">{label}</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            tone === "accent" ? "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]" : "bg-[#ece8dd] text-[color:var(--muted)]"
          }`}
        >
          {status}
        </span>
      </div>
      <Link
        href={href}
        className={`mt-6 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold no-underline transition ${
          tone === "accent"
            ? "bg-[color:var(--navy)] !text-white shadow-[0_10px_24px_rgba(20,56,74,0.22)] hover:brightness-110"
            : "border border-[color:var(--border)] bg-white !text-[color:var(--foreground)] hover:bg-[#f6f1e9]"
        }`}
      >
        {tone === "accent" ? "Configure connector" : "View roadmap"}
      </Link>
    </article>
  );
}
