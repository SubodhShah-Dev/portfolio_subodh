import type { Timestamp } from "firebase/firestore";

import type { Clearable } from "./write";

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

export type ContactSettingsInput = Clearable<
  Omit<ContactSettings, "id" | "updatedAt">
>;
