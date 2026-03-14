/* eslint-disable @next/next/no-img-element */
"use client";

import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Draft, Template, TemplatePlacementOverrides, Topic } from "@/lib/domain";
import {
  customTemplateStorageKey,
  customTemplateToTemplate,
  normalizeCustomTemplate,
  type CustomTemplate,
} from "@/features/templates/custom-template";
import { loadBrandingSettings } from "@/lib/branding-storage";
import { brandingSettingsView } from "@/lib/settings";

type DraftStudioEditorProps = {
  draft: Draft;
  template: Template;
  templates: Template[];
  topic: Topic;
  initialTemplateId?: string;
};

type PlacementMode = "feed" | "story";
type EditableLayer = "headline" | "subheadline" | "inset" | "background";
type EditorInteraction =
  | {
      mode: "move" | "resize";
      layer: EditableLayer;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      originWidth: number;
    }
  | null;

export function DraftStudioEditor({ draft, template, templates, topic, initialTemplateId }: DraftStudioEditorProps) {
  const router = useRouter();
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const [selectedVersion, setSelectedVersion] = useState(0);
  const [selectedCaption, setSelectedCaption] = useState(0);
  const [placement, setPlacement] = useState<PlacementMode>("feed");
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId ?? template.id);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [headline, setHeadline] = useState(draft.versions[0]?.headline ?? draft.selectedHeadline);
  const [summary, setSummary] = useState(draft.versions[0]?.summary ?? draft.selectedSummary);
  const [hook, setHook] = useState(draft.versions[0]?.hookFact ?? draft.selectedHook);
  const [captionText, setCaptionText] = useState(draft.captions[0]?.captionText ?? "");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(topic.imageUrl);
  const [insetImageUrl, setInsetImageUrl] = useState(topic.insetImageUrl ?? topic.imageUrl);
  const [assetStatus, setAssetStatus] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<"background" | "inset" | null>(null);
  const [finalizeState, setFinalizeState] = useState<"idle" | "saving" | "publishing">("idle");
  const [brandFonts, setBrandFonts] = useState({
    heading: brandingSettingsView.headingFont,
    subheading: brandingSettingsView.subheadingFont,
    body: brandingSettingsView.bodyFont,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(customTemplateStorageKey);
      const parsed = raw ? (JSON.parse(raw) as Array<Partial<CustomTemplate>>) : [];
      setCustomTemplates(parsed.map(normalizeCustomTemplate));
    } catch {
      setCustomTemplates([]);
    }
  }, []);

  useEffect(() => {
    const hydrated = loadBrandingSettings(brandingSettingsView);
    setBrandFonts({
      heading: hydrated.headingFont,
      subheading: hydrated.subheadingFont,
      body: hydrated.bodyFont,
    });
  }, []);

  const allTemplates = useMemo(() => {
    const localTemplates = customTemplates.map((item) => customTemplateToTemplate(item, draft.workspaceId));
    return [...templates, ...localTemplates];
  }, [customTemplates, draft.workspaceId, templates]);

  const activeTemplate = allTemplates.find((item) => item.id === selectedTemplateId) ?? template;
  const [headlineSize, setHeadlineSize] = useState(activeTemplate.config?.headline.fontSize ?? 72);
  const [summarySize, setSummarySize] = useState(activeTemplate.config?.subheadline.fontSize ?? 60);
  const [placementOverrides, setPlacementOverrides] = useState<TemplatePlacementOverrides>({});
  const [interaction, setInteraction] = useState<EditorInteraction>(null);
  const [frameWidth, setFrameWidth] = useState(0);

  useEffect(() => {
    const fallbackHeadlineSize = activeTemplate.config?.headline.fontSize ?? 72;
    const fallbackSummarySize = activeTemplate.config?.subheadline.fontSize ?? 60;

    try {
      const raw = window.localStorage.getItem(buildEditorStorageKey(draft.id, selectedTemplateId));
      if (!raw) {
        setHeadlineSize(fallbackHeadlineSize);
        setSummarySize(fallbackSummarySize);
        setPlacementOverrides({});
        return;
      }

      const parsed = JSON.parse(raw) as {
        headlineSize?: number;
        summarySize?: number;
        placementOverrides?: TemplatePlacementOverrides;
      };

      setHeadlineSize(parsed.headlineSize ?? fallbackHeadlineSize);
      setSummarySize(parsed.summarySize ?? fallbackSummarySize);
      setPlacementOverrides(parsed.placementOverrides ?? {});
    } catch {
      setHeadlineSize(fallbackHeadlineSize);
      setSummarySize(fallbackSummarySize);
      setPlacementOverrides({});
    }
  }, [activeTemplate, draft.id, selectedTemplateId]);

  useEffect(() => {
    window.localStorage.setItem(
      buildEditorStorageKey(draft.id, selectedTemplateId),
      JSON.stringify({
        headlineSize,
        summarySize,
        placementOverrides,
      }),
    );
  }, [draft.id, headlineSize, placementOverrides, selectedTemplateId, summarySize]);

  const currentCaption = draft.captions[selectedCaption] ?? draft.captions[0];
  const isVerticalTemplate = activeTemplate.height > activeTemplate.width;
  const previewMaxWidth = placement === "story" || isVerticalTemplate ? 360 : 560;
  useEffect(() => {
    setFrameWidth(previewMaxWidth);
  }, [previewMaxWidth]);

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setFrameWidth(entry.contentRect.width);
      }
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const currentBackgroundUrl = backgroundImageUrl.trim() || topic.imageUrl;
  const currentInsetUrl = (insetImageUrl.trim() || currentBackgroundUrl) ?? topic.imageUrl;
  const renderBaseUrl = buildRenderUrl({
    draftId: draft.id,
    headline,
    summary,
    hook,
    headlineSize,
    summarySize,
    backgroundImageUrl: currentBackgroundUrl,
    insetImageUrl: currentInsetUrl,
    templateId: activeTemplate.id,
    customTemplate: selectedTemplateId.startsWith("custom-") ? customTemplates.find((item) => item.id === selectedTemplateId) ?? null : null,
    headingFont: brandFonts.heading,
    subheadingFont: brandFonts.subheading,
    useBrandFonts: true,
    placementOverrides,
  });
  const previewImageUrl = `${renderBaseUrl}&format=jpeg&snapshot=${buildSnapshotKey({
    headline,
    summary,
    hook,
    headlineSize,
    summarySize,
    backgroundImageUrl: currentBackgroundUrl,
    insetImageUrl: currentInsetUrl,
    templateId: activeTemplate.id,
    selectedTemplateId,
    placement,
    useBrandFonts: "true",
    placementOverrides: JSON.stringify(placementOverrides),
  })}`;
  const captionExport = [captionText, currentCaption?.ctaText, currentCaption?.hashtagsText]
    .filter(Boolean)
    .join("\n\n");
  const [displayedPreviewUrl, setDisplayedPreviewUrl] = useState(previewImageUrl);
  const [previewPending, setPreviewPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (previewImageUrl === displayedPreviewUrl) {
      setPreviewPending(false);
      return () => {
        cancelled = true;
      };
    }

    setPreviewPending(true);
    const image = new window.Image();
    image.onload = () => {
      if (!cancelled) {
        setDisplayedPreviewUrl(previewImageUrl);
        setPreviewPending(false);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setPreviewPending(false);
      }
    };
    image.src = previewImageUrl;

    return () => {
      cancelled = true;
    };
  }, [displayedPreviewUrl, previewImageUrl]);

  const previewScale = (frameWidth || previewMaxWidth) / activeTemplate.width;
  const effectiveHeadline = {
    x: placementOverrides.headline?.x ?? activeTemplate.config?.headline.x ?? 0,
    y: placementOverrides.headline?.y ?? activeTemplate.config?.headline.y ?? 0,
    width: placementOverrides.headline?.width ?? activeTemplate.config?.headline.width ?? 320,
    fontSize: headlineSize,
    rotation: placementOverrides.headline?.rotation ?? activeTemplate.config?.headline.rotation ?? 0,
    paddingY: activeTemplate.config?.headline.paddingY ?? 0,
  };
  const effectiveSubheadline = {
    x: placementOverrides.subheadline?.x ?? activeTemplate.config?.subheadline.x ?? 0,
    y: placementOverrides.subheadline?.y ?? activeTemplate.config?.subheadline.y ?? 0,
    width: placementOverrides.subheadline?.width ?? activeTemplate.config?.subheadline.width ?? 320,
    fontSize: summarySize,
    paddingY: activeTemplate.config?.subheadline.paddingY ?? 0,
  };
  const effectiveInset = {
    x: placementOverrides.insetImage?.x ?? activeTemplate.config?.insetImage?.x ?? 0,
    y: placementOverrides.insetImage?.y ?? activeTemplate.config?.insetImage?.y ?? 0,
    size: placementOverrides.insetImage?.size ?? activeTemplate.config?.insetImage?.size ?? 180,
    cornerRadius: activeTemplate.config?.insetImage?.cornerRadius ?? 999,
  };
  const effectiveFocalPoint = {
    x: placementOverrides.background?.focalPoint?.x ?? activeTemplate.config?.background.focalPoint?.x ?? 0.5,
    y: placementOverrides.background?.focalPoint?.y ?? activeTemplate.config?.background.focalPoint?.y ?? 0.5,
  };

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const deltaX = (event.clientX - interaction.startX) / Math.max(previewScale, 0.001);
      const deltaY = (event.clientY - interaction.startY) / Math.max(previewScale, 0.001);

      setPlacementOverrides((current) => {
        if (interaction.layer === "headline") {
          const nextX = clamp(interaction.originX + deltaX, 0, activeTemplate.width - 160);
          const nextY = clamp(interaction.originY + deltaY, 0, activeTemplate.height - 120);
          const nextWidth =
            interaction.mode === "resize"
              ? clamp(interaction.originWidth + deltaX, 240, activeTemplate.width - nextX)
              : current.headline?.width ?? effectiveHeadline.width;

          return {
            ...current,
            headline: {
              ...(current.headline ?? {}),
              x: nextX,
              y: interaction.mode === "move" ? nextY : current.headline?.y ?? effectiveHeadline.y,
              width: nextWidth,
            },
          };
        }

        if (interaction.layer === "inset") {
          const nextX = clamp(interaction.originX + deltaX, 0, activeTemplate.width - 80);
          const nextY = clamp(interaction.originY + deltaY, 0, activeTemplate.height - 80);
          const nextSize =
            interaction.mode === "resize"
              ? clamp(interaction.originWidth + deltaX, 80, Math.min(activeTemplate.width - nextX, activeTemplate.height - nextY))
              : current.insetImage?.size ?? effectiveInset.size;

          return {
            ...current,
            insetImage: {
              ...(current.insetImage ?? {}),
              x: nextX,
              y: interaction.mode === "move" ? nextY : current.insetImage?.y ?? effectiveInset.y,
              size: nextSize,
            },
          };
        }

        if (interaction.layer === "background") {
          return {
            ...current,
            background: {
              focalPoint: {
                x: clamp((interaction.originX + deltaX) / activeTemplate.width, 0, 1),
                y: clamp((interaction.originY + deltaY) / activeTemplate.height, 0, 1),
              },
            },
          };
        }

        const nextX = clamp(interaction.originX + deltaX, 0, activeTemplate.width - 160);
        const nextY = clamp(interaction.originY + deltaY, 0, activeTemplate.height - 80);
        const nextWidth =
          interaction.mode === "resize"
            ? clamp(interaction.originWidth + deltaX, 240, activeTemplate.width - nextX)
            : current.subheadline?.width ?? effectiveSubheadline.width;

        return {
          ...current,
          subheadline: {
            ...(current.subheadline ?? {}),
            x: nextX,
            y: interaction.mode === "move" ? nextY : current.subheadline?.y ?? effectiveSubheadline.y,
            width: nextWidth,
          },
        };
      });
    };

    const handleUp = () => setInteraction(null);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [
    activeTemplate.height,
    activeTemplate.width,
    effectiveFocalPoint.x,
    effectiveFocalPoint.y,
    effectiveHeadline.width,
    effectiveHeadline.y,
    effectiveInset.size,
    effectiveInset.y,
    effectiveSubheadline.width,
    effectiveSubheadline.y,
    interaction,
    previewScale,
  ]);

  function startInteraction(event: ReactPointerEvent<HTMLElement>, layer: EditableLayer, mode: "move" | "resize") {
    event.preventDefault();
    event.stopPropagation();

    const source =
      layer === "headline"
        ? effectiveHeadline
        : layer === "subheadline"
          ? effectiveSubheadline
          : layer === "inset"
            ? effectiveInset
            : {
                x: effectiveFocalPoint.x * activeTemplate.width,
                y: effectiveFocalPoint.y * activeTemplate.height,
                width: 0,
              };
    setInteraction({
      mode,
      layer,
      startX: event.clientX,
      startY: event.clientY,
      originX: source.x,
      originY: source.y,
      originWidth: source.width,
    });
  }

  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>,
    target: "background" | "inset",
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingTarget(target);
    setAssetStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/topic-image", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as { ok?: boolean; path?: string; error?: string };

      if (!response.ok || !result.ok || !result.path) {
        throw new Error(result.error ?? "Image upload failed.");
      }

      if (target === "background") {
        setBackgroundImageUrl(result.path);
      } else {
        setInsetImageUrl(result.path);
      }

      setAssetStatus(`${target === "background" ? "Main" : "Inset"} image updated.`);
    } catch (error) {
      setAssetStatus(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploadingTarget(null);
      event.target.value = "";
    }
  }

  async function handleDownloadImage() {
    const response = await fetch(previewImageUrl, { cache: "no-store" });
    if (!response.ok) {
      setAssetStatus("Could not generate the downloadable image.");
      return;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${slugify(topic.title)}-${placement}.jpg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setAssetStatus("Image download started.");
  }

  async function finalizeDraft(options?: { publish?: boolean }) {
    setFinalizeState(options?.publish ? "publishing" : "saving");
    setAssetStatus(null);

    try {
      const response = await fetch(`/api/drafts/${draft.id}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headline,
          summary,
          hook,
          headlineSize,
          summarySize,
          placementOverrides,
          backgroundImageUrl: currentBackgroundUrl,
          insetImageUrl: currentInsetUrl,
          templateId: activeTemplate.id,
          customTemplate: selectedTemplateId.startsWith("custom-")
            ? customTemplates.find((item) => item.id === selectedTemplateId) ?? null
            : null,
          headingFont: brandFonts.heading,
          subheadingFont: brandFonts.subheading,
          bodyFont: brandFonts.body,
          useBrandFonts: true,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; status?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Failed to save finalized image.");
      }

      if (options?.publish) {
        const publishResponse = await fetch(`/api/drafts/${draft.id}/publish-now`, {
          method: "POST",
        });
        const publishResult = (await publishResponse.json()) as { ok?: boolean; error?: string; status?: string };
        if (!publishResponse.ok || !publishResult.ok) {
          throw new Error(publishResult.error ?? "Failed to publish finalized image.");
        }

        setAssetStatus("Final image approved and publish started.");
        router.push(`/drafts/${draft.id}?status=${publishResult.status ?? "publish_executed"}`);
      } else {
        setAssetStatus("Final image approved for publishing.");
        router.push(`/drafts/${draft.id}?status=${result.status ?? "draft_finalized"}`);
      }

      router.refresh();
    } catch (error) {
      setAssetStatus(error instanceof Error ? error.message : "Failed to save finalized image.");
    } finally {
      setFinalizeState("idle");
    }
  }

  function handleDownloadCaption() {
    const blob = new Blob([captionExport], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${slugify(topic.title)}-${placement}-caption.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setAssetStatus("Caption download started.");
  }

  return (
    <div className="grid gap-6">
      <article className="surface section-card rounded-[1.75rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Live placement preview</p>
            <h2 className="mt-2 display-font text-3xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
              Draft Studio
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
              Pick a version, pick a caption, make a custom edit, then preview feed or story placement before approval.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-[color:var(--border)] bg-[#f3eee6] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            {(["feed", "story"] as PlacementMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPlacement(mode)}
                className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.24em] transition ${
                  placement === mode
                    ? "bg-[color:var(--navy)] text-white shadow-[0_10px_22px_rgba(20,56,74,0.28)]"
                    : "text-[color:var(--ink-soft)] hover:bg-white hover:text-[color:var(--foreground)]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-[2rem] bg-[#10171c] p-4 shadow-[0_28px_80px_rgba(14,23,29,0.28)]">
            <div
              ref={previewFrameRef}
              className="mx-auto relative overflow-hidden rounded-[1.6rem] bg-black"
              style={{ width: previewMaxWidth, maxWidth: "100%" }}
            >
              <img
                src={displayedPreviewUrl}
                alt={`${topic.title} preview`}
                className={`block h-auto w-full transition-opacity duration-200 ${previewPending ? "opacity-80" : "opacity-100"}`}
              />
              <div className="pointer-events-none absolute inset-0">
                <button
                  type="button"
                  onPointerDown={(event) => startInteraction(event, "background", "move")}
                  className="pointer-events-auto absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[rgba(15,17,21,0.62)] shadow-[0_8px_20px_rgba(15,17,21,0.25)]"
                  style={{
                    left: effectiveFocalPoint.x * activeTemplate.width * previewScale,
                    top: effectiveFocalPoint.y * activeTemplate.height * previewScale,
                  }}
                >
                  <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[rgba(15,17,21,0.72)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    Image focus
                  </span>
                </button>
                <button
                  type="button"
                  onPointerDown={(event) => startInteraction(event, "headline", "move")}
                  className="pointer-events-auto absolute overflow-hidden rounded-[1.1rem] border-2 border-white/80 bg-white/12 shadow-[0_8px_20px_rgba(15,17,21,0.22)]"
                  style={{
                    left: effectiveHeadline.x * previewScale,
                    top: effectiveHeadline.y * previewScale,
                    width: effectiveHeadline.width * previewScale,
                    height:
                      estimateBoxHeight(
                        headline,
                        effectiveHeadline.width,
                        effectiveHeadline.fontSize,
                        activeTemplate.templateType,
                        effectiveHeadline.paddingY * 2,
                      ) * previewScale,
                    transform: `rotate(${effectiveHeadline.rotation}deg)`,
                    transformOrigin: "top left",
                  }}
                >
                  <div className="absolute inset-0 rounded-[1rem] bg-white/92" />
                  <span className="absolute left-3 top-2 rounded-full bg-[rgba(15,17,21,0.72)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    Headline
                  </span>
                  <div
                    className="absolute inset-x-0 bottom-0 text-left font-semibold text-[#0f1115]"
                    style={{
                      paddingLeft: (activeTemplate.config?.headline.paddingX ?? 0) * previewScale,
                      paddingRight: (activeTemplate.config?.headline.paddingX ?? 0) * previewScale,
                      paddingTop: 24 * previewScale,
                      paddingBottom: (activeTemplate.config?.headline.paddingY ?? 0) * previewScale,
                      fontSize: effectiveHeadline.fontSize * previewScale,
                      lineHeight: 1.08,
                    }}
                  >
                    {wrapTextForEstimate(
                      headline,
                      activeTemplate.templateType === "story"
                        ? Math.max(Math.round(effectiveHeadline.width / 34), 16)
                        : Math.max(Math.round(effectiveHeadline.width / 32), 18),
                    )
                      .slice(0, 3)
                      .map((line, index) => (
                        <div key={`${line}-${index}`}>{line}</div>
                      ))}
                  </div>
                  <span
                    onPointerDown={(event) => startInteraction(event, "headline", "resize")}
                    className="absolute bottom-2 right-2 h-4 w-4 rounded-full border border-white bg-[color:var(--accent)]"
                  />
                </button>
                <button
                  type="button"
                  onPointerDown={(event) => startInteraction(event, "subheadline", "move")}
                  className="pointer-events-auto absolute overflow-hidden rounded-[1rem] border-2 border-white/70 bg-white/8 shadow-[0_8px_20px_rgba(15,17,21,0.18)]"
                  style={{
                    left: effectiveSubheadline.x * previewScale,
                    top: effectiveSubheadline.y * previewScale,
                    width: effectiveSubheadline.width * previewScale,
                    height:
                      estimateBoxHeight(
                        summary,
                        effectiveSubheadline.width,
                        effectiveSubheadline.fontSize,
                        activeTemplate.templateType,
                        effectiveSubheadline.paddingY * 2,
                      ) * previewScale,
                  }}
                >
                  {activeTemplate.config?.subheadline.backgroundColor ? (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: activeTemplate.config.subheadline.backgroundColor }}
                    />
                  ) : null}
                  <span className="absolute left-3 top-2 rounded-full bg-[rgba(15,17,21,0.72)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    Secondary
                  </span>
                  <div
                    className="absolute inset-x-0 bottom-0 text-left font-semibold text-white"
                    style={{
                      paddingLeft: (activeTemplate.config?.subheadline.paddingX ?? 0) * previewScale,
                      paddingRight: (activeTemplate.config?.subheadline.paddingX ?? 0) * previewScale,
                      paddingTop: 24 * previewScale,
                      paddingBottom: (activeTemplate.config?.subheadline.paddingY ?? 0) * previewScale,
                      fontSize: effectiveSubheadline.fontSize * previewScale,
                      lineHeight: 1.08,
                    }}
                  >
                    {wrapTextForEstimate(
                      summary,
                      activeTemplate.templateType === "story"
                        ? Math.max(Math.round(effectiveSubheadline.width / 34), 16)
                        : Math.max(Math.round(effectiveSubheadline.width / 32), 18),
                    )
                      .slice(0, 3)
                      .map((line, index) => (
                        <div key={`${line}-${index}`}>{line}</div>
                      ))}
                  </div>
                  <span
                    onPointerDown={(event) => startInteraction(event, "subheadline", "resize")}
                    className="absolute bottom-2 right-2 h-4 w-4 rounded-full border border-white bg-[color:var(--navy)]"
                  />
                </button>
                {activeTemplate.config?.insetImage ? (
                  <button
                    type="button"
                    onPointerDown={(event) => startInteraction(event, "inset", "move")}
                    className="pointer-events-auto absolute border-2 border-white/90 bg-white/8 shadow-[0_8px_20px_rgba(15,17,21,0.2)]"
                    style={{
                      left: effectiveInset.x * previewScale,
                      top: effectiveInset.y * previewScale,
                      width: effectiveInset.size * previewScale,
                      height: effectiveInset.size * previewScale,
                      borderRadius: Math.min(effectiveInset.cornerRadius, effectiveInset.size / 2) * previewScale,
                    }}
                  >
                    <span className="absolute left-3 top-2 rounded-full bg-[rgba(15,17,21,0.72)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                      Inset image
                    </span>
                    <span
                      onPointerDown={(event) => startInteraction(event, "inset", "resize")}
                      className="absolute bottom-2 right-2 h-4 w-4 rounded-full border border-white bg-[color:var(--success)]"
                    />
                  </button>
                ) : null}
              </div>
            </div>
            {previewPending ? <p className="mx-auto mt-3 max-w-[560px] text-xs uppercase tracking-[0.18em] text-white/56">Updating preview…</p> : null}
            {placement === "feed" ? (
              <div className="mx-auto mt-4 max-w-[560px] rounded-[1.25rem] bg-white px-4 py-4 text-sm text-[color:var(--foreground)]">
                <p className="font-semibold text-[color:var(--foreground)]">{currentCaption?.variantName ?? "Selected caption"}</p>
                <p className="mt-2 leading-6 text-[color:var(--ink-soft)]">{captionText}</p>
                {currentCaption?.hashtagsText ? <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">{currentCaption.hashtagsText}</p> : null}
              </div>
            ) : (
              <div className="mx-auto mt-4 max-w-[560px] rounded-[1.25rem] bg-white/10 px-4 py-4 text-sm text-white/78">
                Story view removes the long caption and shows the post as an image-first card.
              </div>
            )}
            <div className="mx-auto mt-4 flex max-w-[560px] flex-wrap gap-3">
              <button
                type="button"
                onClick={() => finalizeDraft()}
                disabled={finalizeState !== "idle"}
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {finalizeState === "saving" ? "Saving..." : "Approve final image"}
              </button>
              <button
                type="button"
                onClick={() => finalizeDraft({ publish: true })}
                disabled={finalizeState !== "idle"}
                className="rounded-full bg-[color:var(--success)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {finalizeState === "publishing" ? "Publishing..." : "Approve & publish now"}
              </button>
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={finalizeState !== "idle"}
                className="rounded-full bg-[color:var(--navy)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                Download image
              </button>
              <button
                type="button"
                onClick={handleDownloadCaption}
                disabled={finalizeState !== "idle"}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Download caption
              </button>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                Manual {placement} pack
              </span>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="surface-strong rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Template</p>
              <div className="mt-4 grid gap-3">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Active template
                  <select
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                    className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  >
                    {templates.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · built-in
                      </option>
                    ))}
                    {customTemplates.length > 0 ? <option disabled>──────────</option> : null}
                    {customTemplates.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · custom
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-[1rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                  <span className="font-semibold text-[color:var(--foreground)]">Layout:</span>{" "}
                  {activeTemplate.layoutLabel ?? "Custom layout"}
                </div>
                <div className="rounded-[1rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                  <span className="font-semibold text-[color:var(--foreground)]">Headline:</span>{" "}
                  {activeTemplate.headlinePlacement ?? "Default"}
                </div>
          <div className="rounded-[1rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
            <span className="font-semibold text-[color:var(--foreground)]">Subheader:</span>{" "}
            {activeTemplate.subheadlinePlacement ?? "Default"}
          </div>
        </div>
      </div>

            <div className="surface-strong rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Placement controls</p>
              <div className="mt-4 space-y-5">
                <label className="block text-sm font-medium text-[color:var(--foreground)]">
                  Headline size
                  <div className="mt-2 flex items-center gap-4">
                    <input type="range" min="44" max="120" value={headlineSize} onChange={(event) => setHeadlineSize(Number(event.target.value))} className="w-full" />
                    <span className="w-12 text-right text-sm text-[color:var(--ink-soft)]">{headlineSize}</span>
                  </div>
                </label>
                <label className="block text-sm font-medium text-[color:var(--foreground)]">
                  Secondary line size
                  <div className="mt-2 flex items-center gap-4">
                    <input type="range" min="34" max="100" value={summarySize} onChange={(event) => setSummarySize(Number(event.target.value))} className="w-full" />
                    <span className="w-12 text-right text-sm text-[color:var(--ink-soft)]">{summarySize}</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="surface-strong rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Image source</p>
              <div className="mt-4 grid gap-4">
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Main image URL
                  <input
                    type="url"
                    value={backgroundImageUrl}
                    onChange={(event) => setBackgroundImageUrl(event.target.value)}
                    placeholder="Paste a feed image or your own URL"
                    className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Upload replacement main image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => handleImageUpload(event, "background")}
                    className="mt-2 block w-full text-sm text-[color:var(--ink-soft)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--navy)] file:px-4 file:py-2 file:font-semibold file:text-white"
                  />
                </label>
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Inset image URL
                  <input
                    type="url"
                    value={insetImageUrl}
                    onChange={(event) => setInsetImageUrl(event.target.value)}
                    placeholder="Optional close-up or reaction image"
                    className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-sm font-medium text-[color:var(--foreground)]">
                  Upload replacement inset image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => handleImageUpload(event, "inset")}
                    className="mt-2 block w-full text-sm text-[color:var(--ink-soft)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--accent)] file:px-4 file:py-2 file:font-semibold file:text-white"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBackgroundImageUrl(topic.imageUrl);
                      setInsetImageUrl(topic.insetImageUrl ?? topic.imageUrl);
                      setAssetStatus("Reverted to the ingested topic image.");
                    }}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]"
                  >
                    Reset to ingested image
                  </button>
                  {uploadingTarget ? (
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                      Uploading {uploadingTarget}...
                    </span>
                  ) : null}
                </div>
                {assetStatus ? <p className="text-sm text-[color:var(--ink-soft)]">{assetStatus}</p> : null}
              </div>
            </div>

            <div className="surface-strong rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Current selection</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[1rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                  <span className="font-semibold text-[color:var(--foreground)]">Version:</span> {selectedVersion + 1}
                </div>
                <div className="rounded-[1rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                  <span className="font-semibold text-[color:var(--foreground)]">Caption:</span> {currentCaption?.variantName ?? "None"}
                </div>
                <div className="rounded-[1rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                  <span className="font-semibold text-[color:var(--foreground)]">Placement:</span> {placement}
                </div>
                <div className="rounded-[1rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
                  <span className="font-semibold text-[color:var(--foreground)]">Template:</span> {activeTemplate.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface section-card rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Headline versions</p>
          <div className="mt-4 grid gap-3">
            {draft.versions.map((version, index) => (
              <button
                key={version.versionNumber}
                type="button"
                onClick={() => {
                  setSelectedVersion(index);
                  setHeadline(version.headline);
                  setSummary(version.summary);
                  setHook(version.hookFact);
                }}
                className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${
                  selectedVersion === index
                    ? "border-[color:var(--accent)] bg-[linear-gradient(135deg,rgba(217,107,49,0.16),rgba(255,255,255,0.92))] shadow-[0_18px_36px_rgba(217,107,49,0.14)]"
                    : "border-[color:var(--border)] bg-white/78 hover:border-[color:var(--accent-soft)] hover:bg-white"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">Version {version.versionNumber}</p>
                <p className="mt-2 text-base leading-6 text-[color:var(--foreground)]">{version.headline}</p>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">{version.summary}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="surface section-card rounded-[1.75rem] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Caption variants</p>
          <div className="mt-4 grid gap-3">
            {draft.captions.map((caption, index) => (
              <button
                key={caption.id}
                type="button"
                onClick={() => {
                  setSelectedCaption(index);
                  setCaptionText(caption.captionText);
                }}
                className={`w-full rounded-[1.2rem] border px-4 py-4 text-left transition ${
                  selectedCaption === index
                    ? "border-[color:var(--navy)] bg-[linear-gradient(135deg,rgba(20,56,74,0.16),rgba(255,255,255,0.94))] shadow-[0_18px_36px_rgba(20,56,74,0.16)]"
                    : "border-[color:var(--border)] bg-white/78 hover:border-[color:var(--glow)] hover:bg-white"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">{caption.variantName}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{caption.captionText}</p>
              </button>
            ))}
          </div>
        </article>
      </section>

      <article className="surface section-card rounded-[1.75rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Manual edit</p>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <label className="text-sm font-medium text-[color:var(--foreground)]">
            Headline
            <textarea value={headline} onChange={(event) => setHeadline(event.target.value)} rows={4} className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none" />
          </label>
          <label className="text-sm font-medium text-[color:var(--foreground)]">
            Secondary line
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none" />
          </label>
          <label className="text-sm font-medium text-[color:var(--foreground)] xl:col-span-2">
            Caption
            <textarea value={captionText} onChange={(event) => setCaptionText(event.target.value)} rows={4} className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none" />
          </label>
          <label className="text-sm font-medium text-[color:var(--foreground)] xl:col-span-2">
            Hook / internal note
            <input value={hook} onChange={(event) => setHook(event.target.value)} className="mt-2 w-full rounded-[1rem] border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none" />
          </label>
        </div>
      </article>
    </div>
  );
}

