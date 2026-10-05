import { useAsync, type AsyncResult } from "./useAsync";
import { getProfile } from "../services/profileService";
import type { PortfolioProfile } from "../types/profile";

export function useProfile(): AsyncResult<PortfolioProfile | null> {
  return useAsync(() => getProfile(), []);
}
