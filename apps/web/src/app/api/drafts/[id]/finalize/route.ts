import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { AuthorizationError, requirePermission } from "@/lib/authz";
import { getDraftDetailsById } from "@/features/drafts/draft-service";
import { customTemplateToTemplate, normalizeCustomTemplate, type CustomTemplate } from "@/features/templates/custom-template";
import { listTemplates } from "@/features/templates/template-service";
import { listTopics } from "@/features/topics/topic-service";
import { getTopicById, getWorkspaceContext } from "@/lib/db/queries";
import { renderDraftPng } from "@/lib/rendering/image-renderer";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    await requirePermission("publishDrafts");
    const { id } = await params;
    const body = (await request.json()) as {
      headline?: string;
      summary?: string;
      hook?: string;
      headlineSize?: number;
      summarySize?: number;
      backgroundImageUrl?: string;
      insetImageUrl?: string;
      templateId?: string;
      customTemplate?: Partial<CustomTemplate> | null;
      headingFont?: string;
      subheadingFont?: string;
      bodyFont?: string;
      useBrandFonts?: boolean;
    };

    const [draft, templates, topics] = await Promise.all([getDraftDetailsById(id), listTemplates(), listTopics()]);
    if (!draft) {
      return NextResponse.json({ ok: false, error: "Draft not found." }, { status: 404 });
    }

    const persistedTopic = draft.topicId ? await getTopicById(draft.topicId) : null;
    const topic =
      topics.find((item) => item.id === draft.topicId) ??
      persistedTopic ??
      buildFallbackTopicFromDraft(draft);
    const selectedTemplateId = String(body.templateId ?? draft.templateId);
    const builtInTemplate = templates.find((item) => item.id === selectedTemplateId) ?? templates.find((item) => item.id === draft.templateId);
    const template =
      body.customTemplate
        ? customTemplateToTemplate(normalizeCustomTemplate(body.customTemplate), draft.workspaceId)
        : builtInTemplate;

    if (!template || !topic) {
      return NextResponse.json({ ok: false, error: "Finalize inputs not found." }, { status: 404 });
    }

    const finalizedDraft = {
      ...draft,
      selectedHeadline: String(body.headline ?? draft.selectedHeadline),
      selectedSummary: String(body.summary ?? draft.selectedSummary),
      selectedHook: String(body.hook ?? draft.selectedHook),
      templateId: template.id,
    };
    const finalizedTopic = {
      ...topic,
      imageUrl: String(body.backgroundImageUrl ?? topic.imageUrl ?? ""),
      insetImageUrl: String(body.insetImageUrl ?? topic.insetImageUrl ?? ""),
    };

    const sizedTemplate = template.config
      ? {
          ...template,
          config: {
            ...template.config,
            headline: {
              ...template.config.headline,
              fontSize: Number.isFinite(Number(body.headlineSize)) && Number(body.headlineSize) > 0 ? Number(body.headlineSize) : template.config.headline.fontSize,
            },
            subheadline: {
              ...template.config.subheadline,
              fontSize: Number.isFinite(Number(body.summarySize)) && Number(body.summarySize) > 0 ? Number(body.summarySize) : template.config.subheadline.fontSize,
            },
          },
        }
      : template;

    const png = await renderDraftPng({
      draft: finalizedDraft,
      topic: finalizedTopic,
      template: sizedTemplate,
      brandFonts: {
        heading: body.headingFont,
        subheading: body.subheadingFont,
        body: body.bodyFont,
      },
      useBrandFonts: body.useBrandFonts !== false,
    });
    const jpeg = await sharp(png)
      .resize(template.width, template.height, { fit: "cover", position: "centre" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
      .toBuffer();

    const uploadDir = path.join(process.cwd(), "public", "uploads", "finalized");
    await fs.mkdir(uploadDir, { recursive: true });
    const filename = `${draft.id}-${randomUUID()}.jpg`;
    const targetPath = path.join(uploadDir, filename);
    await fs.writeFile(targetPath, jpeg);
    const publicPath = `/uploads/finalized/${filename}`;

    const supabase = createAdminSupabaseClient();
    const workspace = await getWorkspaceContext();
    if (supabase) {
      await supabase
        .from("drafts")
        .update({
          selected_headline: finalizedDraft.selectedHeadline,
          selected_summary: finalizedDraft.selectedSummary,
          selected_hook: finalizedDraft.selectedHook,
          rendered_asset_path: publicPath,
          template_id: body.customTemplate ? draft.templateId : template.id,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", draft.id)
        .eq("workspace_id", workspace.workspaceId);
    }

    return NextResponse.json({
      ok: true,
      status: "draft_finalized",
      assetPath: publicPath,
      imageUrl: publicPath,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ ok: false, error: "Unauthorized", status: "unauthorized" }, { status: 403 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to finalize draft." },
      { status: 500 },
    );
  }
}

function buildFallbackTopicFromDraft(draft: NonNullable<Awaited<ReturnType<typeof getDraftDetailsById>>>) {
  return {
    id: draft.topicId,
    workspaceId: draft.workspaceId,
    title: draft.selectedHeadline,
    summary: draft.selectedSummary,
    category: "archived",
    sourceUrl: "",
    sourceDomain: "saved-draft",
    publishedAt: draft.scheduledFor ?? new Date().toISOString(),
    imageUrl: "",
    insetImageUrl: "",
    status: "drafted" as const,
    scores: {
      freshness: 0,
      viral: 0,
      brandFit: 0,
      rightsRisk: 0,
      tragedyRisk: 0,
      politicalRisk: 0,
      duplicateRisk: 0,
      final: 0,
    },
    safetyNotes: ["Historical draft loaded without an active topic queue entry."],
    rightsNotes: ["Replace or upload a fresh image before publish if the original asset is unavailable."],
  };
}
