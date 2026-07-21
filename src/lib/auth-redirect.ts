/**
 * Shared client helper: CRM 401 → clear leftover UI state and go to login.
 */
export function redirectToLoginOnUnauthorized(status: number, router: { replace: (href: string) => void }) {
  if (status !== 401) return false;
  router.replace("/login");
  return true;
}
