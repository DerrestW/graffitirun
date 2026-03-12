import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import Parser from "rss-parser";
import type { NormalizedTopicCandidate } from "@/lib/domain";
import type { TrendProvider } from "@/lib/services/contracts";

type FeedConfig = {
  providerKey: string;
  label: string;
  feedUrl: string;
  category: string;
  domain?: string;
  enabled: boolean;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  itemLimit?: number;
};

type ParsedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  content?: string;
  contentSnippet?: string;
  enclosure?: { url?: string };
  categories?: string[];
  creator?: string;
  author?: string;
  guid?: string;
  "media:content"?: Array<{ $?: { url?: string } }>;
  "media:thumbnail"?: Array<{ $?: { url?: string } }>;
  "media:group"?: Array<{
    "media:content"?: Array<{ $?: { url?: string } }>;
    "media:thumbnail"?: Array<{ $?: { url?: string } }>;
  }>;
};

const parser = new Parser<Record<string, never>, ParsedItem>({
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
      ["media:group", "media:group"],
      "content",
      "contentSnippet",
      "creator",
      "author",
      "guid",
      "categories",
    ],
  },
});

function stripHtml(value: string | undefined) {
  return (value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractFirstImageUrl(item: ParsedItem) {
  const directSources = [
    item.enclosure?.url,
    item["media:content"]?.[0]?.$?.url,
    item["media:thumbnail"]?.[0]?.$?.url,
    item["media:group"]?.[0]?.["media:content"]?.[0]?.$?.url,
    item["media:group"]?.[0]?.["media:thumbnail"]?.[0]?.$?.url,
  ].filter(Boolean) as string[];

  if (directSources.length > 0) {
    return directSources[0];
  }

  const html = item.content ?? "";
  const imageMatch =
    html.match(/<img[^>]+src=["']([^"']+)["']/i) ??
    html.match(/https?:\/\/[^"' )>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"' )>]*)?/i);

  return imageMatch?.[1] ?? imageMatch?.[0] ?? undefined;
}

async function resolveArticleImage(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 GraffitiRun/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return undefined;
    }

    const html = await response.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i) ??
      html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/i);

    const imageCandidate = match?.[1];
    if (!imageCandidate) {
      return undefined;
    }

    try {
      const resolvedUrl = new URL(imageCandidate, url).toString();
      const normalizedPath = new URL(resolvedUrl).pathname.toLowerCase();

      // RunnersWeb exposes a generic site-header image on article pages.
      if (normalizedPath.endsWith("/running/runnerswebcom20.jpg")) {
        return undefined;
      }

      return resolvedUrl;
    } catch {
      return imageCandidate;
    }
  } catch {
    return undefined;
  }
}

async function loadFeedConfigs() {
  const configPath = path.join(process.cwd(), "..", "..", "data", "rss_feeds.json");
  const raw = await fs.readFile(configPath, "utf8");
  return JSON.parse(raw) as FeedConfig[];
}

function matchesFeedFilters(feed: FeedConfig, item: ParsedItem) {
  const haystack = `${item.title ?? ""} ${item.contentSnippet ?? ""} ${item.content ?? ""}`.toLowerCase();
  const includeKeywords = feed.includeKeywords ?? [];
  const excludeKeywords = feed.excludeKeywords ?? [];

  if (includeKeywords.length > 0 && !includeKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
    return false;
  }

  if (excludeKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
    return false;
  }

  return true;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const rssCuratedProvider: TrendProvider = {
  providerKey: "rss_curated",
  async fetch() {
    try {
      const feeds = (await loadFeedConfigs()).filter((feed) => feed.enabled);
      const payloads = await Promise.all(
        feeds.map(async (feed) => {
          try {
            const response = await fetch(feed.feedUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 GraffitiRun/1.0",
              },
              cache: "no-store",
            });

            if (!response.ok) {
              return { feed, items: [] as ParsedItem[] };
            }

            const xml = await response.text();
            const result = await parser.parseString(xml);
            return { feed, items: result.items ?? [] };
          } catch {
            return { feed, items: [] as ParsedItem[] };
          }
        }),
      );

      const normalizedGroups = await Promise.all(
        payloads.map(async ({ feed, items }) =>
          Promise.all(
            items
              .filter((item) => item.title && item.link)
              .filter((item) => matchesFeedFilters(feed, item))
              .slice(0, feed.itemLimit ?? 8)
              .map(async (item, index) => {
                const imageUrl = extractFirstImageUrl(item) ?? (await resolveArticleImage(item.link));
            const title = item.title?.trim() ?? "Untitled feed item";
            const snippet = stripHtml(item.contentSnippet ?? item.content).slice(0, 220);
                return {
              providerKey: "rss_curated",
              sourceType: "rss",
              externalRef: item.guid ?? `${slugify(feed.label)}-${slugify(title)}-${index + 1}`,
              title,
              canonicalUrl: item.link,
              domain: feed.domain ?? new URL(feed.feedUrl).hostname.replace(/^www\./, ""),
              snippet: snippet || `${feed.label} feed item ready for rewrite and review.`,
              publishedAt: item.isoDate ?? item.pubDate,
                  imageUrl,
                  insetImageUrl: imageUrl,
              author: item.creator ?? item.author,
              language: "en",
              rawCategory: feed.category,
              tags: item.categories ?? [feed.category, feed.label],
              rightsConfidence: "unknown",
              ingestionNotes: [`Live RSS item from ${feed.label}. Verify imagery and framing before publish.`],
            } satisfies NormalizedTopicCandidate;
              }),
          ),
        ),
      );

      return normalizedGroups.flat();
    } catch {
      return [];
    }
  },
};
