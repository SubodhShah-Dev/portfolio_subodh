import { useAsync, type AsyncResult } from "./useAsync";
import { getActiveResume, getResumes } from "../services/resumeService";
import type { Resume } from "../types/resume";

/** The single publicly downloadable resume, or empty when none is active. */
export function useActiveResume(): AsyncResult<Resume | null> {
  return useAsync(() => getActiveResume(), []);
}

/** Full resume list — admin only (§11). */
export function useResumes(): AsyncResult<Resume[]> {
  return useAsync(() => getResumes(), [], {
    isEmpty: (items) => items.length === 0,
  });
}
