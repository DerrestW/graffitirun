import test from "node:test";
import assert from "node:assert/strict";
import { can } from "./rbac.ts";

test("owner can manage members and publish drafts", () => {
  assert.equal(can("owner", "manageMembers"), true);
  assert.equal(can("owner", "publishDrafts"), true);
});

test("reviewer can approve drafts but cannot create drafts", () => {
  assert.equal(can("reviewer", "approveDrafts"), true);
  assert.equal(can("reviewer", "createDrafts"), false);
});

test("analyst can view analytics but cannot publish drafts", () => {
  assert.equal(can("analyst", "viewAnalytics"), true);
  assert.equal(can("analyst", "publishDrafts"), false);
});
