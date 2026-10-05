import { useAsync, type AsyncResult } from "./useAsync";
import { getPublishedSkills, getAllSkills } from "../services/skillService";
import type { Skill } from "../types/skill";

export function usePublishedSkills(): AsyncResult<Skill[]> {
  return useAsync(() => getPublishedSkills(), [], {
    isEmpty: (items) => items.length === 0,
  });
}

export function useAdminSkills(): AsyncResult<Skill[]> {
  return useAsync(() => getAllSkills(), [], {
    isEmpty: (items) => items.length === 0,
  });
}
