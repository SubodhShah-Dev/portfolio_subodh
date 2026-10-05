import type { ContentStatus } from "../types/common";
import type { Experience, ExperienceInput } from "../types/experience";
import {
  createDoc,
  fetchOrdered,
  removeDoc,
  reorderDocs,
  setStatus,
  updateDocFields,
} from "./serviceUtils";

const PATH = "experience";

/** Published experience for the public site — query matches Security Rules (§12, §34). */
export async function getPublishedExperience(): Promise<Experience[]> {
  return fetchOrdered<Experience>(PATH, { publishedOnly: true });
}

/** Every entry including drafts and archived — admin only (§11). */
export async function getAllExperience(): Promise<Experience[]> {
  return fetchOrdered<Experience>(PATH);
}

export async function createExperience(input: ExperienceInput): Promise<string> {
  return createDoc(PATH, input, { published: input.status === "published" });
}

export async function updateExperience(
  id: string,
  input: Partial<ExperienceInput>,
): Promise<void> {
  return updateDocFields(PATH, id, input);
}

export async function deleteExperience(id: string): Promise<void> {
  return removeDoc(PATH, id);
}

export async function setExperienceStatus(
  id: string,
  status: ContentStatus,
): Promise<void> {
  return setStatus(PATH, id, status);
}

/** Rewrites ordering to match the admin's displayed sequence (§49). */
export async function reorderExperience(ids: string[]): Promise<void> {
  return reorderDocs(PATH, ids);
}
