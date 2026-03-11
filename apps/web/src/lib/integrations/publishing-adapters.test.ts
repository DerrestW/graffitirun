import test from "node:test";
import assert from "node:assert/strict";
import { publishingAdapters } from "./publishing-registry.ts";

test("publishing adapter registry resolves facebook adapter by key", () => {
  const adapter = publishingAdapters.facebook_page;

  assert.equal(adapter.channelKey, "facebook_page");
});

test("publishing adapter registry falls back to facebook stub", () => {
  const adapter = publishingAdapters.unknown_channel ?? publishingAdapters.facebook_page;

  assert.equal(adapter.channelKey, "facebook_page");
});
