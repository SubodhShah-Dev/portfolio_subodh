import type { OrderedContent } from "./common";
import type { Clearable } from "./write";

/** Social link (§18). Platform is free-form — no hardcoded platform list. */
export interface SocialLink extends OrderedContent {
  id: string;
  platform: string;
  label: string;
  url: string;
  iconUrl?: string;
}

export type SocialLinkInput = Clearable<
  Omit<SocialLink, "id" | "createdAt" | "updatedAt" | "publishedAt">
>;
