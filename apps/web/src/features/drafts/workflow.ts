import type { Database } from "../../lib/db/database.types.ts";
import type { Draft, Template, Topic } from "../../lib/domain.ts";

export function buildDraftPayload(topic: Topic) {
  const title = topic.title.replace(/[.!?]+$/, "");
  const headline = title.length > 72 ? `${title.slice(0, 69)}...` : title;
  const summary = topic.summary || "Original summary pending.";
  const hook = topic.safetyNotes[0] ?? "Manual review required before publish.";

  return {
    headline,
    summary,
    hook,
    captions: [
      {
        variantName: "Primary",
        captionText: `${summary} ${topic.rightsNotes[0] ?? ""}`.trim(),
        ctaText: "Would your audience stop scrolling for this?",
        hashtagsText: `#${topic.category.replace(/\s+/g, "")} #graffitirun #contentengine`,
      },
      {
        variantName: "Curiosity",
        captionText: `This one has a strong ${topic.category} hook and room for original framing.`,
        ctaText: "What should the first line emphasize?",
        hashtagsText: `#${topic.category.replace(/\s+/g, "")} #viralideas`,
      },
      {
        variantName: "Short",
        captionText: headline,
        ctaText: "Save this for the queue?",
        hashtagsText: "#scheduler #review",
      },
    ],
  };
}

export function buildDraftInsertRecord(args: {
  workspaceId: string;
  actorUserId: string;
  topic: Topic;
  template: Template;
}) {
  const payload = buildDraftPayload(args.topic);

  return {
    draft: {
      workspace_id: args.workspaceId,
      topic_id: args.topic.id,
      template_id: args.template.id,
      status: "new" as const,
      selected_headline: payload.headline,
      selected_summary: payload.summary,
      selected_hook: payload.hook,
      rendered_asset_path: `/renders/${args.topic.id}-${args.template.id}.png`,
      created_by: args.actorUserId,
    },
    version: {
      workspace_id: args.workspaceId,
      version_number: 1,
      headline: payload.headline,
      summary: payload.summary,
      hook_fact: payload.hook,
      body_copy: `Generated from topic ${args.topic.title}. Manual review required before publish.`,
      created_by: args.actorUserId,
    },
    captions: payload.captions.map((caption) => ({
      workspace_id: args.workspaceId,
      variant_name: caption.variantName,
      caption_text: caption.captionText,
      cta_text: caption.ctaText,
      hashtags_text: caption.hashtagsText,
    })),
  };
}

export function buildDraftStatusUpdate(
  status: Database["public"]["Tables"]["drafts"]["Row"]["status"],
  actorUserId: string,
) {
  return {
    status,
    approved_by: status === "approved" || status === "scheduled" ? actorUserId : null,
  };
}

export function buildSchedulePublishJobInput(args: {
  workspaceId: string;
  actorUserId: string;
  draft: Draft;
  channelId: string | null;
  scheduledFor: string;
}) {
  const scheduledIso = new Date(args.scheduledFor).toISOString();

  return {
    draftUpdate: {
      status: "scheduled" as const,
      scheduled_for: scheduledIso,
      approved_by: args.actorUserId,
    },
    publishJob: {
      workspace_id: args.workspaceId,
      draft_id: args.draft.id,
      channel_id: args.channelId,
      status: "queued" as const,
      scheduled_for: scheduledIso,
      response_json: {
        connector: "facebook_page",
        mode: "stubbed_until_credentials",
      },
      error_message: args.channelId ? null : "No publishing channel configured yet.",
    },
    approvalLogNote: `Scheduled for ${scheduledIso}.`,
  };
}
