import type { PublicProfile } from "../types/profile";

/**
 * Resolve the About photo deck (§8): trimmed, non-empty, first-wins
 * de-duplicated `profileImageUrls`, falling back to the legacy single
 * `profileImageUrl`. Never fabricates URLs — an empty result means the
 * About section renders no deck.
 */
export function resolveProfileImages(
  profile: Pick<PublicProfile, "profileImageUrl" | "profileImageUrls">,
): string[] {
  const urls: string[] = [];
  const push = (value: string | undefined): void => {
    if (value === undefined) return;
    const trimmed = value.trim();
    if (trimmed !== "" && !urls.includes(trimmed)) urls.push(trimmed);
  };
  for (const url of profile.profileImageUrls ?? []) push(url);
  push(profile.profileImageUrl);
  return urls;
}
