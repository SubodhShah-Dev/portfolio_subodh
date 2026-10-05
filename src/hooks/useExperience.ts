import { useAsync, type AsyncResult } from "./useAsync";
import { getPublishedExperience, getAllExperience } from "../services/experienceService";
import type { Experience } from "../types/experience";

export function usePublishedExperience(): AsyncResult<Experience[]> {
  return useAsync(() => getPublishedExperience(), [], {
    isEmpty: (items) => items.length === 0,
  });
}

export function useAdminExperience(): AsyncResult<Experience[]> {
  return useAsync(() => getAllExperience(), [], {
    isEmpty: (items) => items.length === 0,
  });
}