function buildRenderUrl({
  draftId,
  headline,
  summary,
  hook,
  headlineSize,
  summarySize,
  backgroundImageUrl,
  insetImageUrl,
  templateId,
  customTemplate,
  headingFont,
  subheadingFont,
  useBrandFonts,
  placementOverrides,
}: {
  draftId: string;
  headline: string;
  summary: string;
  hook: string;
  headlineSize: number;
  summarySize: number;
  backgroundImageUrl: string;
  insetImageUrl: string;
  templateId: string;
  customTemplate: CustomTemplate | null;
  headingFont: string;
  subheadingFont: string;
  useBrandFonts: boolean;
  placementOverrides: TemplatePlacementOverrides;
}) {
  const params = new URLSearchParams({
    headline,
    summary,
    hook,
    headlineSize: String(headlineSize),
    summarySize: String(summarySize),
    backgroundImageUrl,
    insetImageUrl,
    templateId,
    useBrandFonts: String(useBrandFonts),
  });

  if (useBrandFonts) {
    params.set("headingFont", headingFont);
    params.set("subheadingFont", subheadingFont);
  }

  if (customTemplate) {
    params.set("customTemplate", JSON.stringify(customTemplate));
  }

  if (placementOverrides.headline || placementOverrides.subheadline) {
    params.set("placementOverrides", JSON.stringify(placementOverrides));
  }

  return `/api/renders/drafts/${draftId}?${params.toString()}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildSnapshotKey(input: Record<string, string | number>) {
  return Object.entries(input)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

function buildEditorStorageKey(draftId: string, templateId: string) {
  return `graffiti-run-draft-editor:${draftId}:${templateId}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wrapTextForEstimate(text: string, lineLength: number) {
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

function estimateBoxHeight(text: string, width: number, fontSize: number, templateType: Template["templateType"], paddingY: number) {
  const lineLength = templateType === "story" ? Math.max(Math.round(width / 34), 16) : Math.max(Math.round(width / 32), 18);
  const lines = wrapTextForEstimate(text, lineLength).slice(0, templateType === "story" ? 3 : 3);
  return Math.max(lines.length * fontSize * 1.08 + paddingY + 12, fontSize + paddingY + 20);
}
