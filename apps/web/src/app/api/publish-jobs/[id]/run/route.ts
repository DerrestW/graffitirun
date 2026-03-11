import { NextResponse } from "next/server";
import { runPublishJob } from "@/lib/operations/publishing";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const result = await runPublishJob(id);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown publish execution error",
      },
      { status: 500 },
    );
  }
}
