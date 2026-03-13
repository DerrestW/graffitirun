/* eslint-disable @next/next/no-img-element */
"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Draft, Template, Topic } from "@/lib/domain";
import {
  customTemplateStorageKey,
  customTemplateToTemplate,
  normalizeCustomTemplate,
  type CustomTemplate,
} from "@/features/templates/custom-template";

type DraftStudioEditorProps = {
  draft: Draft;
  template: Template;
  templates: Template[];
  topic: Topic;
  initialTemplateId?: string;
};

type PlacementMode = "feed" | "story";

export function DraftStudioEditor({ draft, template, templates, topic, initialTemplateId }: DraftStudioEditorProps) {
  const router = useRouter();
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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(customTemplateStorageKey);
      const parsed = raw ? (JSON.parse(raw) as Array<Partial<CustomTemplate>>) : [];
      setCustomTemplates(parsed.map(normalizeCustomTemplate));
    } catch {
      setCustomTemplates([]);
    }
  }, []);

  const allTemplates = useMemo(() => {
    const localTemplates = customTemplates.map((item) => customTemplateToTemplate(item, draft.workspaceId));
    return [...templates, ...localTemplates];
  }, [customTemplates, draft.workspaceId, templates]);

  const activeTemplate = allTemplates.find((item) => item.id === selectedTemplateId) ?? template;
  const [headlineSize, setHeadlineSize] = useState(activeTemplate.config?.headline.fontSize ?? 72);
  const [summarySize, setSummarySize] = useState(activeTemplate.config?.subheadline.fontSize ?? 60);

  useEffect(() => {
    setHeadlineSize(activeTemplate.config?.headline.fontSize ?? 72);
    setSummarySize(activeTemplate.config?.subheadline.fontSize ?? 60);
  }, [activeTemplate]);

  const currentCaption = draft.captions[selectedCaption] ?? draft.captions[0];
  const previewWidth = placement === "story" ? 360 : 560;
  const previewHeight = placement === "story" ? 640 : 560;
  const inset = activeTemplate.config?.insetImage;
  const currentBackgroundUrl = backgroundImageUrl.trim() || topic.imageUrl;
  const currentInsetUrl = (insetImageUrl.trim() || currentBackgroundUrl) ?? topic.imageUrl;
  const hasBackgroundImage = currentBackgroundUrl.trim().length > 0;
  const hasInsetImage = currentInsetUrl.trim().length > 0;
  const renderUrl = buildRenderUrl({
    draftId: draft.id,
    headline,
    summary,
    hook,
    backgroundImageUrl: currentBackgroundUrl,
    insetImageUrl: currentInsetUrl,
    templateId: activeTemplate.id,
    customTemplate: selectedTemplateId.startsWith("custom-") ? customTemplates.find((item) => item.id === selectedTemplateId) ?? null : null,
  });
  const captionExport = [captionText, currentCaption?.ctaText, currentCaption?.hashtagsText]
    .filter(Boolean)
    .join("\n\n");

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
    const response = await fetch(renderUrl);
    if (!response.ok) {
      setAssetStatus("Could not generate the downloadable image.");
      return;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${slugify(topic.title)}-${placement}.png`;
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
          backgroundImageUrl: currentBackgroundUrl,
          insetImageUrl: currentInsetUrl,
          templateId: activeTemplate.id,
          customTemplate: selectedTemplateId.startsWith("custom-")
            ? customTemplates.find((item) => item.id === selectedTemplateId) ?? null
            : null,
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

        setAssetStatus("Finalized JPEG saved and publish started.");
        router.push(`/drafts/${draft.id}?status=${publishResult.status ?? "publish_executed"}`);
      } else {
        setAssetStatus("Finalized square JPEG saved for publishing.");
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
            <div className="mx-auto overflow-hidden rounded-[1.6rem] bg-black" style={{ width: previewWidth, maxWidth: "100%" }}>
              <div className="relative" style={{ width: "100%", height: previewHeight }}>
                {hasBackgroundImage ? (
                  <img src={currentBackgroundUrl} alt={topic.title} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,#2d4452,#10171c_72%)] px-8 text-center">
                    <div className="max-w-sm rounded-[1.5rem] border border-white/12 bg-white/8 px-6 py-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/62">Image needed</p>
                      <p className="mt-3 text-lg font-semibold">This source did not expose a usable article image.</p>
                      <p className="mt-3 text-sm leading-6 text-white/72">
                        Upload your own image or paste a better image URL in the panel on the right.
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/8 via-black/20 to-black/82" />
                {activeTemplate.config?.logo ? (
                  <div className="absolute right-4 top-4">
                    <img src="/brand/graffiti-run-badge.svg" alt="Graffiti Run" className="h-auto w-[120px]" />
                  </div>
                ) : null}
                {inset && hasInsetImage ? (
                  <div className="absolute left-4 top-4 overflow-hidden rounded-full border-[5px] border-white shadow-[0_16px_40px_rgba(0,0,0,0.35)]" style={{ width: 132, height: 132 }}>
                    <img src={currentInsetUrl} alt={`${topic.title} inset`} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="absolute inset-x-4 bottom-4">
                  <div
                    className="mb-3 inline-block max-w-[94%] -rotate-[3deg] rounded-[0.7rem] bg-white px-4 py-3 font-black text-black shadow-[0_12px_24px_rgba(0,0,0,0.28)]"
                    style={{ fontSize: `${Math.max(28, headlineSize / (placement === "story" ? 2 : 2.1))}px`, lineHeight: 1.02 }}
                  >
                    {headline}
                  </div>
                  <div
                    className="max-w-[94%] font-black text-white"
                    style={{ fontSize: `${Math.max(24, summarySize / (placement === "story" ? 2.2 : 2.35))}px`, lineHeight: 1.04 }}
                  >
                    <HighlightText
                      text={summary}
                      keywords={activeTemplate.config?.emphasis.keywords ?? []}
                      color={activeTemplate.config?.emphasis.color ?? "#ffd33d"}
                      mode={activeTemplate.config?.emphasis.mode ?? "keywords"}
                    />
                  </div>
                </div>
              </div>
            </div>
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
                {finalizeState === "saving" ? "Saving..." : "Save finalized JPEG"}
              </button>
              <button
                type="button"
                onClick={() => finalizeDraft({ publish: true })}
                disabled={finalizeState !== "idle"}
                className="rounded-full bg-[color:var(--success)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {finalizeState === "publishing" ? "Publishing..." : "Save & publish now"}
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
  backgroundImageUrl,
  insetImageUrl,
  templateId,
  customTemplate,
}: {
  draftId: string;
  headline: string;
  summary: string;
  hook: string;
  backgroundImageUrl: string;
  insetImageUrl: string;
  templateId: string;
  customTemplate: CustomTemplate | null;
}) {
  const params = new URLSearchParams({
    headline,
    summary,
    hook,
    backgroundImageUrl,
    insetImageUrl,
    templateId,
  });

  if (customTemplate) {
    params.set("customTemplate", JSON.stringify(customTemplate));
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

function HighlightText({
  text,
  keywords,
  color,
  mode,
}: {
  text: string;
  keywords: string[];
  color: string;
  mode: "keywords" | "every_fifth" | "none";
}) {
  const keywordSet = new Set(keywords.map((word) => word.toLowerCase()));
  return (
    <>
      {text.split(" ").map((word, index) => {
        const normalized = word.replace(/[^a-z0-9]/gi, "").toLowerCase();
        const highlighted = mode === "every_fifth" ? (index + 1) % 5 === 0 : mode === "keywords" ? keywordSet.has(normalized) : false;

        return (
          <span key={`${word}-${index}`} style={{ color: highlighted ? color : undefined }}>
            {index > 0 ? " " : ""}
            {word}
          </span>
        );
      })}
    </>
  );
}
