"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Template } from "@/lib/domain";
import {
  customTemplateStorageKey,
  defaultCustomTemplate,
  labelForHeadlinePlacement,
  labelForShape,
  labelForSubheadlinePlacement,
  normalizeCustomTemplate,
  type CustomTemplate,
} from "@/features/templates/custom-template";

export function CustomTemplateBuilder({ initialTemplates }: { initialTemplates: Template[] }) {
  const [draft, setDraft] = useState<CustomTemplate>(defaultCustomTemplate);
  const [savedTemplates, setSavedTemplates] = useState<CustomTemplate[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(customTemplateStorageKey);
      return raw ? (JSON.parse(raw) as Array<Partial<CustomTemplate>>).map(normalizeCustomTemplate) : [];
    } catch {
      return [];
    }
  });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(customTemplateStorageKey, JSON.stringify(savedTemplates.map(normalizeCustomTemplate)));
  }, [savedTemplates]);

  const seededNames = useMemo(() => new Set(initialTemplates.map((template) => template.name.toLowerCase())), [initialTemplates]);

  function saveTemplate() {
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      setStatus("Give the template a name before saving.");
      return;
    }

    const nextTemplate = {
      ...normalizeCustomTemplate(draft),
      id: draft.id || `custom-${Date.now()}`,
      name: trimmedName,
    };

    setSavedTemplates((current) => [nextTemplate, ...current.filter((item) => item.id !== nextTemplate.id)]);
    setDraft(defaultCustomTemplate);
    setStatus(seededNames.has(trimmedName.toLowerCase()) ? "Saved as a custom variation of an existing layout." : "Custom template saved locally in this browser.");
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Custom Template Builder</p>
        <h2 className="mt-3 display-font text-3xl font-semibold text-[color:var(--foreground)]">Compose your own layout</h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
          Build a reusable card by choosing text placement, text-background treatment, inset-image shape, and highlight behavior. Saved templates stay in this browser for now.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Template name">
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 w-full rounded-[0.95rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
            />
          </Field>
          <Field label="Logo display">
            <Select
              value={draft.logoMode}
              onChange={(value) => setDraft((current) => ({ ...current, logoMode: value as CustomTemplate["logoMode"] }))}
              options={[
                ["show", "Show logo"],
                ["hide", "Remove logo"],
              ]}
            />
          </Field>
          <Field label="Template type">
            <select
              value={draft.templateType}
              onChange={(event) => setDraft((current) => ({ ...current, templateType: event.target.value as CustomTemplate["templateType"] }))}
              className="mt-2 w-full rounded-[0.95rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="square">Feed square</option>
              <option value="story">Story</option>
              <option value="carousel">Carousel</option>
              <option value="text_fact">Text fact</option>
            </select>
          </Field>
          <Field label="Logo placement">
            <Select
              value={draft.logoPlacement}
              onChange={(value) => setDraft((current) => ({ ...current, logoPlacement: value as CustomTemplate["logoPlacement"] }))}
              options={[
                ["top_left", "Top left"],
                ["top_right", "Top right"],
                ["bottom_left", "Bottom left"],
                ["bottom_right", "Bottom right"],
              ]}
            />
          </Field>
          <Field label="Headline placement">
            <Select
              value={draft.headlinePlacement}
              onChange={(value) => setDraft((current) => ({ ...current, headlinePlacement: value as CustomTemplate["headlinePlacement"] }))}
              options={[
                ["top_banner", "Top banner"],
                ["center_card", "Center card"],
                ["lower_third", "Lower third"],
              ]}
            />
          </Field>
          <Field label="Subheader placement">
            <Select
              value={draft.subheadlinePlacement}
              onChange={(value) => setDraft((current) => ({ ...current, subheadlinePlacement: value as CustomTemplate["subheadlinePlacement"] }))}
              options={[
                ["under_headline", "Under headline"],
                ["middle_panel", "Middle panel"],
                ["footer_panel", "Footer panel"],
              ]}
            />
          </Field>
          <Field label="Text background shape">
            <Select
              value={draft.headlineShape}
              onChange={(value) => setDraft((current) => ({ ...current, headlineShape: value as CustomTemplate["headlineShape"] }))}
              options={[
                ["rounded_card", "Rounded card"],
                ["pill_strip", "Pill strip"],
                ["hard_strip", "Hard strip"],
              ]}
            />
          </Field>
          <Field label="Inset image shape">
            <Select
              value={draft.insetShape}
              onChange={(value) => setDraft((current) => ({ ...current, insetShape: value as CustomTemplate["insetShape"] }))}
              options={[
                ["circle", "Circle"],
                ["rounded_square", "Rounded square"],
                ["none", "No inset"],
              ]}
            />
          </Field>
          <Field label="Highlight mode">
            <Select
              value={draft.highlightMode}
              onChange={(value) => setDraft((current) => ({ ...current, highlightMode: value as CustomTemplate["highlightMode"] }))}
              options={[
                ["keywords", "Power words"],
                ["every_fifth", "Every fifth word"],
                ["none", "No highlights"],
              ]}
            />
          </Field>
          <Field label="Background style">
            <Select
              value={draft.backgroundStyle}
              onChange={(value) => setDraft((current) => ({ ...current, backgroundStyle: value as CustomTemplate["backgroundStyle"] }))}
              options={[
                ["navy_fade", "Navy fade"],
                ["warm_alert", "Warm alert"],
                ["emerald_wash", "Emerald wash"],
                ["teal_spotlight", "Teal spotlight"],
              ]}
            />
          </Field>
          <Field label="Accent color">
            <div className="mt-2 flex items-center gap-3 rounded-[0.95rem] border border-[color:var(--border)] bg-white px-4 py-3">
              <input
                type="color"
                value={draft.accentColor}
                onChange={(event) => setDraft((current) => ({ ...current, accentColor: event.target.value }))}
                className="h-10 w-10 rounded-full border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={draft.accentColor}
                onChange={(event) => setDraft((current) => ({ ...current, accentColor: event.target.value }))}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </Field>
          <Field label="Logo horizontal offset">
            <div className="mt-2 rounded-[0.95rem] border border-[color:var(--border)] bg-white px-4 py-3">
              <input
                type="range"
                min="0"
                max="80"
                value={draft.logoOffsetX}
                onChange={(event) => setDraft((current) => ({ ...current, logoOffsetX: Number(event.target.value) }))}
                className="w-full"
              />
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{draft.logoOffsetX}px</div>
            </div>
          </Field>
          <Field label="Logo vertical offset">
            <div className="mt-2 rounded-[0.95rem] border border-[color:var(--border)] bg-white px-4 py-3">
              <input
                type="range"
                min="0"
                max="80"
                value={draft.logoOffsetY}
                onChange={(event) => setDraft((current) => ({ ...current, logoOffsetY: Number(event.target.value) }))}
                className="w-full"
              />
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{draft.logoOffsetY}px</div>
            </div>
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={saveTemplate} className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white">
            Save custom template
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(defaultCustomTemplate);
              setStatus("Builder reset.");
            }}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]"
          >
            Reset
          </button>
        </div>
        {status ? <p className="mt-4 text-sm text-[color:var(--ink-soft)]">{status}</p> : null}
      </article>

      <article className="surface rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Live Layout Preview</p>
        <div className="mt-5">
          <TemplatePreview template={draft} />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <InfoPill label="Template name" value={draft.name || "Untitled"} />
          <InfoPill label="Logo" value={draft.logoMode === "hide" ? "removed" : `${draft.logoPlacement.replace("_", " ")} / ${draft.logoOffsetX}px ${draft.logoOffsetY}px`} />
          <InfoPill label="Text highlight" value={draft.highlightMode.replace("_", " ")} />
          <InfoPill label="Inset shape" value={draft.insetShape.replace("_", " ")} />
          <InfoPill label="Headline block" value={draft.headlineShape.replace("_", " ")} />
          <InfoPill label="Background mood" value={draft.backgroundStyle.replace("_", " ")} />
        </div>
      </article>

      <article className="surface rounded-[1.75rem] p-6 xl:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Saved Custom Templates</p>
            <h3 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">{savedTemplates.length} saved</h3>
          </div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {savedTemplates.map((template) => (
            <div key={template.id} className="rounded-[1.5rem] bg-white/82 p-4">
              <TemplatePreview template={template} compact />
              <h4 className="mt-4 text-lg font-semibold text-[color:var(--foreground)]">{template.name}</h4>
              <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                {labelForHeadlinePlacement(template.headlinePlacement)} headline, {labelForSubheadlinePlacement(template.subheadlinePlacement).toLowerCase()}, {labelForShape(template.insetShape).toLowerCase()} inset.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {template.logoMode === "hide" ? "Logo removed" : `Logo ${template.logoPlacement.replace("_", " ")}`}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(template);
                    setStatus(`Loaded ${template.name} into the builder.`);
                  }}
                  className="rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavedTemplates((current) => current.filter((item) => item.id !== template.id));
                    setStatus(`Removed ${template.name}.`);
                  }}
                  className="rounded-full bg-[#f4e6df] px-4 py-2 text-sm font-semibold text-[#8c3e22]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {savedTemplates.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-white/60 p-6 text-sm text-[color:var(--ink-soft)]">
              Save a custom template and it will appear here.
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-[0.95rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none">
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-sm font-medium text-[color:var(--foreground)]">
      {label}
      {children}
    </label>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-white/82 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}

