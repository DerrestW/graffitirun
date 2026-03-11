import "server-only";

import { trendProviders } from "./trend-provider-registry.ts";

export function getTrendProviders() {
  return trendProviders;
}
