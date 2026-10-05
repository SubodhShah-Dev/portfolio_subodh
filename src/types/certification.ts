import type { OrderedContent } from "./common";

/** Certification record (§17). */
export interface Certification extends OrderedContent {
  id: string;
  title: string;
  issuer: string;
  issueDate?: string;
  credentialUrl?: string;
  description?: string;
}

export type CertificationInput = Omit<
  Certification,
  "id" | "createdAt" | "updatedAt" | "publishedAt"
>;
