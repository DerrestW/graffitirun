export type BrandingSettingsPersisted = {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  subheadingFont: string;
  bodyFont: string;
};

const storageKey = "brandingSettings";

export function loadBrandingSettings(defaults: BrandingSettingsPersisted): BrandingSettingsPersisted {
  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<BrandingSettingsPersisted>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveBrandingSettings(settings: BrandingSettingsPersisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
