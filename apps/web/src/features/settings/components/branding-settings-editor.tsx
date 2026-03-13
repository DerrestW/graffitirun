/* eslint-disable @next/next/no-img-element */
"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import type { BrandingSettingsView } from "@/lib/settings";
import { loadBrandingSettings, saveBrandingSettings } from "@/lib/branding-storage";

type BrandingSettingsEditorProps = {
  initialSettings: BrandingSettingsView;
};

export function BrandingSettingsEditor({ initialSettings }: BrandingSettingsEditorProps) {
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initialSettings.secondaryColor);
  const [accentColor, setAccentColor] = useState(initialSettings.accentColor);
  const [headingFont, setHeadingFont] = useState(initialSettings.headingFont);
  const [subheadingFont, setSubheadingFont] = useState(initialSettings.subheadingFont);
  const [bodyFont, setBodyFont] = useState(initialSettings.bodyFont);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Hydrate from saved brand settings on the client.
  useEffect(() => {
    const hydrated = loadBrandingSettings(initialSettings);
    setLogoUrl(hydrated.logoUrl);
    setPrimaryColor(hydrated.primaryColor);
    setSecondaryColor(hydrated.secondaryColor);
    setAccentColor(hydrated.accentColor);
    setHeadingFont(hydrated.headingFont);
    setSubheadingFont(hydrated.subheadingFont);
    setBodyFont(hydrated.bodyFont);
  }, [initialSettings]);

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/topic-image", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { ok?: boolean; path?: string; error?: string };

      if (!response.ok || !result.ok || !result.path) {
        throw new Error(result.error ?? "Logo upload failed.");
      }

      setLogoUrl(result.path);
      setStatus("Logo updated for this session preview.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Logo upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Live brand preview</p>
        <div
          className="mt-5 rounded-[1.8rem] p-6 text-white shadow-[0_24px_64px_rgba(17,24,39,0.22)]"
          style={{
            background: `linear-gradient(150deg, ${primaryColor}, ${accentColor})`,
          }}
        >
          <div className="rounded-[1.35rem] border border-white/12 bg-black/14 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/62">Workspace Brand</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.03em]" style={{ fontFamily: headingFont }}>
                  Visual identity preview
                </h3>
              </div>
              <div className="rounded-[1rem] bg-white/10 p-3">
                <img src={logoUrl} alt="Workspace logo preview" className="h-auto w-[120px]" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[primaryColor, secondaryColor, accentColor].map((swatch) => (
                <div key={swatch} className="rounded-[1rem] bg-white/10 p-3">
                  <div className="h-12 rounded-[0.8rem]" style={{ backgroundColor: swatch }} />
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/72">{swatch}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[1.2rem] px-5 py-4" style={{ backgroundColor: secondaryColor, color: primaryColor }}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Template Accent Preview</p>
              <p className="mt-3 text-2xl font-semibold leading-tight" style={{ fontFamily: subheadingFont }}>
                Customers should be able to make this look like their brand, not ours.
              </p>
              <p className="mt-3 text-sm leading-6 opacity-80" style={{ fontFamily: bodyFont }}>
                Headline, subheading, and body font controls should flow into template previews and exported images.
              </p>
            </div>
          </div>
        </div>
      </article>

      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Brand controls</p>
        <div className="mt-5 grid gap-5">
          <label className="text-sm font-medium text-[color:var(--foreground)]">
            Logo URL
            <input
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="text-sm font-medium text-[color:var(--foreground)]">
            Upload logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleLogoUpload}
              className="mt-2 block w-full text-sm text-[color:var(--ink-soft)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--navy)] file:px-4 file:py-2 file:font-semibold file:text-white"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <ColorField label="Primary" value={primaryColor} onChange={setPrimaryColor} />
            <ColorField label="Secondary" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorField label="Accent" value={accentColor} onChange={setAccentColor} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FontField label="Heading font" value={headingFont} onChange={setHeadingFont} />
            <FontField label="Subheading font" value={subheadingFont} onChange={setSubheadingFont} />
            <FontField label="Body font" value={bodyFont} onChange={setBodyFont} />
          </div>

          <div className="rounded-[1.35rem] bg-white/82 p-5">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">What this controls next</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                "Default template colors",
                "Logo placement across exports",
                "Navigation and shell theming",
                "Accent treatments in draft previews",
              ].map((item) => (
                <div key={item} className="rounded-[1rem] bg-[#f5efe6] px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLogoUrl(initialSettings.logoUrl);
                setPrimaryColor(initialSettings.primaryColor);
                setSecondaryColor(initialSettings.secondaryColor);
                setAccentColor(initialSettings.accentColor);
                setHeadingFont(initialSettings.headingFont);
                setSubheadingFont(initialSettings.subheadingFont);
                setBodyFont(initialSettings.bodyFont);
                setStatus("Reverted to the current workspace brand defaults.");
              }}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]"
            >
              Reset preview
            </button>
            <button
              type="button"
              onClick={() => {
                saveBrandingSettings({
                  logoUrl,
                  primaryColor,
                  secondaryColor,
                  accentColor,
                  headingFont,
                  subheadingFont,
                  bodyFont,
                });
                setStatus("Branding saved for this browser. Studio renders will pick this up.");
              }}
              className="rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(15,23,42,0.22)]"
            >
              Save branding
            </button>
            {uploading ? (
              <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                Uploading logo...
              </span>
            ) : null}
          </div>

          {status ? <p className="text-sm text-[color:var(--ink-soft)]">{status}</p> : null}
        </div>
      </article>
    </section>
  );
}

const fontOptions = [
  "Helvetica Neue",
  "Avenir Next",
  "Georgia",
  "Trebuchet MS",
  "Gill Sans",
  "Verdana",
  "Tahoma",
];

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-[1.15rem] bg-white/82 p-4 text-sm font-medium text-[color:var(--foreground)]">
      <span>{label}</span>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-11 rounded-full border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[0.9rem] border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none"
        />
      </div>
    </label>
  );
}

function FontField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-[1.15rem] bg-white/82 p-4 text-sm font-medium text-[color:var(--foreground)]">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-[0.9rem] border border-[color:var(--border)] bg-white px-3 py-3 text-sm outline-none"
      >
        {fontOptions.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
    </label>
  );
}
