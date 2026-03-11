import { getWorkspaceContext } from "@/lib/db/queries";

export async function getActiveWorkspace() {
  return getWorkspaceContext();
}
