import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import type { WorkspaceContext } from "@/lib/domain";
import { currentWorkspace } from "@/lib/workspace";

type LocalWorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  role: WorkspaceContext["role"];
  approvalRequired: boolean;
  categories: string[];
  brandVoiceNotes: string;
  createdAt: string;
};

type CreateWorkspaceInput = {
  name: string;
  slug: string;
  timezone: string;
  approvalRequired: boolean;
  categories: string[];
  brandVoiceNotes: string;
};

const storagePath = path.join(process.cwd(), "..", "..", "data", "local_workspaces.json");

async function readWorkspaceFile() {
  try {
    const raw = await fs.readFile(storagePath, "utf8");
    return JSON.parse(raw) as LocalWorkspaceRecord[];
  } catch {
    return [];
  }
}

async function writeWorkspaceFile(workspaces: LocalWorkspaceRecord[]) {
  await fs.writeFile(storagePath, `${JSON.stringify(workspaces, null, 2)}\n`, "utf8");
}

function createWorkspaceId(slug: string) {
  return `workspace-${slug}`;
}

export async function listLocalWorkspaces() {
  return readWorkspaceFile();
}

export async function getPreferredWorkspaceContext() {
  const workspaces = await readWorkspaceFile();
  const workspace = workspaces[0];

  if (!workspace) {
    return currentWorkspace;
  }

  return mapLocalWorkspaceToContext(workspace);
}

export async function createLocalWorkspace(input: CreateWorkspaceInput) {
  const workspaces = await readWorkspaceFile();
  const normalizedSlug = input.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const nextWorkspace: LocalWorkspaceRecord = {
    id: createWorkspaceId(normalizedSlug),
    name: input.name.trim(),
    slug: normalizedSlug,
    timezone: input.timezone,
    role: "owner",
    approvalRequired: input.approvalRequired,
    categories: input.categories,
    brandVoiceNotes: input.brandVoiceNotes.trim(),
    createdAt: new Date().toISOString(),
  };

  const deduped = [nextWorkspace, ...workspaces.filter((workspace) => workspace.slug !== normalizedSlug)];
  await writeWorkspaceFile(deduped);

  return nextWorkspace;
}

export function mapLocalWorkspaceToContext(workspace: LocalWorkspaceRecord): WorkspaceContext {
  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    role: workspace.role,
    timezone: workspace.timezone,
    approvalRequired: workspace.approvalRequired,
    currentUser: {
      ...currentWorkspace.currentUser,
      fullName: `${workspace.name} Owner`,
      email: currentWorkspace.currentUser.email,
      authProvider: "mock",
    },
  };
}
