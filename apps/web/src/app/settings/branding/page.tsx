import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { BrandingSettingsEditor } from "@/features/settings/components/branding-settings-editor";
import { getActiveWorkspace } from "@/features/workspaces/workspace-service";
import { brandingSettingsView } from "@/lib/settings";

const settingsTabs = [
  { href: "/settings/workspace", label: "Workspace" },
  { href: "/settings/branding", label: "Branding" },
  { href: "/settings/sources", label: "Sources" },
  { href: "/settings/connections", label: "Connections" },
];

export default async function BrandingSettingsPage() {
  const workspace = await getActiveWorkspace();

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Branding"
        title="Tune the visual system per workspace"
        description="A real SaaS version needs logos, fonts, colors, and default templates to be editable per customer. This screen establishes that configuration surface."
        badge="brand system"
      />
      <SettingsTabs currentHref="/settings/branding" />
      <BrandingSettingsEditor initialSettings={brandingSettingsView} />
      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Template defaults</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SettingCard label="Heading font" value={brandingSettingsView.headingFont} />
          <SettingCard label="Subheading font" value={brandingSettingsView.subheadingFont} />
          <SettingCard label="Body font" value={brandingSettingsView.bodyFont} />
          <SettingCard label="Watermark style" value={brandingSettingsView.watermarkStyle.replace("_", " ")} />
          <SettingCard label="Feed default" value={brandingSettingsView.defaultTemplateIds.feed} />
          <SettingCard label="Story default" value={brandingSettingsView.defaultTemplateIds.story} />
        </div>
      </article>
    </AppShell>
  );
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

function SettingCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 text-base font-semibold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
