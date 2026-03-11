import type { WorkspaceRole } from "@/lib/domain";

const permissions: Record<string, readonly WorkspaceRole[]> = {
  viewWorkspace: ["owner", "admin", "editor", "reviewer", "analyst"],
  manageMembers: ["owner", "admin"],
  manageTemplates: ["owner", "admin"],
  viewTopics: ["owner", "admin", "editor", "reviewer", "analyst"],
  createDrafts: ["owner", "admin", "editor"],
  approveDrafts: ["owner", "admin", "reviewer"],
  publishDrafts: ["owner", "admin", "editor"],
  viewAnalytics: ["owner", "admin", "analyst"],
};

export type Permission = keyof typeof permissions;

export function can(role: WorkspaceRole, permission: Permission) {
  return permissions[permission].includes(role);
}