function TemplatePreview({ template, compact = false }: { template: CustomTemplate; compact?: boolean }) {
  const background = backgroundMap[template.backgroundStyle];
  const headlinePosition = headlinePositionMap[template.headlinePlacement];
  const subheadlinePosition = subheadlinePositionMap[template.subheadlinePlacement];
  const headlineRadius = template.headlineShape === "pill_strip" ? 999 : template.headlineShape === "hard_strip" ? 10 : 26;
  const insetRadius = template.insetShape === "circle" ? 999 : template.insetShape === "rounded_square" ? 24 : 0;
  const canvasHeight = compact ? 320 : 460;
  const logoPosition = logoPositionMap[template.logoPlacement];
  const logoStyle =
    template.logoPlacement === "top_left" || template.logoPlacement === "bottom_left"
      ? { left: logoPosition.x + template.logoOffsetX }
      : { right: logoPosition.x + template.logoOffsetX };
  const logoVerticalStyle =
    template.logoPlacement === "top_left" || template.logoPlacement === "top_right"
      ? { top: logoPosition.y + template.logoOffsetY }
      : { bottom: logoPosition.y + template.logoOffsetY };

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] bg-[#0b1621] shadow-[0_18px_44px_rgba(15,23,42,0.22)]"
      style={{ height: canvasHeight, background }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.48))]" />
      {template.insetShape !== "none" ? (
        <div
          className="absolute left-5 top-5 border-[4px] border-white/80 bg-white/20"
          style={{ width: compact ? 82 : 116, height: compact ? 82 : 116, borderRadius: insetRadius }}
        />
      ) : null}
      {template.logoMode === "show" ? (
        <div
          className="absolute rounded-full bg-white/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#0d1420]"
          style={{ ...logoStyle, ...logoVerticalStyle }}
        >
          GR
        </div>
      ) : null}
      <div
        className="absolute px-5 py-4 text-[#111827] shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
        style={{
          left: headlinePosition.left,
          top: headlinePosition.top,
          right: headlinePosition.right,
          borderRadius: headlineRadius,
          background: template.headlineShape === "hard_strip" ? "#fff4ec" : "rgba(255,255,255,0.96)",
          transform: template.headlinePlacement === "lower_third" ? "rotate(-2deg)" : "none",
        }}
      >
        <div className="text-sm font-black leading-tight md:text-xl">
          This layout gives the headline a stronger visual stage
        </div>
      </div>
      <div
        className="absolute text-white"
        style={{
          left: subheadlinePosition.left,
          top: subheadlinePosition.top,
          right: subheadlinePosition.right,
          borderRadius: subheadlinePosition.hasBackground ? 22 : 0,
          background: subheadlinePosition.hasBackground ? "rgba(7,11,17,0.42)" : "transparent",
          padding: subheadlinePosition.hasBackground ? "16px 18px" : "0",
        }}
      >
        <div className="text-sm font-semibold leading-snug md:text-lg">
          {renderHighlightedLine(template.highlightMode, template.accentColor)}
        </div>
      </div>
    </div>
  );
}

