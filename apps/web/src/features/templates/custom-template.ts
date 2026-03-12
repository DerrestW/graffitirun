import type { Template, TemplateRenderConfig } from "@/lib/domain";

export type CustomTemplate = {
  id: string;
  name: string;
  templateType: Template["templateType"];
  logoMode: "show" | "hide";
  logoPlacement: "top_left" | "top_right" | "bottom_left" | "bottom_right";
  logoOffsetX: number;
  logoOffsetY: number;
  headlinePlacement: "top_banner" | "center_card" | "lower_third";
  subheadlinePlacement: "under_headline" | "middle_panel" | "footer_panel";
  backgroundStyle: "navy_fade" | "warm_alert" | "emerald_wash" | "teal_spotlight";
  headlineShape: "rounded_card" | "pill_strip" | "hard_strip";
  insetShape: "circle" | "rounded_square" | "none";
  highlightMode: "keywords" | "every_fifth" | "none";
  accentColor: string;
};

export const customTemplateStorageKey = "graffiti-run-custom-templates";

export const defaultCustomTemplate: CustomTemplate = {
  id: "",
  name: "My custom layout",
  templateType: "square",
  logoMode: "show",
  logoPlacement: "top_right",
  logoOffsetX: 20,
  logoOffsetY: 20,
  headlinePlacement: "lower_third",
  subheadlinePlacement: "footer_panel",
  backgroundStyle: "navy_fade",
  headlineShape: "rounded_card",
  insetShape: "circle",
  highlightMode: "keywords",
  accentColor: "#d96b31",
};

export function normalizeCustomTemplate(value: Partial<CustomTemplate> | null | undefined): CustomTemplate {
  return {
    ...defaultCustomTemplate,
    ...(value ?? {}),
    id: value?.id ?? "",
    name: value?.name ?? defaultCustomTemplate.name,
  };
}

export function labelForHeadlinePlacement(value: CustomTemplate["headlinePlacement"]) {
  return value === "top_banner" ? "Top banner" : value === "center_card" ? "Center card" : "Lower third";
}

export function labelForSubheadlinePlacement(value: CustomTemplate["subheadlinePlacement"]) {
  return value === "under_headline" ? "Under headline" : value === "middle_panel" ? "Middle panel" : "Footer panel";
}

export function labelForShape(value: CustomTemplate["insetShape"]) {
  return value === "rounded_square" ? "Rounded square" : value;
}

export function customTemplateToTemplate(custom: CustomTemplate, workspaceId: string): Template {
  const templateType = custom.templateType;
  const size = templateType === "story" ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 };
  const isStory = templateType === "story";
  const logo = buildLogoConfig(custom, size.width, size.height);
  const headline = buildHeadlineConfig(custom, isStory);
  const subheadline = buildSubheadlineConfig(custom, isStory);
  const background = buildBackgroundConfig(custom);
  const emphasis = buildEmphasisConfig(custom);

  const config: TemplateRenderConfig = {
    background,
    ...(logo ? { logo } : {}),
    headline,
    subheadline,
    emphasis,
    ...(custom.insetShape === "none"
      ? {}
      : {
          insetImage: {
            x: isStory ? 34 : 34,
            y: isStory ? 72 : 34,
            size: isStory ? 360 : 280,
            borderWidth: 8,
            borderColor: "#ffffff",
            cornerRadius: custom.insetShape === "circle" ? 999 : 32,
          },
        }),
  };

  return {
    id: custom.id || `custom-${slugify(custom.name)}`,
    workspaceId,
    name: custom.name,
    templateType,
    layoutLabel: "Custom layout",
    headlinePlacement: labelForHeadlinePlacement(custom.headlinePlacement),
    subheadlinePlacement: labelForSubheadlinePlacement(custom.subheadlinePlacement),
    backgroundStyle: labelForBackgroundStyle(custom.backgroundStyle),
    width: size.width,
    height: size.height,
    isDefault: false,
    accentColor: custom.accentColor,
    headlineLimit: isStory ? 54 : 40,
    notes: "Custom template saved in this browser and available inside Draft Studio.",
    config,
  };
}

