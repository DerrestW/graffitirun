import type { PublishingAdapter } from "../services/contracts";
import { facebookPublishingAdapter, xPublishingAdapter } from "../services/mock-services";

export const publishingAdapters: Record<string, PublishingAdapter> = {
  facebook_page: facebookPublishingAdapter,
  x_account: xPublishingAdapter,
};
