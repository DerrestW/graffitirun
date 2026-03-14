import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

type SavePublicAssetArgs = {
  buffer: Buffer;
  contentType: string;
  extension: string;
  folder?: string;
  filenamePrefix?: string;
};

type SavePublicAssetResult = {
  publicPath: string;
  storagePath: string;
};

const DEFAULT_BUCKET = process.env.SUPABASE_ASSET_BUCKET?.trim() || "uploads";

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildFilename(prefix: string | undefined, extension: string) {
  const safePrefix = prefix ? sanitizeSegment(prefix) : "";
  const normalizedExtension = extension.replace(/^\./, "") || "bin";
  return `${safePrefix ? `${safePrefix}-` : ""}${randomUUID()}.${normalizedExtension}`;
}

async function ensureBucketExists(bucket: string) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.storage.getBucket(bucket);
  if (!error && data) {
    return supabase;
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw createError;
  }

  return supabase;
}

export async function savePublicAsset({
  buffer,
  contentType,
  extension,
  folder,
  filenamePrefix,
}: SavePublicAssetArgs): Promise<SavePublicAssetResult> {
  const filename = buildFilename(filenamePrefix, extension);
  const normalizedFolder = folder
    ?.split("/")
    .map((segment) => sanitizeSegment(segment))
    .filter(Boolean)
    .join("/");
  const storagePath = [normalizedFolder, filename].filter(Boolean).join("/");

  const supabase = await ensureBucketExists(DEFAULT_BUCKET);
  if (supabase) {
    const { error } = await supabase.storage.from(DEFAULT_BUCKET).upload(storagePath, buffer, {
      contentType,
      upsert: false,
      cacheControl: "31536000",
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(storagePath);

    return {
      publicPath: data.publicUrl,
      storagePath,
    };
  }

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error("Asset storage is not configured. Add Supabase storage credentials before saving images in production.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", normalizedFolder ?? "");
  await fs.mkdir(uploadDir, { recursive: true });
  const targetPath = path.join(uploadDir, filename);
  await fs.writeFile(targetPath, buffer);

  return {
    publicPath: `/uploads/${storagePath}`,
    storagePath,
  };
}
