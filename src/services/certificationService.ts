import type { ContentStatus } from "../types/common";
import type { Certification, CertificationInput } from "../types/certification";
import {
  createDoc,
  fetchOrdered,
  removeDoc,
  reorderDocs,
  setStatus,
  updateDocFields,
} from "./serviceUtils";

const PATH = "certifications";

/** Published certifications for the public site — query matches Security Rules (§12, §34). */
export async function getPublishedCertifications(): Promise<Certification[]> {
  return fetchOrdered<Certification>(PATH, { publishedOnly: true });
}

/** Every entry including drafts and archived — admin only (§11). */
export async function getAllCertifications(): Promise<Certification[]> {
  return fetchOrdered<Certification>(PATH);
}

export async function createCertification(input: CertificationInput): Promise<string> {
  return createDoc(PATH, input, { published: input.status === "published" });
}

export async function updateCertification(
  id: string,
  input: Partial<CertificationInput>,
): Promise<void> {
  return updateDocFields(PATH, id, input);
}

export async function deleteCertification(id: string): Promise<void> {
  return removeDoc(PATH, id);
}

export async function setCertificationStatus(
  id: string,
  status: ContentStatus,
): Promise<void> {
  return setStatus(PATH, id, status);
}

/** Rewrites ordering to match the admin's displayed sequence (§49). */
export async function reorderCertifications(ids: string[]): Promise<void> {
  return reorderDocs(PATH, ids);
}
