import test from "node:test";
import assert from "node:assert/strict";
import { drafts, templates, topics } from "../../lib/mock-data.ts";
import {
  buildDraftInsertRecord,
  buildDraftPayload,
  buildDraftStatusUpdate,
  buildSchedulePublishJobInput,
} from "./workflow.ts";

test("buildDraftPayload creates three caption variants and preserves topic hook context", () => {
  const payload = buildDraftPayload(topics[1]);

  assert.equal(payload.headline, "Tiny Rescue Owl Learns to Fly Again");
  assert.equal(payload.hook, topics[1].safetyNotes[0]);
  assert.equal(payload.captions.length, 3);
  assert.match(payload.captions[0].hashtagsText, /#animals/i);
});

test("buildDraftInsertRecord shapes draft, version, and captions for persistence", () => {
  const record = buildDraftInsertRecord({
    workspaceId: "workspace-graffiti-run",
    actorUserId: "user-1",
    topic: topics[0],
    template: templates[0],
  });

  assert.equal(record.draft.workspace_id, "workspace-graffiti-run");
  assert.equal(record.draft.topic_id, topics[0].id);
  assert.equal(record.draft.template_id, templates[0].id);
  assert.equal(record.version.version_number, 1);
  assert.equal(record.captions.length, 3);
});

test("buildDraftStatusUpdate only sets approver for approved and scheduled states", () => {
  assert.equal(buildDraftStatusUpdate("approved", "user-1").approved_by, "user-1");
  assert.equal(buildDraftStatusUpdate("scheduled", "user-1").approved_by, "user-1");
  assert.equal(buildDraftStatusUpdate("rejected", "user-1").approved_by, null);
});

test("buildSchedulePublishJobInput generates queued publish payload and log note", () => {
  const input = buildSchedulePublishJobInput({
    workspaceId: "workspace-graffiti-run",
    actorUserId: "user-1",
    draft: drafts[0],
    channelId: null,
    scheduledFor: "2026-03-12T15:00",
  });

  assert.equal(input.draftUpdate.status, "scheduled");
  assert.equal(input.publishJob.status, "queued");
  assert.equal(input.publishJob.error_message, "No publishing channel configured yet.");
  assert.match(input.approvalLogNote, /2026-03-12T20:00:00.000Z|2026-03-12T15:00:00.000Z/);
});
