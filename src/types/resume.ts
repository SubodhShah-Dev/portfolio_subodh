import type { Timestamp } from "firebase/firestore";

/** Where the active resume file lives (§22). */
export type ResumeSource = "storage" | "external";

/**
 * Resume metadata. PDF bytes are never stored in Firestore — only a real
 * downloadUrl supplied by Storage or by the administrator (§22, §24).
 */
export interface Resume {
  id: string;
  source: ResumeSource;
  fileName?: string;
  storagePath?: string;
  downloadUrl: string;
  fileSize?: number;
  contentType?: string;
  uploadedAt?: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

/** External-URL payload supplied by the administrator — never generated. */
export interface ExternalResumeInput {
  downloadUrl: string;
  fileName?: string;
}
