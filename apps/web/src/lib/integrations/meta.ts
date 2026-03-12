import "server-only";

import type { Database } from "@/lib/db/database.types";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/db/queries";

export type MetaPageOption = {
  id: string;
  name: string;
  accessToken: string;
  tasks: string[];
};

export type MetaConnection = {
  pageId: string;
  accessToken: string;
  pageName?: string;
  source: "env" | "channel";
};

export function getMetaIntegrationStatus() {
  const graphVersion = process.env.META_GRAPH_API_VERSION ?? "v23.0";
  const pageId = process.env.META_PAGE_ID ?? "";
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN ?? "";
  const appId = process.env.META_APP_ID ?? "";
  const appSecret = process.env.META_APP_SECRET ?? "";

  return {
    graphVersion,
    publishingReady: Boolean(pageId && accessToken),
    insightsReady: Boolean(pageId && accessToken),
    monetizationReady: Boolean(pageId && accessToken),
    configReady: Boolean(pageId && accessToken && appId && appSecret),
    pageIdPresent: Boolean(pageId),
    tokenPresent: Boolean(accessToken),
    appConfigured: Boolean(appId && appSecret),
  };
}

export function getMetaIntegrationConfig() {
  return {
    graphVersion: process.env.META_GRAPH_API_VERSION ?? "v23.0",
    appId: process.env.META_APP_ID ?? "",
    appSecret: process.env.META_APP_SECRET ?? "",
    pageId: process.env.META_PAGE_ID ?? "",
    accessToken: process.env.META_PAGE_ACCESS_TOKEN ?? "",
  };
}

export function getPublicAppOrigin(requestUrl?: string) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "";

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (!requestUrl) {
    throw new Error("Public app URL is not configured.");
  }

  return new URL(requestUrl).origin;
}

export async function getStoredFacebookConnection(): Promise<MetaConnection | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return null;
  }

  const workspace = await getWorkspaceContext();
  const result = await supabase
    .from("publishing_channels")
    .select("*")
    .eq("workspace_id", workspace.workspaceId)
    .eq("channel_type", "facebook_page")
    .eq("status", "connected")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const row = result.data as Database["public"]["Tables"]["publishing_channels"]["Row"] | null;

  if (!row?.access_token_encrypted || !row.channel_metadata_json || typeof row.channel_metadata_json !== "object" || Array.isArray(row.channel_metadata_json)) {
    return null;
  }

  const metadata = row.channel_metadata_json as Record<string, unknown>;
  const pageId = typeof metadata.page_id === "string" ? metadata.page_id : "";
  const pageName = typeof metadata.page_name === "string" ? metadata.page_name : row.display_name;

  if (!pageId) {
    return null;
  }

  return {
    pageId,
    accessToken: row.access_token_encrypted,
    pageName,
    source: "channel",
  };
}

export async function resolveMetaConnection(): Promise<MetaConnection | null> {
  const stored = await getStoredFacebookConnection();
  if (stored) {
    return stored;
  }

  const env = getMetaIntegrationConfig();
  if (!env.pageId || !env.accessToken) {
    return null;
  }

  return {
    pageId: env.pageId,
    accessToken: env.accessToken,
    source: "env",
  };
}

export function buildFacebookOauthUrl({
  origin,
  state,
}: {
  origin: string;
  state: string;
}) {
  const { appId } = getMetaIntegrationConfig();
  if (!appId) {
    throw new Error("Meta App ID is missing.");
  }

  const url = new URL("https://www.facebook.com/v25.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", `${origin}/api/connect/facebook/callback`);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "pages_show_list,pages_manage_posts,pages_read_engagement,read_insights");

  return url.toString();
}

export async function exchangeFacebookCodeForUserToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}) {
  const { appId, appSecret, graphVersion } = getMetaIntegrationConfig();

  if (!appId || !appSecret) {
    throw new Error("Meta App ID or App Secret is missing.");
  }

  const url = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code);

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const payload = await parseGraphResponse(response);

  if (!response.ok || typeof payload.access_token !== "string") {
    const errorMessage =
      typeof payload.error === "object" && payload.error && "message" in payload.error ? String(payload.error.message) : "Meta token exchange failed.";
    throw new Error(errorMessage);
  }

  return payload.access_token;
}

