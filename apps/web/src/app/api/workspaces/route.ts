import { NextResponse } from "next/server";
import { createLocalWorkspace } from "@/features/workspaces/local-workspace-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      timezone?: string;
      approvalRequired?: boolean;
      categories?: string[];
      brandVoiceNotes?: string;
    };

    if (!body.name?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ ok: false, error: "Workspace name and slug are required." }, { status: 400 });
    }

    const workspace = await createLocalWorkspace({
      name: body.name,
      slug: body.slug,
      timezone: body.timezone?.trim() || "America/Chicago",
      approvalRequired: body.approvalRequired ?? true,
      categories: body.categories?.length ? body.categories : ["sports", "weather", "running", "health"],
      brandVoiceNotes: body.brandVoiceNotes ?? "",
    });

    return NextResponse.json({ ok: true, workspace });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Workspace creation failed." }, { status: 500 });
  }
}
