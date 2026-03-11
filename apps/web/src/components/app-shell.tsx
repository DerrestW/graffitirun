"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/features/auth/components/auth-button";
import type { WorkspaceContext } from "@/lib/domain";
import { navigation } from "@/lib/navigation";

type AppShellProps = {
  workspace: WorkspaceContext;
  children: React.ReactNode;
};

export function AppShell({ workspace, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-5 lg:px-6">
      <aside className="surface hidden w-72 shrink-0 rounded-[2rem] p-5 lg:flex lg:flex-col">
        <div className="rounded-[1.5rem] bg-[color:var(--navy)] p-5 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-white/60">Workspace</p>
          <h2 className="mt-3 display-font text-2xl font-semibold">{workspace.workspaceName}</h2>
          <p className="mt-2 text-sm text-white/72">{workspace.timezone} • {workspace.role}</p>
          <p className="mt-3 text-sm text-white/80">{workspace.currentUser.fullName}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-white/55">{workspace.currentUser.email}</p>
        </div>
        <nav className="mt-6 flex flex-col gap-2">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                    : "text-[color:var(--ink-soft)] hover:bg-white/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="surface-strong mt-auto rounded-[1.5rem] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Policy</p>
          <p className="mt-2 text-sm text-[color:var(--foreground)]">
            {workspace.approvalRequired ? "Approval required before publish." : "Workspace can publish without approval."}
          </p>
          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">Single-workspace MVP, multi-tenant-ready model.</p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="surface mb-6 flex items-center justify-between rounded-[1.75rem] px-5 py-4 lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">{workspace.workspaceName}</p>
            <p className="display-font text-xl font-semibold">Content Engine</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[color:var(--ink-soft)]">{workspace.role}</p>
            <p className="text-xs text-[color:var(--muted)]">{workspace.currentUser.email}</p>
          </div>
        </div>
        <div className="mb-6 flex items-center justify-end">
          <AuthButton signedIn={workspace.currentUser.authProvider === "supabase"} />
        </div>
        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