export async function fetchFacebookPages(userAccessToken: string): Promise<MetaPageOption[]> {
  const response = await fetch(
    createGraphUrl("me/accounts", {
      access_token: userAccessToken,
      fields: "id,name,access_token,tasks",
    }).toString(),
    { method: "GET", cache: "no-store" },
  );
  const payload = await parseGraphResponse(response);

  if (!response.ok) {
    const errorMessage =
      typeof payload.error === "object" && payload.error && "message" in payload.error ? String(payload.error.message) : "Failed to load Facebook Pages.";
    throw new Error(errorMessage);
  }

  const rows = Array.isArray(payload.data) ? payload.data : [];
  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      name: typeof row.name === "string" ? row.name : "Facebook Page",
      accessToken: typeof row.access_token === "string" ? row.access_token : "",
      tasks: Array.isArray(row.tasks) ? row.tasks.filter((item): item is string => typeof item === "string") : [],
    }))
    .filter((row) => row.id && row.accessToken);
}

export async function connectFacebookPage(page: MetaPageOption) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase client is not configured.");
  }

  const workspace = await getWorkspaceContext();
  const existing = await supabase
    .from("publishing_channels")
    .select("*")
    .eq("workspace_id", workspace.workspaceId)
    .eq("channel_type", "facebook_page")
    .limit(1);
  const rows = (existing.data as Database["public"]["Tables"]["publishing_channels"]["Row"][] | null) ?? [];
  const row = rows[0] ?? null;

  const payload = {
    workspace_id: workspace.workspaceId,
    channel_type: "facebook_page",
    display_name: page.name,
    access_token_encrypted: page.accessToken,
    refresh_token_encrypted: null,
    channel_metadata_json: {
      page_id: page.id,
      page_name: page.name,
      tasks: page.tasks,
      source: "oauth",
    },
    status: "connected",
  };

  if (row) {
    await supabase.from("publishing_channels").update(payload as never).eq("id", row.id);
    return row.id;
  }

  const inserted = await supabase.from("publishing_channels").insert(payload as never).select("id").single();
  const insertedRow = inserted.data as { id: string } | null;
  if (inserted.error || !insertedRow?.id) {
    throw new Error(inserted.error?.message ?? "Failed to save Facebook connection.");
  }

  return insertedRow.id;
}

type MetaPublishInput = {
  caption: string;
  image: Buffer;
  fileName?: string;
};

type MetaPublishResult = {
  id: string;
  postId?: string;
  permalinkUrl?: string;
  raw: unknown;
};

type MetaInsightsResult = {
  permalinkUrl?: string;
  impressions: number;
  reach: number;
  clicks: number;
  reactions: number;
  comments: number;
  shares: number;
  estimatedEarnings: number;
  raw: unknown;
};

function createGraphUrl(pathname: string, query: Record<string, string>) {
  const { graphVersion } = getMetaIntegrationConfig();
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${pathname.replace(/^\//, "")}`);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  return url;
}

async function parseGraphResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text } as Record<string, unknown>;
  }
}

export async function publishPhotoToFacebookPage({
  caption,
  image,
  fileName = "graffiti-run-post.png",
  connection,
}: MetaPublishInput & { connection?: MetaConnection | null }): Promise<MetaPublishResult> {
  const activeConnection = connection ?? (await resolveMetaConnection());
  const pageId = activeConnection?.pageId ?? "";
  const accessToken = activeConnection?.accessToken ?? "";

  if (!pageId || !accessToken) {
    throw new Error("Meta Page ID or Page access token is missing.");
  }

  const formData = new FormData();
  formData.set("caption", caption);
  formData.set("published", "true");
  formData.set("access_token", accessToken);
  formData.set("source", new Blob([new Uint8Array(image)], { type: "image/png" }), fileName);

  const response = await fetch(createGraphUrl(`${pageId}/photos`, {}).toString(), {
    method: "POST",
    body: formData,
  });
  const payload = await parseGraphResponse(response);

  if (!response.ok) {
    const errorMessage =
      typeof payload.error === "object" && payload.error && "message" in payload.error ? String(payload.error.message) : "Facebook publish failed.";
    throw new Error(errorMessage);
  }

  const id = typeof payload.id === "string" ? payload.id : "";
  const postId = typeof payload.post_id === "string" ? payload.post_id : undefined;
  const permalinkUrl = id ? await getFacebookPermalink(id, accessToken) : undefined;

  return {
    id,
    postId,
    permalinkUrl,
    raw: payload,
  };
}

