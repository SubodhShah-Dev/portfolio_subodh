import type { ContentStatus } from "../types/common";
import type { Education, EducationInput } from "../types/education";
import {
  createDoc,
  fetchOrdered,
  removeDoc,
  reorderDocs,
  setStatus,
  updateDocFields,
} from "./serviceUtils";

const PATH = "education";

/** Published education for the public site — query matches Security Rules (§12, §34). */
export async function getPublishedEducation(): Promise<Education[]> {
  return fetchOrdered<Education>(PATH, { publishedOnly: true });
}

/** Every entry including drafts and archived — admin only (§11). */
export async function getAllEducation(): Promise<Education[]> {
  return fetchOrdered<Education>(PATH);
}

export async function createEducation(input: EducationInput): Promise<string> {
  return createDoc(PATH, input, { published: input.status === "published" });
}

export async function updateEducation(
  id: string,
  input: Partial<EducationInput>,
): Promise<void> {
  return updateDocFields(PATH, id, input);
}

export async function deleteEducation(id: string): Promise<void> {
  return removeDoc(PATH, id);
}

export async function setEducationStatus(
  id: string,
  status: ContentStatus,
): Promise<void> {
  return setStatus(PATH, id, status);
}

/** Rewrites ordering to match the admin's displayed sequence (§49). */
export async function reorderEducation(ids: string[]): Promise<void> {
  return reorderDocs(PATH, ids);
}
