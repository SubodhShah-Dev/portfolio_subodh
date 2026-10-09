/**
 * Public profile information (§8).
 * Stored at profile/public — readable by anyone, writable only by admins.
 */
export interface PublicProfile {
  id: string;
  name: string;
  role: string;
  headline: string;
  bio: string;
  /** Legacy single portrait — kept in sync with the first deck photo. */
  profileImageUrl?: string;
  /** Stacked About photo deck — first entry fronts the stack. */
  profileImageUrls?: string[];
  location?: string;
}

/**
 * Contact identity for the profile (§8).
 * Stored at profile/contact — only ever contains information the owner
 * intentionally publishes. Sensitive data must never be written here.
 */
export interface ContactProfile {
  id: string;
  email?: string;
  phone?: string;
}

/** Combined profile payload consumed by the public site. */
export interface PortfolioProfile {
  public: PublicProfile;
  contact: ContactProfile;
}

/** Draft values handled by the admin form before persistence. */
export type PublicProfileInput = Omit<PublicProfile, "id">;
export type ContactProfileInput = Omit<ContactProfile, "id">;
