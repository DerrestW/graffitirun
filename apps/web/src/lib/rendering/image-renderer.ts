import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Draft, Template, Topic } from "@/lib/domain";

type RenderInputs = {
  draft: Draft;
  topic: Topic;
  template: Template;
  brandFonts?: {
    heading?: string | null;
    subheading?: string | null;
    body?: string | null;
  };
  useBrandFonts?: boolean;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(text: string, lineLength: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= lineLength) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

async function readPublicAsset(assetPath: string) {
  const normalized = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  const publicPath = path.join(process.cwd(), "public", normalized);
  return fs.readFile(publicPath);
}

async function loadImageBuffer(source?: string) {
  if (!source) {
    return null;
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote image: ${source}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  if (source.startsWith("/")) {
    return readPublicAsset(source);
  }

  return null;
}

function buildGradientOverlay(width: number, height: number, opacity: number, startColor = "12,16,20", endColor = "8,10,14") {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(${startColor},${opacity * 0.2})" />
          <stop offset="68%" stop-color="rgba(${endColor},${opacity})" />
          <stop offset="100%" stop-color="rgba(${endColor},${Math.min(opacity + 0.18, 0.92)})" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#shade)" />
    </svg>
  `);
}

function buildLogoOverlay(template: Template) {
  const logo = template.config?.logo;
  if (!logo) {
    return null;
  }

  return loadImageBuffer("/brand/graffiti-run-badge.svg").then((input) =>
    input
      ? sharp(input)
          .resize({ width: logo.width })
          .png()
          .toBuffer()
          .then((buffer) => ({
            input: buffer,
            top: logo.y,
            left: logo.x,
          }))
      : null,
  );
}

function buildInsetOverlay(template: Template, topic: Topic) {
  const inset = template.config?.insetImage;
  if (!inset || !topic.insetImageUrl) {
    return Promise.resolve(null);
  }

  return loadImageBuffer(topic.insetImageUrl).then(async (input) => {
    if (!input) {
      return null;
    }

    const cornerRadius = inset.cornerRadius ?? 999;
    const maskSvg =
      cornerRadius >= inset.size / 2
        ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="${inset.size}" height="${inset.size}" viewBox="0 0 ${inset.size} ${inset.size}">
              <circle cx="${inset.size / 2}" cy="${inset.size / 2}" r="${inset.size / 2 - inset.borderWidth}" fill="white" />
            </svg>
          `
        : `
            <svg xmlns="http://www.w3.org/2000/svg" width="${inset.size}" height="${inset.size}" viewBox="0 0 ${inset.size} ${inset.size}">
              <rect x="${inset.borderWidth}" y="${inset.borderWidth}" width="${inset.size - inset.borderWidth * 2}" height="${inset.size - inset.borderWidth * 2}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white" />
            </svg>
          `;
    const borderSvg =
      cornerRadius >= inset.size / 2
        ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="${inset.size}" height="${inset.size}" viewBox="0 0 ${inset.size} ${inset.size}">
              <circle cx="${inset.size / 2}" cy="${inset.size / 2}" r="${inset.size / 2 - inset.borderWidth / 2}" fill="none" stroke="${inset.borderColor}" stroke-width="${inset.borderWidth}" />
            </svg>
          `
        : `
            <svg xmlns="http://www.w3.org/2000/svg" width="${inset.size}" height="${inset.size}" viewBox="0 0 ${inset.size} ${inset.size}">
              <rect x="${inset.borderWidth / 2}" y="${inset.borderWidth / 2}" width="${inset.size - inset.borderWidth}" height="${inset.size - inset.borderWidth}" rx="${cornerRadius}" ry="${cornerRadius}" fill="none" stroke="${inset.borderColor}" stroke-width="${inset.borderWidth}" />
            </svg>
          `;

    const clipped = await sharp(input)
      .resize(inset.size, inset.size, { fit: "cover", position: "centre" })
      .composite([
        {
          input: Buffer.from(maskSvg),
          blend: "dest-in",
        },
        {
          input: Buffer.from(borderSvg),
        },
      ])
      .png()
      .toBuffer();

    return {
      input: clipped,
      top: inset.y,
      left: inset.x,
    };
  });
}

type HeadlineOverlay = {
  input: Buffer;
  top: number;
  left: number;
  width: number;
  height: number;
};

const BUNDLED_RENDER_FONT = path.join(process.cwd(), "public", "fonts", "NotoSans-Variable.ttf");

async function renderTextBuffer({
  lines,
  width,
  fontSize,
  lineHeight,
  color,
}: {
  lines: string[];
  width: number;
  fontSize: number;
  lineHeight: number;
  color: string;
}) {
  return sharp({
    text: {
      text: `<span foreground="${color}">${escapeXml(lines.join("\n"))}</span>`,
      width,
      rgba: true,
      align: "left",
      wrap: "word-char",
      font: "Noto Sans Bold",
      fontfile: BUNDLED_RENDER_FONT,
      dpi: Math.max(Math.round(fontSize * 4), 72),
      spacing: Math.max(Math.round((lineHeight - fontSize) * 0.75), 0),
    },
  })
    .png()
    .toBuffer();
}

async function buildHeadlineStrip(template: Template, draft: Draft): Promise<HeadlineOverlay | null> {
  const headline = template.config?.headline;
  if (!headline) {
    return null;
  }

  const lineLength = template.templateType === "story" ? 26 : 30;
  const lines = wrapText(draft.selectedHeadline, lineLength).slice(0, 2);
  const lineHeight = headline.fontSize * 1.08;
  const textBuffer = await renderTextBuffer({
    lines,
    width: Math.max(headline.width - headline.paddingX * 2, 100),
    fontSize: Math.max(Math.round(headline.fontSize), 16),
    lineHeight,
    color: headline.color,
  });
  const textMeta = await sharp(textBuffer).metadata();
  const stripHeight = Math.max(
    Math.ceil((textMeta.height ?? lines.length * lineHeight) + headline.paddingY * 2),
    Math.ceil(lines.length * lineHeight + headline.paddingY * 2),
    headline.fontSize + headline.paddingY * 2,
  );

  const strip = await sharp({
    create: {
      width: headline.width,
      height: Math.ceil(stripHeight),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${headline.width}" height="${stripHeight}" viewBox="0 0 ${headline.width} ${stripHeight}">
            <rect width="${headline.width}" height="${stripHeight}" rx="${headline.radius ?? 14}" fill="${headline.backgroundColor}" />
          </svg>
        `),
      },
      {
        input: textBuffer,
        top: headline.paddingY,
        left: headline.paddingX,
      },
    ])
    .png()
    .toBuffer();

  const rotated =
    headline.rotation !== 0
      ? await sharp(strip)
          .rotate(headline.rotation, {
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer()
      : strip;
  const rotatedMeta = await sharp(rotated).metadata();

  return {
    input: rotated,
    top: headline.y,
    left: headline.x,
    width: rotatedMeta.width ?? headline.width,
    height: rotatedMeta.height ?? Math.ceil(stripHeight),
  };
}

async function buildSubheadlineOverlay(template: Template, draft: Draft, headlineOverlay?: HeadlineOverlay | null) {
  const subheadline = template.config?.subheadline;
  const emphasis = template.config?.emphasis;
  if (!subheadline || !emphasis) {
    return null;
  }

  const lines = wrapText(draft.selectedSummary, template.templateType === "story" ? 28 : 34).slice(0, 3);
  const lineHeight = subheadline.fontSize * 1.08;
  const paddingX = subheadline.paddingX ?? 0;
  const paddingY = subheadline.paddingY ?? 0;
  const subheadlineColor = subheadline.color;
  const backgroundColor = subheadline.backgroundColor;
  const radius = subheadline.radius ?? 18;
  const textBuffer = await renderTextBuffer({
    lines,
    width: Math.max(subheadline.width - paddingX * 2, 120),
    fontSize: Math.max(Math.round(subheadline.fontSize), 16),
    lineHeight,
    color: subheadlineColor,
  });
  const textMeta = await sharp(textBuffer).metadata();
  const height = Math.max(
    Math.ceil((textMeta.height ?? lines.length * lineHeight) + paddingY * 2),
    Math.ceil(lines.length * lineHeight + 24 + paddingY * 2),
    subheadline.fontSize + paddingY * 2,
  );

  const composites: sharp.OverlayOptions[] = [];
  if (backgroundColor) {
    composites.push({
      input: Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${subheadline.width}" height="${height}" viewBox="0 0 ${subheadline.width} ${height}">
          <rect width="${subheadline.width}" height="${height}" rx="${radius}" fill="${backgroundColor}" />
        </svg>
      `),
    });
  }
  composites.push({
    input: textBuffer,
    top: paddingY,
    left: paddingX,
  });

  const overlay = await sharp({
    create: {
      width: subheadline.width,
      height: Math.ceil(height),
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
  const minimumTop =
    headlineOverlay && subheadline.y < headlineOverlay.top + headlineOverlay.height
      ? headlineOverlay.top + headlineOverlay.height + (template.templateType === "story" ? 28 : 22)
      : subheadline.y;
  const maxTop = Math.max(template.height - Math.ceil(height) - (template.templateType === "story" ? 48 : 32), 0);

  return {
    input: overlay,
    top: Math.min(minimumTop, maxTop),
    left: subheadline.x,
    width: subheadline.width,
    height: Math.ceil(height),
  };
}

export async function renderDraftPng({ draft, topic, template }: RenderInputs) {
  const width = template.width;
  const height = template.height;
  const backgroundInput =
    (await loadImageBuffer(topic.imageUrl)) ??
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#1d2830"/></svg>`);
  const background = await sharp(backgroundInput).resize(width, height, { fit: "cover", position: "centre" }).png().toBuffer();

  const headlineOverlay = await buildHeadlineStrip(template, draft);
  const subheadlineOverlay = await buildSubheadlineOverlay(template, draft, headlineOverlay);
  const adjustedHeadlineOverlay =
    headlineOverlay && subheadlineOverlay && headlineOverlay.top + headlineOverlay.height > subheadlineOverlay.top
      ? {
          ...headlineOverlay,
          top: Math.max(
            24,
            subheadlineOverlay.top - headlineOverlay.height - (template.templateType === "story" ? 28 : 22),
          ),
        }
      : headlineOverlay;
  const layers = await Promise.all([
    Promise.resolve({
      input: buildGradientOverlay(
        width,
        height,
        template.config?.background.overlayOpacity ?? 0.36,
        template.config?.background.overlayStartColor,
        template.config?.background.overlayEndColor,
      ),
      top: 0,
      left: 0,
    }),
    buildLogoOverlay(template),
    buildInsetOverlay(template, topic),
    Promise.resolve(adjustedHeadlineOverlay),
    Promise.resolve(subheadlineOverlay),
  ]);

  return sharp(background)
    .composite(layers.filter((layer): layer is NonNullable<typeof layer> => Boolean(layer)))
    .png()
    .toBuffer();
}
