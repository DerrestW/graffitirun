import Link from "next/link";
import type { WorkspaceContext } from "@/lib/domain";
import { navigation } from "@/lib/navigation";

type AppShellProps = {
  workspace: WorkspaceContext;
  children: React.ReactNode;
};

export function AppShell({ workspace, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1660px] gap-6 px-4 py-5 lg:px-6">
      <aside className="hidden w-80 shrink-0 rounded-[2rem] border border-[#203844] bg-[linear-gradient(180deg,#0f2631,#142f3d)] p-5 text-white shadow-[0_30px_80px_rgba(11,20,26,0.22)] lg:flex lg:flex-col">
        <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-sm font-bold tracking-[0.24em] text-white">
              GR
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#f0c889]">Workspace</p>
              <h2 className="display-font text-[2rem] font-semibold text-white">{workspace.workspaceName}</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/76">
            Viral-safe discovery, original drafting, review, publishing, and analytics from one control room.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Status label={workspace.role} />
            <Status label={workspace.timezone} />
          </div>
        </div>
        <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/16 p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#f0c889]">Operator</p>
          <p className="mt-2 text-base font-semibold text-white">{workspace.currentUser.fullName}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-white/58">{workspace.currentUser.email}</p>
        </div>
        <nav className="mt-6 flex flex-col gap-2">
          {navigation.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-white/86 transition hover:border-white/8 hover:bg-white/10 hover:text-white"
              >
                <span className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span className="text-white/28">/</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[1.5rem] border border-white/8 bg-white/6 p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#f0c889]">Policy</p>
          <p className="mt-2 text-sm leading-6 text-white">
            {workspace.approvalRequired ? "Approval required before publish." : "Workspace can publish without approval."}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/68">Single-workspace MVP, multi-tenant-ready model.</p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="hero-panel mb-6 flex items-center justify-between rounded-[1.75rem] px-5 py-4 text-white lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/58">{workspace.workspaceName}</p>
            <p className="display-font text-xl font-semibold">Content Engine</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/78">{workspace.role}</p>
            <p className="text-xs text-white/52">{workspace.currentUser.email}</p>
          </div>
        </div>
        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}

function Status({ label }: { label: string }) {
  return <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/72">{label}</span>;
}
