import type { Draft, Template } from "@/lib/domain";

type PreviewContent = {
  headline: string;
  summary: string;
  kicker: string;
  footer: string;
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

  return lines.slice(0, 4);
}

function toDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function getTemplatePalette(template: Template) {
  return {
    accent: template.accentColor,
    backgroundStart: template.templateType === "story" ? "#102433" : template.templateType === "carousel" ? "#123226" : "#15212d",
    backgroundEnd: template.templateType === "text_fact" ? "#f4ede3" : "#243b53",
    cardFill: template.templateType === "text_fact" ? "#fff8ef" : "#ffffff",
    body: template.templateType === "text_fact" ? "#2a241d" : "#102433",
    muted: template.templateType === "text_fact" ? "#6e6257" : "#dbe5ee",
  };
}

function getFallbackContent(template: Template): PreviewContent {
  return {
    headline:
      template.templateType === "story"
        ? "Rare sky event stops the scroll"
        : template.templateType === "carousel"
          ? "4-frame curiosity sequence for high-share topics"
          : template.templateType === "text_fact"
            ? "Wholesome fact post with sponsor-safe framing"
            : "Original branded post with high-clarity headline",
    summary:
      template.notes ||
      "Built to turn a source topic into a transformed, reviewable post instead of a direct repost.",
    kicker: template.templateType.replace("_", " "),
    footer: `${template.width} x ${template.height}`,
  };
}

function getDraftContent(template: Template, draft: Draft): PreviewContent {
  return {
    headline: draft.selectedHeadline,
    summary: draft.selectedSummary,
    kicker: draft.status.replace("_", " "),
    footer: template.name,
  };
}

export function renderTemplatePreview(template: Template, draft?: Draft) {
  const palette = getTemplatePalette(template);
  const content = draft ? getDraftContent(template, draft) : getFallbackContent(template);
  const headlineLines = wrapText(content.headline, template.templateType === "story" ? 18 : 22);
  const summaryLines = wrapText(content.summary, template.templateType === "story" ? 24 : 34);
  const ratio = template.height / template.width;
  const viewHeight = Math.round(1080 * ratio);
  const isStory = template.templateType === "story";
  const textX = 84;
  const textWidth = 910;
  const bodyY = isStory ? 760 : 610;

  const headlineSvg = headlineLines
    .map((line, index) => `<tspan x="${textX}" dy="${index === 0 ? 0 : isStory ? 86 : 68}">${escapeXml(line)}</tspan>`)
    .join("");
  const summarySvg = summaryLines
    .map((line, index) => `<tspan x="${textX + 46}" dy="${index === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`)
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${viewHeight}" viewBox="0 0 1080 ${viewHeight}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.backgroundStart}" />
          <stop offset="100%" stop-color="${palette.backgroundEnd}" />
        </linearGradient>
        <linearGradient id="accentGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="1080" height="${viewHeight}" fill="url(#bg)" rx="56" />
      <circle cx="920" cy="160" r="220" fill="url(#accentGlow)" opacity="0.75" />
      <circle cx="180" cy="${viewHeight - 120}" r="200" fill="${palette.accent}" opacity="0.18" />
      <rect x="44" y="44" width="992" height="${viewHeight - 88}" rx="42" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />

      <rect x="${textX}" y="84" width="220" height="52" rx="26" fill="${palette.accent}" />
      <text x="${textX + 110}" y="117" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="2">
        ${escapeXml(content.kicker.toUpperCase())}
      </text>

      <rect x="${textX}" y="${isStory ? 210 : 180}" width="${textWidth}" height="${isStory ? 420 : 320}" rx="34" fill="rgba(255,255,255,0.09)" />
      <rect x="${textX + 38}" y="${isStory ? 250 : 220}" width="${isStory ? 280 : 220}" height="8" rx="4" fill="${palette.accent}" />
      <text x="${textX}" y="${isStory ? 360 : 310}" font-family="Georgia, serif" font-size="${isStory ? 74 : 58}" font-weight="700" fill="#ffffff">
        ${headlineSvg}
      </text>

      <rect x="${textX}" y="${bodyY}" width="${textWidth}" height="${isStory ? 300 : 240}" rx="34" fill="${palette.cardFill}" opacity="${template.templateType === "text_fact" ? "1" : "0.96"}" />
      <text x="${textX}" y="${bodyY + 74}" font-family="Arial, sans-serif" font-size="30" fill="${palette.body}" font-weight="600">
        ${summarySvg}
      </text>

      <rect x="${textX}" y="${viewHeight - 150}" width="${textWidth}" height="70" rx="35" fill="rgba(255,255,255,0.12)" />
      <text x="${textX + 44}" y="${viewHeight - 106}" font-family="Arial, sans-serif" font-size="22" fill="${palette.muted}" letter-spacing="1.5">
        ${escapeXml(content.footer.toUpperCase())}
      </text>
      <text x="${textX + textWidth - 44}" y="${viewHeight - 106}" text-anchor="end" font-family="Arial, sans-serif" font-size="22" fill="#ffffff" font-weight="700">
        GRAFFITI RUN
      </text>
    </svg>
  `;

  return {
    previewUrl: toDataUrl(svg),
    aspectRatio: `${template.width} / ${template.height}`,
  };
}
