import type { Template, TemplatePlacementOverrides } from "@/lib/domain";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function applyPlacementOverrides(template: Template, overrides?: TemplatePlacementOverrides | null): Template {
  if (!template.config || !overrides) {
    return template;
  }

  const headline = template.config.headline;
  const subheadline = template.config.subheadline;
  const nextHeadline = overrides.headline
    ? {
        ...headline,
        ...overrides.headline,
        x: overrides.headline.x === undefined ? headline.x : clamp(overrides.headline.x, 0, template.width - 120),
        y: overrides.headline.y === undefined ? headline.y : clamp(overrides.headline.y, 0, template.height - 120),
        width:
          overrides.headline.width === undefined
            ? headline.width
            : clamp(overrides.headline.width, 220, template.width - clamp(overrides.headline.x ?? headline.x, 0, template.width - 120)),
      }
    : headline;
  const nextSubheadline = overrides.subheadline
    ? {
        ...subheadline,
        ...overrides.subheadline,
        x: overrides.subheadline.x === undefined ? subheadline.x : clamp(overrides.subheadline.x, 0, template.width - 120),
        y: overrides.subheadline.y === undefined ? subheadline.y : clamp(overrides.subheadline.y, 0, template.height - 80),
        width:
          overrides.subheadline.width === undefined
            ? subheadline.width
            : clamp(overrides.subheadline.width, 220, template.width - clamp(overrides.subheadline.x ?? subheadline.x, 0, template.width - 120)),
      }
    : subheadline;

  return {
    ...template,
    config: {
      ...template.config,
      headline: nextHeadline,
      subheadline: nextSubheadline,
    },
  };
}
