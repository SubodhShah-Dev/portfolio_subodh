import type { Timestamp } from "firebase/firestore";

/** Contact section configuration (§19). Only supplied fields are rendered. */
export interface ContactSettings {
  id: string;
  title?: string;
  description?: string;
  email?: string;
  phone?: string;
  location?: string;
  enabled: boolean;
  updatedAt: Timestamp;
}

export type ContactSettingsInput = Omit<ContactSettings, "id" | "updatedAt">;
