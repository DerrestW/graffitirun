import { NextResponse } from "next/server";
import { savePublicAsset } from "@/lib/assets/storage";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No image file provided." }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Unsupported image format." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { publicPath } = await savePublicAsset({
      buffer,
      contentType: file.type,
      extension: extensionFor(file),
      folder: "topic-images",
      filenamePrefix: "topic",
    });

    return NextResponse.json({ ok: true, path: publicPath });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 },
    );
  }
}
