import "server-only";

import { publishingAdapters } from "./publishing-registry.ts";

export function getPublishingAdapter(channelKey: string) {
  return publishingAdapters[channelKey] ?? publishingAdapters.facebook_page;
}
