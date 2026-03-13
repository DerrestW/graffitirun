import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Draft, Template, Topic } from "@/lib/domain";
import { brandingSettingsView } from "@/lib/settings";

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

const bundledFontPath = path.join(process.cwd(), "public", "fonts", "NotoSans-Variable.ttf");
const interFontPath = path.join(process.cwd(), "public", "fonts", "Inter-Regular.ttf");
const nunitoFontPath = path.join(process.cwd(), "public", "fonts", "NunitoSans-Regular.ttf");
function resolveBrandFonts(overrides?: RenderInputs["brandFonts"], useBrandFonts = false) {
  if (!useBrandFonts) {
    return {
      heading: "Noto Sans",
      subheading: "Noto Sans",
      body: "Noto Sans",
    } as const;
  }

  const normalize = (value?: string | null) => {
    const v = value?.trim();
    if (!v) return "Noto Sans";
    if (["Helvetica", "Helvetica Neue"].includes(v)) return "Inter";
    if (["Avenir", "Avenir Next"].includes(v)) return "Nunito Sans";
    return v;
  };

  return {
    heading: normalize(overrides?.heading ?? brandingSettingsView.headingFont),
    subheading: normalize(overrides?.subheading ?? brandingSettingsView.subheadingFont),
    body: normalize(overrides?.body ?? brandingSettingsView.bodyFont),
  } as const;
}

function resolveFontOptions(fontFamily: string, fontSize: number) {
  const family = fontFamily.trim() || "Noto Sans";
  const fontfile = family.startsWith("Inter")
    ? interFontPath
    : family.startsWith("Nunito Sans")
      ? nunitoFontPath
      : bundledFontPath;
  return {
    font: family,
    fontfile,
    fontSize: Math.max(Math.round(fontSize), 16),
  } as const;
}

async function buildEmbeddedFontFace(fontFamily: string, fontfile: string, name: string) {
  const fontBuffer = await fs.readFile(fontfile);
  const mime = fontfile.endsWith(".otf") ? "font/otf" : "font/ttf";
  return `@font-face { font-family: '${name}'; src: url(data:${mime};base64,${fontBuffer.toString("base64")}) format('truetype'); } .${name} { font-family: '${name}'; }`;
}

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

async function buildHeadlineStrip(template: Template, draft: Draft, fontFamily: string): Promise<HeadlineOverlay | null> {
  const headline = template.config?.headline;
  if (!headline) {
    return null;
  }

  const lineLength = template.templateType === "story" ? 26 : 30;
  const lines = wrapText(draft.selectedHeadline, lineLength).slice(0, 2);
  const lineHeight = headline.fontSize * 1.08;
  const textHeight = lines.length * lineHeight;
  const stripHeight = textHeight + headline.paddingY * 2;
  const { font, fontfile, fontSize } = resolveFontOptions(fontFamily, headline.fontSize);
  const fontClass = "headlineFont";
  const fontFace = await buildEmbeddedFontFace(font, fontfile, fontClass);
  const textSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${headline.width}" height="${Math.ceil(stripHeight)}" viewBox="0 0 ${headline.width} ${Math.ceil(stripHeight)}">
      <style>${fontFace}</style>
      <g class="${fontClass}" fill="${headline.color}" font-size="${fontSize}" font-weight="700">
        ${lines
          .map(
            (line, index) =>
              `<text x="${headline.paddingX}" y="${headline.paddingY + fontSize + index * lineHeight}">${escapeXml(line)}</text>`,
          )
          .join("")}
      </g>
    </svg>
  `);

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
        input: textSvg,
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
          .toBuffer({ resolveWithObject: false })
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

async function buildSubheadlineOverlay(
  template: Template,
  draft: Draft,
  fontFamily: string,
  headlineOverlay?: HeadlineOverlay | null,
) {
  const subheadline = template.config?.subheadline;
  const emphasis = template.config?.emphasis;
  if (!subheadline || !emphasis) {
    return null;
  }

  const lines = wrapText(draft.selectedSummary, template.templateType === "story" ? 28 : 34).slice(0, 3);
  const lineHeight = subheadline.fontSize * 1.08;
  const paddingX = subheadline.paddingX ?? 0;
  const paddingY = subheadline.paddingY ?? 0;
  const height = lines.length * lineHeight + 24 + paddingY * 2;
  const keywordSet = new Set(emphasis.keywords.map((word) => word.toLowerCase()));
  const mode = emphasis.mode ?? "keywords";
  const emphasisColor = emphasis.color;
  const subheadlineColor = subheadline.color;
  const backgroundColor = subheadline.backgroundColor;
  const radius = subheadline.radius ?? 18;
  const { font, fontfile, fontSize } = resolveFontOptions(fontFamily, subheadline.fontSize);
  const fontClass = "subheadlineFont";
  const fontFace = await buildEmbeddedFontFace(font, fontfile, fontClass);

  const textSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${subheadline.width}" height="${Math.ceil(height)}" viewBox="0 0 ${subheadline.width} ${Math.ceil(height)}">
      <style>${fontFace}</style>
      <g class="${fontClass}" font-size="${fontSize}" font-weight="600">
        ${lines
          .map((line, lineIndex) => {
            const words = line.split(" ").filter(Boolean);
            let currentX = paddingX;
            const y = paddingY + fontSize + lineIndex * lineHeight;
            const segments = words
              .map((word, wordIndex) => {
                const cleaned = word.replace(/[^a-z0-9]/gi, "").toLowerCase();
                const fill =
                  mode === "every_fifth"
                    ? (wordIndex + 1) % 5 === 0
                      ? emphasisColor
                      : subheadlineColor
                    : keywordSet.has(cleaned)
                      ? emphasisColor
                      : subheadlineColor;
                const segment = `<tspan x="${currentX}" y="${y}" fill="${fill}">${escapeXml(word)}</tspan>`;
                currentX += Math.max(word.length * fontSize * 0.58, fontSize * 0.5) + fontSize * 0.28;
                return segment;
              })
              .join("");
            return `<text>${segments}</text>`;
          })
          .join("")}
      </g>
    </svg>
  `);

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
    input: textSvg,
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

  return {
    input: overlay,
    top: minimumTop,
    left: subheadline.x,
  };
}

export async function renderDraftPng({ draft, topic, template, brandFonts, useBrandFonts }: RenderInputs) {
  const width = template.width;
  const height = template.height;
  const backgroundInput = (await loadImageBuffer(topic.imageUrl)) ?? Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#1d2830"/></svg>`);
  const background = await sharp(backgroundInput).resize(width, height, { fit: "cover", position: "centre" }).png().toBuffer();
  const fonts = resolveBrandFonts(brandFonts, useBrandFonts);

  const headlineOverlay = await buildHeadlineStrip(template, draft, fonts.heading);
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
    Promise.resolve(headlineOverlay),
    Promise.resolve(buildSubheadlineOverlay(template, draft, fonts.subheading, headlineOverlay)),
  ]);

  return sharp(background)
    .composite(layers.filter((layer): layer is NonNullable<typeof layer> => Boolean(layer)))
    .png()
    .toBuffer();
}
