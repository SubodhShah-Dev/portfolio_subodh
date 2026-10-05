import { useAsync, type AsyncResult } from "./useAsync";
import { getContactSettings } from "../services/contactService";
import type { ContactSettings } from "../types/contact";

export function useContactSettings(): AsyncResult<ContactSettings | null> {
  return useAsync(() => getContactSettings(), []);
}
