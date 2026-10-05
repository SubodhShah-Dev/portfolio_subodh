import { useAsync, type AsyncResult } from "./useAsync";
import { getSiteSettings } from "../services/settingsService";
import type { SiteSettings } from "../types/settings";

/** Global site configuration; null until first save (§47, §48). */
export function useSiteSettings(): AsyncResult<SiteSettings | null> {
  return useAsync(() => getSiteSettings(), []);
}
