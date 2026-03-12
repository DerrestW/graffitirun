import { currentWorkspace } from "@/lib/workspace";
import { getPreferredWorkspaceContext, listLocalWorkspaces } from "./local-workspace-store";

export async function getActiveWorkspace() {
  if (process.env.NODE_ENV === "development") {
    return getPreferredWorkspaceContext();
  }

  return currentWorkspace;
}

export async function getWorkspaceRoster() {
  if (process.env.NODE_ENV === "development") {
    return listLocalWorkspaces();
  }

  return [];
}
