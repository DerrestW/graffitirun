import "server-only";

import { can, type Permission } from "@/lib/rbac";
import { getWorkspaceContext } from "@/lib/db/queries";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requirePermission(permission: Permission) {
  const workspace = await getWorkspaceContext();

  if (!can(workspace.role, permission)) {
    throw new AuthorizationError(`Role ${workspace.role} cannot perform ${permission}.`);
  }

  return workspace;
}
