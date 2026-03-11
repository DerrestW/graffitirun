import type { PublishingAdapter } from "../services/contracts.ts";
import { facebookPublishingAdapter } from "../services/mock-services.ts";

export const publishingAdapters: Record<string, PublishingAdapter> = {
  facebook_page: facebookPublishingAdapter,
};
