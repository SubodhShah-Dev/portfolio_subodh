import { useAsync, type AsyncResult } from "./useAsync";
import {
  getAllProjects,
  getProjectById,
  getPublishedProjects,
} from "../services/projectService";
import type { Project } from "../types/project";

export function usePublishedProjects(): AsyncResult<Project[]> {
  return useAsync(() => getPublishedProjects(), [], {
    isEmpty: (items) => items.length === 0,
  });
}

export function useAdminProjects(): AsyncResult<Project[]> {
  return useAsync(() => getAllProjects(), [], {
    isEmpty: (items) => items.length === 0,
  });
}

/** Single published project; null renders Not Found (§14, §53). */
export function useProject(id: string): AsyncResult<Project | null> {
  return useAsync(() => getProjectById(id), [id]);
}