function renderHighlightedLine(mode: CustomTemplate["highlightMode"], accentColor: string) {
  const words = ["Use", "power", "words", "or", "every", "fifth", "word", "to", "create", "patterned", "emphasis."];

  return words.map((word, index) => {
    const shouldHighlight = mode === "keywords" ? ["power", "patterned", "emphasis."].includes(word) : mode === "every_fifth" ? (index + 1) % 5 === 0 : false;

    return (
      <span key={`${word}-${index}`} style={{ color: shouldHighlight ? accentColor : "inherit" }}>
        {word}{" "}
      </span>
    );
  });
}

const backgroundMap: Record<CustomTemplate["backgroundStyle"], string> = {
  navy_fade: "linear-gradient(180deg,#173247 0%,#0a131d 100%)",
  warm_alert: "linear-gradient(180deg,#7d3f1f 0%,#17171d 100%)",
  emerald_wash: "linear-gradient(180deg,#1d5c49 0%,#09110f 100%)",
  teal_spotlight: "linear-gradient(180deg,#174f5c 0%,#091019 100%)",
};

const headlinePositionMap: Record<CustomTemplate["headlinePlacement"], { left: number; top: number; right?: number }> = {
  top_banner: { left: 24, top: 84, right: 160 },
  center_card: { left: 78, top: 188, right: 78 },
  lower_third: { left: 34, top: 270, right: 34 },
};

const logoPositionMap: Record<CustomTemplate["logoPlacement"], { x: number; y: number }> = {
  top_left: { x: 20, y: 20 },
  top_right: { x: 20, y: 20 },
  bottom_left: { x: 20, y: 20 },
  bottom_right: { x: 20, y: 20 },
};

const subheadlinePositionMap: Record<
  CustomTemplate["subheadlinePlacement"],
  { left: number; top: number; right: number; hasBackground: boolean }
> = {
  under_headline: { left: 38, top: 172, right: 38, hasBackground: false },
  middle_panel: { left: 54, top: 246, right: 54, hasBackground: true },
  footer_panel: { left: 34, top: 364, right: 34, hasBackground: true },
};
