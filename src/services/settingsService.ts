import type { SiteSettings, SiteSettingsInput } from "../types/settings";
import { fetchDocById, upsertSingleDoc } from "./serviceUtils";

const PATH = "settings";
const DOC_ID = "main";

/** Global site configuration (§47), including section visibility (§48). */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  return fetchDocById<SiteSettings>(PATH, DOC_ID);
}

export async function updateSiteSettings(
  input: SiteSettingsInput,
): Promise<void> {
  return upsertSingleDoc(PATH, DOC_ID, input);
}
