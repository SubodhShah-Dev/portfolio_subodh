import type {
  ContactProfile,
  ContactProfileInput,
  PortfolioProfile,
  PublicProfile,
  PublicProfileInput,
} from "../types/profile";
import { cached, invalidateCache } from "./contentCache";
import { fetchDocById, upsertSingleDoc } from "./serviceUtils";

/**
 * Profile content (§8).
 *
 * profile/public — name, role, headline, bio, image, location (public data)
 * profile/contact — email, phone (intentionally published contact identity)
 *
 * Nothing sensitive may ever be stored in these documents; Firestore rules
 * are document-level, so separation happens at the data-model layer.
 */

const PUBLIC_PATH = "profile/public";
const CONTACT_PATH = "profile/contact";
const CACHE_SCOPE = "profile";
const COMBINED_CACHE_KEY = "profile:combined";

/** Combined public + contact profile, or null when no profile exists yet. */
export async function getProfile(): Promise<PortfolioProfile | null> {
  return cached(COMBINED_CACHE_KEY, async () => {
    const [publicProfile, contactProfile] = await Promise.all([
      fetchDocById<PublicProfile>(PUBLIC_PATH, "public"),
      fetchDocById<ContactProfile>(CONTACT_PATH, "contact"),
    ]);
    if (publicProfile === null) return null;
    return {
      public: publicProfile,
      contact: contactProfile ?? { id: "contact" },
    };
  });
}

export async function updateProfile(input: PublicProfileInput): Promise<void> {
  await upsertSingleDoc(PUBLIC_PATH, "public", input);
  invalidateCache(CACHE_SCOPE);
}

export async function updateContactProfile(
  input: ContactProfileInput,
): Promise<void> {
  await upsertSingleDoc(CONTACT_PATH, "contact", input);
  invalidateCache(CACHE_SCOPE);
}