function buildLogoConfig(custom: CustomTemplate, width: number, height: number) {
  if (custom.logoMode === "hide") {
    return undefined;
  }

  const baseWidth = width >= 1200 ? 200 : 190;
  const marginX = 20 + custom.logoOffsetX;
  const marginY = 20 + custom.logoOffsetY;

  if (custom.logoPlacement === "top_left") {
    return { x: marginX, y: marginY, width: baseWidth };
  }
  if (custom.logoPlacement === "top_right") {
    return { x: width - baseWidth - marginX, y: marginY, width: baseWidth };
  }
  if (custom.logoPlacement === "bottom_left") {
    return { x: marginX, y: height - 90 - marginY, width: baseWidth };
  }
  return { x: width - baseWidth - marginX, y: height - 90 - marginY, width: baseWidth };
}

function buildHeadlineConfig(custom: CustomTemplate, isStory: boolean) {
  const placements: Record<CustomTemplate["headlinePlacement"], { x: number; y: number; width: number; rotation: number }> = isStory
    ? {
        top_banner: { x: 70, y: 160, width: 860, rotation: 0 },
        center_card: { x: 120, y: 820, width: 840, rotation: 0 },
        lower_third: { x: 84, y: 1420, width: 900, rotation: -3 },
      }
    : {
        top_banner: { x: 58, y: 86, width: 770, rotation: 0 },
        center_card: { x: 118, y: 560, width: 844, rotation: -2 },
        lower_third: { x: 70, y: 760, width: 930, rotation: -3 },
      };

  const shapeRadius = custom.headlineShape === "pill_strip" ? 999 : custom.headlineShape === "hard_strip" ? 12 : 26;

  return {
    ...placements[custom.headlinePlacement],
    fontSize: isStory ? 88 : 72,
    paddingX: 28,
    paddingY: 18,
    backgroundColor: custom.headlineShape === "hard_strip" ? "#fff4ec" : "#ffffff",
    color: "#0f1115",
    radius: shapeRadius,
  };
}

function buildSubheadlineConfig(custom: CustomTemplate, isStory: boolean) {
  const placements: Record<
    CustomTemplate["subheadlinePlacement"],
    {
      x: number;
      y: number;
      width: number;
      fontSize: number;
      backgroundColor?: string;
      paddingX?: number;
      paddingY?: number;
      radius?: number;
    }
  > = isStory
    ? {
        under_headline: { x: 88, y: 1540, width: 860, fontSize: 66 },
        middle_panel: { x: 120, y: 1080, width: 820, fontSize: 56, backgroundColor: "rgba(7,11,17,0.42)", paddingX: 26, paddingY: 18, radius: 22 },
        footer_panel: { x: 88, y: 1660, width: 900, fontSize: 70, backgroundColor: "rgba(7,11,17,0.42)", paddingX: 24, paddingY: 18, radius: 22 },
      }
    : {
        under_headline: { x: 82, y: 866, width: 910, fontSize: 60 },
        middle_panel: { x: 76, y: 690, width: 760, fontSize: 44, backgroundColor: "rgba(7,10,14,0.48)", paddingX: 24, paddingY: 18, radius: 20 },
        footer_panel: { x: 72, y: 834, width: 936, fontSize: 48, backgroundColor: "rgba(255,255,255,0.12)", paddingX: 26, paddingY: 18, radius: 22 },
      };

  return {
    ...placements[custom.subheadlinePlacement],
    color: "#ffffff",
  };
}

function buildBackgroundConfig(custom: CustomTemplate) {
  const map: Record<CustomTemplate["backgroundStyle"], { overlayOpacity: number; overlayStartColor: string; overlayEndColor: string }> = {
    navy_fade: { overlayOpacity: 0.35, overlayStartColor: "15,27,37", overlayEndColor: "5,9,13" },
    warm_alert: { overlayOpacity: 0.3, overlayStartColor: "58,26,12", overlayEndColor: "12,15,20" },
    emerald_wash: { overlayOpacity: 0.28, overlayStartColor: "16,38,30", overlayEndColor: "4,11,9" },
    teal_spotlight: { overlayOpacity: 0.34, overlayStartColor: "12,40,48", overlayEndColor: "4,10,14" },
  };

  return map[custom.backgroundStyle];
}

function buildEmphasisConfig(custom: CustomTemplate) {
  const keywordSets: Record<CustomTemplate["highlightMode"], string[]> = {
    keywords: ["viral", "revealed", "wins", "again", "first", "mask", "shocking"],
    every_fifth: ["every", "fifth", "pattern", "hook", "highlight"],
    none: [],
  };

  return {
    color: custom.accentColor,
    keywords: keywordSets[custom.highlightMode],
    mode: custom.highlightMode,
  };
}

function labelForBackgroundStyle(value: CustomTemplate["backgroundStyle"]) {
  return value.replace(/_/g, " ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
