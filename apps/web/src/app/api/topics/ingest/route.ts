import { NextResponse } from "next/server";
import { runTopicIngestion } from "@/lib/operations/ingestion";

export async function POST() {
  try {
    const results = await runTopicIngestion();

    return NextResponse.json({
      ok: true,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown ingestion error",
      },
      { status: 500 },
    );
  }
}
