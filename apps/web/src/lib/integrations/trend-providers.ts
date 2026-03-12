import "server-only";

import { trendProviders } from "./trend-provider-registry";

export function getTrendProviders() {
  return trendProviders;
}
