import { useAsync, type AsyncResult } from "./useAsync";
import { getMessages } from "../services/messageService";
import type { ContactMessage } from "../types/message";

/** Admin inbox — always fresh, never cached (§20). */
export function useMessages(): AsyncResult<ContactMessage[]> {
  return useAsync(() => getMessages(), [], {
    isEmpty: (items) => items.length === 0,
  });
}
