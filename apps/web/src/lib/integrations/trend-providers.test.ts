import test from "node:test";
import assert from "node:assert/strict";
import { trendProviders } from "./trend-provider-registry.ts";

test("trend provider registry returns expected provider keys", () => {
  const providers = trendProviders.map((provider) => provider.providerKey);

  assert.deepEqual(providers.sort(), ["manual_entry", "mock_fixture", "rss_curated"]);
});
