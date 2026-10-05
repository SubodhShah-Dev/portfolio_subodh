import type { ContactSettings, ContactSettingsInput } from "../types/contact";
import { fetchSingleDoc, upsertSingleDoc } from "./serviceUtils";

const PATH = "contact";
const DOC_ID = "main";

/** Public contact section configuration (§19) — only supplied fields render. */
export async function getContactSettings(): Promise<ContactSettings | null> {
  return fetchSingleDoc<ContactSettings>(PATH, DOC_ID);
}

export async function updateContactSettings(
  input: ContactSettingsInput,
): Promise<void> {
  return upsertSingleDoc(PATH, DOC_ID, input);
}
