import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { toAppError } from "../utils/firebaseErrors";
import type { ContactMessage, ContactMessageInput } from "../types/message";

/**
 * Contact form messages (§20).
 *
 * Public users may CREATE messages only — they can never read, list, or
 * delete them (enforced by Security Rules, not by hiding UI). Only admins
 * read and manage the inbox. No caching: the inbox always loads fresh.
 */

const PATH = "messages";

export async function submitContactMessage(
  input: ContactMessageInput,
): Promise<string> {
  try {
    const reference = await addDoc(collection(db, PATH), {
      name: input.name.trim(),
      email: input.email.trim(),
      message: input.message.trim(),
      read: false,
      createdAt: serverTimestamp(),
    });
    return reference.id;
  } catch (error) {
    throw toAppError(error);
  }
}

export async function getMessages(): Promise<ContactMessage[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, PATH), orderBy("createdAt", "desc")),
    );
    return snapshot.docs.map(
      (entry) => ({ ...entry.data(), id: entry.id }) as ContactMessage,
    );
  } catch (error) {
    throw toAppError(error);
  }
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, PATH, id), { read });
  } catch (error) {
    throw toAppError(error);
  }
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PATH, id));
  } catch (error) {
    throw toAppError(error);
  }
}
