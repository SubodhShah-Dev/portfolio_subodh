import { useAsync, type AsyncResult } from "./useAsync";
import { getPublishedEducation, getAllEducation } from "../services/educationService";
import type { Education } from "../types/education";

export function usePublishedEducation(): AsyncResult<Education[]> {
  return useAsync(() => getPublishedEducation(), [], {
    isEmpty: (items) => items.length === 0,
  });
}

export function useAdminEducation(): AsyncResult<Education[]> {
  return useAsync(() => getAllEducation(), [], {
    isEmpty: (items) => items.length === 0,
  });
}
