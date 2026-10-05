import { useAsync, type AsyncResult } from "./useAsync";
import { getPublishedSocialLinks, getAllSocialLinks } from "../services/socialLinkService";
import type { SocialLink } from "../types/socialLink";

export function usePublishedSocialLinks(): AsyncResult<SocialLink[]> {
  return useAsync(() => getPublishedSocialLinks(), [], {
    isEmpty: (items) => items.length === 0,
  });
}

export function useAdminSocialLinks(): AsyncResult<SocialLink[]> {
  return useAsync(() => getAllSocialLinks(), [], {
    isEmpty: (items) => items.length === 0,
  });
}
