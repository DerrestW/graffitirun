import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { WorkspaceCreator } from "@/features/workspaces/components/workspace-creator";
import { getActiveWorkspace, getWorkspaceRoster } from "@/features/workspaces/workspace-service";

export default async function NewWorkspacePage() {
  const [workspace, roster] = await Promise.all([getActiveWorkspace(), getWorkspaceRoster()]);

  return (
    <AppShell workspace={workspace}>
      <PageHeader
        eyebrow="Workspace Setup"
        title="Create a new workspace like a future customer"
        description="This is the first-run path for agencies, brands, and page owners. Set the operational defaults first, then move into branding, templates, sources, and channel connections."
        badge={`${roster.length + 1} total workspaces`}
      />
      <WorkspaceCreator />
    </AppShell>
  );
}
