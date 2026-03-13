import { NextResponse } from "next/server";
import sharp from "sharp";
import { getDraftDetailsById } from "@/features/drafts/draft-service";
import { customTemplateToTemplate, normalizeCustomTemplate, type CustomTemplate } from "@/features/templates/custom-template";
import { listTemplates } from "@/features/templates/template-service";
import { listTopics } from "@/features/topics/topic-service";
import { getTopicById } from "@/lib/db/queries";
import { renderDraftPng } from "@/lib/rendering/image-renderer";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const [draft, templates, topics] = await Promise.all([getDraftDetailsById(id), listTemplates(), listTopics()]);
    const searchParams = new URL(request.url).searchParams;
    const persistedTopic = draft?.topicId ? await getTopicById(draft.topicId) : null;
    const topic = draft ? topics.find((item) => item.id === draft.topicId) ?? persistedTopic ?? buildFallbackTopicFromDraft(draft) : null;
    const customTemplateParam = searchParams.get("customTemplate");
    const selectedTemplateId = searchParams.get("templateId") ?? draft?.templateId;
    const builtInTemplate = templates.find((item) => item.id === selectedTemplateId) ?? templates.find((item) => item.id === draft?.templateId);
    const template =
      customTemplateParam && draft
        ? customTemplateToTemplate(parseCustomTemplate(customTemplateParam), draft.workspaceId)
        : builtInTemplate ?? null;

    if (!draft || !template || !topic) {
      return NextResponse.json({ ok: false, error: "Render inputs not found." }, { status: 404 });
    }

    const overriddenDraft = {
      ...draft,
      selectedHeadline: searchParams.get("headline") ?? draft.selectedHeadline,
      selectedSummary: searchParams.get("summary") ?? draft.selectedSummary,
      selectedHook: searchParams.get("hook") ?? draft.selectedHook,
    };
    const overriddenTopic = {
      ...topic,
      imageUrl: searchParams.get("backgroundImageUrl") ?? topic.imageUrl,
      insetImageUrl: searchParams.get("insetImageUrl") ?? topic.insetImageUrl,
    };

    const headlineSize = Number(searchParams.get("headlineSize") ?? "");
    const summarySize = Number(searchParams.get("summarySize") ?? "");
    const format = searchParams.get("format") ?? "png";
    const overriddenTemplate = {
      ...template,
      config: template.config
        ? {
            ...template.config,
            headline: {
              ...template.config.headline,
              fontSize: Number.isFinite(headlineSize) && headlineSize > 0 ? headlineSize : template.config.headline.fontSize,
            },
            subheadline: {
              ...template.config.subheadline,
              fontSize: Number.isFinite(summarySize) && summarySize > 0 ? summarySize : template.config.subheadline.fontSize,
            },
          }
        : template.config,
    };

    const brandFonts = {
      heading: searchParams.get("headingFont") ?? undefined,
      subheading: searchParams.get("subheadingFont") ?? undefined,
    };
    const useBrandFonts = searchParams.get("useBrandFonts") !== "false";

    const image = await renderDraftPng({ draft: overriddenDraft, topic: overriddenTopic, template: overriddenTemplate, brandFonts, useBrandFonts });
    const body =
      format === "jpeg" || format === "jpg"
        ? await sharp(image).flatten({ background: "#ffffff" }).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer()
        : image;

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": format === "jpeg" || format === "jpg" ? "image/jpeg" : "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown render error" },
      { status: 500 },
    );
  }
}

function parseCustomTemplate(raw: string): CustomTemplate {
  const parsed = JSON.parse(raw) as Partial<CustomTemplate>;
  return normalizeCustomTemplate(parsed);
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
