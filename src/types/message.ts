import type { Timestamp } from "firebase/firestore";

/**
 * Contact form submission (§20).
 * Public users may create messages but can never read, list, or delete them.
 */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
}

export type ContactMessageInput = Pick<ContactMessage, "name" | "email" | "message">;
