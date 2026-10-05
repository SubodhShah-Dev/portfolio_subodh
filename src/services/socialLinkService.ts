import type { ContentStatus } from "../types/common";
import type { SocialLink, SocialLinkInput } from "../types/socialLink";
import {
  createDoc,
  fetchOrdered,
  removeDoc,
  reorderDocs,
  setStatus,
  updateDocFields,
} from "./serviceUtils";

const PATH = "socialLinks";

/** Published socialLinks for the public site — query matches Security Rules (§12, §34). */
export async function getPublishedSocialLinks(): Promise<SocialLink[]> {
  return fetchOrdered<SocialLink>(PATH, { publishedOnly: true });
}

/** Every entry including drafts and archived — admin only (§11). */
export async function getAllSocialLinks(): Promise<SocialLink[]> {
  return fetchOrdered<SocialLink>(PATH);
}

export async function createSocialLink(input: SocialLinkInput): Promise<string> {
  return createDoc(PATH, input, { published: input.status === "published" });
}

export async function updateSocialLink(
  id: string,
  input: Partial<SocialLinkInput>,
): Promise<void> {
  return updateDocFields(PATH, id, input);
}

export async function deleteSocialLink(id: string): Promise<void> {
  return removeDoc(PATH, id);
}

export async function setSocialLinkStatus(
  id: string,
  status: ContentStatus,
): Promise<void> {
  return setStatus(PATH, id, status);
}

/** Rewrites ordering to match the admin's displayed sequence (§49). */
export async function reorderSocialLinks(ids: string[]): Promise<void> {
  return reorderDocs(PATH, ids);
}
