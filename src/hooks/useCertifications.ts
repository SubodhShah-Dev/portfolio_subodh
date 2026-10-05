import { useAsync, type AsyncResult } from "./useAsync";
import { getPublishedCertifications, getAllCertifications } from "../services/certificationService";
import type { Certification } from "../types/certification";

export function usePublishedCertifications(): AsyncResult<Certification[]> {
  return useAsync(() => getPublishedCertifications(), [], {
    isEmpty: (items) => items.length === 0,
  });
}

export function useAdminCertifications(): AsyncResult<Certification[]> {
  return useAsync(() => getAllCertifications(), [], {
    isEmpty: (items) => items.length === 0,
  });
}
