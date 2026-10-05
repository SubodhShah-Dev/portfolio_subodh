import { doc, getDoc } from "firebase/firestore";

import { db } from "../config/firebase";
import { getFirebaseCode, toAppError } from "../utils/firebaseErrors";

/**
 * Administrator authorization (§31, §32).
 *
 * Authentication answers "who is signed in"; this service answers "who is
 * allowed to modify production portfolio content". Admin records live at
 * admins/{uid} and are created manually in the Firebase console — clients
 * can never create them (Security Rules deny all writes to admins/).
 */

const ADMINS_COLLECTION = "admins";

/**
 * Verifies that a signed-in user holds the admin role.
 *
 * - Missing record or permission-denied → false (not an admin).
 * - Network/availability failures → throws so the caller can offer a retry
 *   instead of misreporting a transient outage as "access denied".
 */
export async function verifyAdminAccess(uid: string): Promise<boolean> {
  try {
    const snapshot = await getDoc(doc(db, ADMINS_COLLECTION, uid));
    if (!snapshot.exists()) return false;
    const data = snapshot.data();
    return typeof data.role === "string" && data.role === "admin";
  } catch (error) {
    const code = getFirebaseCode(error);
    if (code === "firestore/permission-denied" || code === "firestore/not-found") {
      return false;
    }
    // Surface unexpected failures (offline, emulator down, etc.) to the UI.
    throw toAppError(error);
  }
}
