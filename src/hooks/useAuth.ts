import { useAuthContext, type AuthContextValue } from "../context/AuthContext";

/**
 * Authentication + authorization state (§63).
 *
 * Exposes the authenticated user, admin verification status, and safe
 * mutation methods (signIn / signOutUser / recheckAdmin).
 */
export function useAuth(): AuthContextValue {
  return useAuthContext();
}
