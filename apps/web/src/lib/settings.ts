export type WorkspaceSettingsView = {
  timezone: string;
  approvalRequired: boolean;
  defaultPostingMode: "manual_review" | "scheduled_queue";
  allowedCategories: string[];
  blockedTerms: string[];
  brandVoiceNotes: string;
};

export type BrandingSettingsView = {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  subheadingFont: string;
  bodyFont: string;
  watermarkStyle: "badge" | "corner_mark" | "hidden";
  defaultTemplateIds: {
    feed: string;
    story: string;
    carousel: string;
  };
};

export type SourceSettingsView = {
  topicsEnabled: string[];
  feeds: Array<{
    id: string;
    label: string;
    category: string;
    feedUrl: string;
    enabled: boolean;
    imageMode: "feed_image" | "article_og_image" | "manual_override";
  }>;
};

export type ConnectionSettingsView = {
  facebook: {
    connected: boolean;
    displayName: string;
    status: "stub_ready" | "token_required" | "connected";
  };
  instagram: {
    connected: boolean;
    status: "not_enabled" | "coming_soon";
  };
  x: {
    connected: boolean;
    displayName: string;
    status: "stub_ready" | "token_required" | "connected" | "coming_soon";
  };
};

export const workspaceSettingsView: WorkspaceSettingsView = {
  timezone: "America/Chicago",
  approvalRequired: true,
  defaultPostingMode: "manual_review",
  allowedCategories: ["sports", "weather", "running", "health", "lifting", "animals", "celebrity"],
  blockedTerms: ["politics", "election", "graphic injury"],
  brandVoiceNotes:
    "Keep headlines crisp, emotionally readable, and curiosity-led. Avoid sensational wording that sounds stolen from tabloids.",
};

export const brandingSettingsView: BrandingSettingsView = {
  logoUrl: "/brand/graffiti-run-badge.svg",
  primaryColor: "#14384a",
  secondaryColor: "#f3eee6",
  accentColor: "#d96b31",
  headingFont: "Helvetica Neue",
  subheadingFont: "Avenir Next",
  bodyFont: "Avenir Next",
  watermarkStyle: "badge",
  defaultTemplateIds: {
    feed: "template-square",
    story: "template-story",
    carousel: "template-carousel",
  },
};

export const sourceSettingsView: SourceSettingsView = {
  topicsEnabled: ["sports", "weather", "running", "health", "lifting", "animals", "celebrity"],
  feeds: [
    {
      id: "feed-espn",
      label: "ESPN Top Headlines",
      category: "sports",
      feedUrl: "https://www.espn.com/espn/rss/news",
      enabled: true,
      imageMode: "article_og_image",
    },
    {
      id: "feed-weather",
      label: "Weather Feed Slot",
      category: "weather",
      feedUrl: "Add a weather RSS URL here",
      enabled: false,
      imageMode: "feed_image",
    },
    {
      id: "feed-running",
      label: "Google News Running",
      category: "running",
      feedUrl:
        "https://news.google.com/rss/search?q=%28%22running%22%20OR%20marathon%20OR%20half%20marathon%20OR%20trail%20running%20OR%20training%29%20-congress%20-election%20-office%20-senate%20-governor&hl=en-US&gl=US&ceid=US:en",
      enabled: true,
      imageMode: "article_og_image",
    },
    {
      id: "feed-celebrity",
      label: "Entertainment Tonight News",
      category: "celebrity",
      feedUrl: "https://www.etonline.com/news/rss",
      enabled: true,
      imageMode: "feed_image",
    },
  ],
};

export const connectionSettingsView: ConnectionSettingsView = {
  facebook: {
    connected: false,
    displayName: "Graffiti Run Facebook Page",
    status: "stub_ready",
  },
  instagram: {
    connected: false,
    status: "coming_soon",
  },
  x: {
    connected: false,
    displayName: "Graffiti Run on X",
    status: "stub_ready",
  },
};
