import type { ContentStatus } from "../types/common";
import type { Skill, SkillInput } from "../types/skill";
import {
  createDoc,
  fetchOrdered,
  removeDoc,
  reorderDocs,
  setStatus,
  updateDocFields,
} from "./serviceUtils";

const PATH = "skills";

/** Published skills for the public site — query matches Security Rules (§12, §34). */
export async function getPublishedSkills(): Promise<Skill[]> {
  return fetchOrdered<Skill>(PATH, { publishedOnly: true });
}

/** Every entry including drafts and archived — admin only (§11). */
export async function getAllSkills(): Promise<Skill[]> {
  return fetchOrdered<Skill>(PATH);
}

export async function createSkill(input: SkillInput): Promise<string> {
  return createDoc(PATH, input, { published: input.status === "published" });
}

export async function updateSkill(
  id: string,
  input: Partial<SkillInput>,
): Promise<void> {
  return updateDocFields(PATH, id, input);
}

export async function deleteSkill(id: string): Promise<void> {
  return removeDoc(PATH, id);
}

export async function setSkillStatus(
  id: string,
  status: ContentStatus,
): Promise<void> {
  return setStatus(PATH, id, status);
}

/** Rewrites ordering to match the admin's displayed sequence (§49). */
export async function reorderSkills(ids: string[]): Promise<void> {
  return reorderDocs(PATH, ids);
}
