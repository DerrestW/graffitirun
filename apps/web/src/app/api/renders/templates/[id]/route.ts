import { NextResponse } from "next/server";
import { getDraftDetailsById } from "@/features/drafts/draft-service";
import { listTemplates } from "@/features/templates/template-service";
import { listTopics } from "@/features/topics/topic-service";
import { renderDraftPng } from "@/lib/rendering/image-renderer";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const [templates, topics] = await Promise.all([listTemplates(), listTopics()]);
    const template = templates.find((item) => item.id === id);
    const topic = topics[0];
    const draft = topic ? await getDraftDetailsById(topic.id) : null;

    if (!template || !draft || !topic) {
      return NextResponse.json({ ok: false, error: "Template render inputs not found." }, { status: 404 });
    }

    const image = await renderDraftPng({
      draft: {
        ...draft,
        templateId: template.id,
      },
      topic,
      template,
    });

    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown template render error" },
      { status: 500 },
    );
  }
}