async function getFacebookPermalink(objectId: string, accessToken: string) {
  const response = await fetch(
    createGraphUrl(objectId, {
      access_token: accessToken,
      fields: "permalink_url",
    }).toString(),
    { method: "GET", cache: "no-store" },
  );

  const payload = await parseGraphResponse(response);
  if (!response.ok) {
    return undefined;
  }

  return typeof payload.permalink_url === "string" ? payload.permalink_url : undefined;
}

export async function fetchFacebookPostInsights(postId: string, connection?: MetaConnection | null): Promise<MetaInsightsResult> {
  const activeConnection = connection ?? (await resolveMetaConnection());
  const accessToken = activeConnection?.accessToken ?? "";

  if (!accessToken) {
    throw new Error("Meta Page access token is missing.");
  }

  const fields =
    "permalink_url,shares,reactions.summary(true),comments.summary(true),insights.metric(post_impressions,post_impressions_unique,post_clicks)";
  const response = await fetch(
    createGraphUrl(postId, {
      access_token: accessToken,
      fields,
    }).toString(),
    { method: "GET", cache: "no-store" },
  );
  const payload = await parseGraphResponse(response);

  if (!response.ok) {
    const errorMessage =
      typeof payload.error === "object" && payload.error && "message" in payload.error ? String(payload.error.message) : "Facebook insights request failed.";
    throw new Error(errorMessage);
  }

  const insightsData = Array.isArray(payload.insights && typeof payload.insights === "object" ? (payload.insights as { data?: unknown[] }).data : [])
    ? (((payload.insights as { data?: unknown[] }).data as unknown[]) ?? [])
    : [];

  const metricMap = new Map<string, number>();
  for (const item of insightsData) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const metric = item as { name?: unknown; values?: unknown };
    const name = typeof metric.name === "string" ? metric.name : "";
    const values = Array.isArray(metric.values) ? metric.values : [];
    const latest = values[0];
    const latestValue =
      latest && typeof latest === "object" && "value" in latest && typeof latest.value === "number"
        ? latest.value
        : latest && typeof latest === "object" && "value" in latest && typeof latest.value === "string"
          ? Number(latest.value)
          : 0;
    metricMap.set(name, Number.isFinite(latestValue) ? latestValue : 0);
  }

  const shares =
    payload.shares && typeof payload.shares === "object" && "count" in payload.shares && typeof payload.shares.count === "number"
      ? payload.shares.count
      : 0;
  const reactions =
    payload.reactions &&
    typeof payload.reactions === "object" &&
    "summary" in payload.reactions &&
    payload.reactions.summary &&
    typeof payload.reactions.summary === "object" &&
    "total_count" in payload.reactions.summary &&
    typeof payload.reactions.summary.total_count === "number"
      ? payload.reactions.summary.total_count
      : 0;
  const comments =
    payload.comments &&
    typeof payload.comments === "object" &&
    "summary" in payload.comments &&
    payload.comments.summary &&
    typeof payload.comments.summary === "object" &&
    "total_count" in payload.comments.summary &&
    typeof payload.comments.summary.total_count === "number"
      ? payload.comments.summary.total_count
      : 0;

  return {
    permalinkUrl: typeof payload.permalink_url === "string" ? payload.permalink_url : undefined,
    impressions: metricMap.get("post_impressions") ?? 0,
    reach: metricMap.get("post_impressions_unique") ?? 0,
    clicks: metricMap.get("post_clicks") ?? 0,
    reactions,
    comments,
    shares,
    estimatedEarnings: 0,
    raw: payload,
  };
}
