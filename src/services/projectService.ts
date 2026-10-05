import type { ContentStatus } from "../types/common";
import type { Project, ProjectInput } from "../types/project";
import {
  createDoc,
  fetchDocById,
  fetchOrdered,
  removeDoc,
  reorderDocs,
  setStatus,
  updateDocFields,
} from "./serviceUtils";

const PATH = "projects";

/** Published projects for public pages — query matches Security Rules (§12, §34). */
export async function getPublishedProjects(): Promise<Project[]> {
  return fetchOrdered<Project>(PATH, { publishedOnly: true });
}

/** Every project including drafts and archived — admin only (§11). */
export async function getAllProjects(): Promise<Project[]> {
  return fetchOrdered<Project>(PATH);
}

/**
 * Single project for /projects/:id.
 * Returns null for missing, draft, and archived projects alike — the public
 * route renders Not Found without leaking existence (§53).
 */
export async function getProjectById(id: string): Promise<Project | null> {
  return fetchDocById<Project>(PATH, id);
}

export async function createProject(input: ProjectInput): Promise<string> {
  return createDoc(PATH, input, { published: input.status === "published" });
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput>,
): Promise<void> {
  return updateDocFields(PATH, id, input);
}

export async function deleteProject(id: string): Promise<void> {
  return removeDoc(PATH, id);
}

export async function setProjectStatus(
  id: string,
  status: ContentStatus,
): Promise<void> {
  return setStatus(PATH, id, status);
}

/** Rewrites ordering to match the admin's displayed sequence (§49). */
export async function reorderProjects(ids: string[]): Promise<void> {
  return reorderDocs(PATH, ids);
}
