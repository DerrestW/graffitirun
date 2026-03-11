import test from "node:test";
import assert from "node:assert/strict";
import { scoreCandidate } from "./ingestion-scoring.ts";

test("high-confidence weather candidates score with lower rights risk", () => {
  const scored = scoreCandidate({
    providerKey: "mock_fixture",
    sourceType: "mock_json",
    externalRef: "halo-001",
    title: "Massive Ice Halo Appears Over Finland",
    rightsConfidence: "high",
    rawCategory: "weather",
  });

  assert.equal(scored.freshness, 82);
  assert.equal(scored.viral, 88);
  assert.equal(scored.rightsRisk, 18);
  assert.ok(scored.final > 70);
});

test("political candidates get high political risk", () => {
  const scored = scoreCandidate({
    providerKey: "manual_entry",
    sourceType: "manual",
    externalRef: "politics-001",
    title: "Political Rally Update",
    rightsConfidence: "unknown",
    rawCategory: "politics",
  });

  assert.equal(scored.politicalRisk, 90);
  assert.equal(scored.rightsRisk, 28);
});

test("animal candidates receive stronger viral and brand fit scores", () => {
  const scored = scoreCandidate({
    providerKey: "rss_curated",
    sourceType: "rss",
    externalRef: "owl-002",
    title: "Tiny Rescue Owl Learns to Fly Again",
    rightsConfidence: "unknown",
    rawCategory: "animals",
  });

  assert.equal(scored.viral, 90);
  assert.equal(scored.brandFit, 93);
  assert.equal(scored.tragedyRisk, 8);
});
