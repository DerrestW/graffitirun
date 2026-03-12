import type { WorkspaceContext } from "@/lib/domain";

export const currentWorkspace: WorkspaceContext = {
  workspaceId: "22222222-2222-2222-2222-222222222222",
  workspaceName: "Graffiti Run",
  workspaceSlug: "graffiti-run",
  role: "owner",
  timezone: "America/Chicago",
  approvalRequired: true,
  currentUser: {
    id: "11111111-1111-1111-1111-111111111111",
    email: "owner@graffitirun.local",
    fullName: "Graffiti Run Owner",
    authProvider: "mock",
  },
};

export function resolveWorkspaceContext(): WorkspaceContext {
  return currentWorkspace;
}
