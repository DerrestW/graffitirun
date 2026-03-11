import type { WorkspaceContext } from "@/lib/domain";

export const currentWorkspace: WorkspaceContext = {
  workspaceId: "workspace-graffiti-run",
  workspaceName: "Graffiti Run",
  workspaceSlug: "graffiti-run",
  role: "owner",
  timezone: "America/Chicago",
  approvalRequired: true,
  currentUser: {
    id: "user-graffiti-run-owner",
    email: "owner@graffitirun.local",
    fullName: "Graffiti Run Owner",
    authProvider: "mock",
  },
};

export function resolveWorkspaceContext(): WorkspaceContext {
  return currentWorkspace;
}
