const AUTH_STORAGE_KEY = "sugar.auth.v1";
const CHANGE_EVENT = "sugar-auth-change";

export type PlannerAuthUser = {
  id?: string | null;
  companyId?: string | null;
  email?: string | null;
  username?: string | null;
  companyName?: string | null;
};

export type PlannerAuthResponse = {
  status?: string;
  ticket?: string | null;
  expiresAt?: string | null;
  user?: PlannerAuthUser | null;
  selectionToken?: string | null;
};

function dispatchAuthChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function persistPlannerAuth(data: PlannerAuthResponse): boolean {
  if (data.status !== "AUTHENTICATED" || !data.ticket) return false;
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ticket: data.ticket,
      expiresAt: data.expiresAt ?? null,
      user: data.user ?? null,
    }),
  );
  dispatchAuthChange();
  return true;
}

export function readPlannerTicket(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ticket?: string };
    return parsed.ticket?.trim() || null;
  } catch {
    return null;
  }
}

export function clearPlannerAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  dispatchAuthChange();
}

export async function logoutPlannerAuth(): Promise<void> {
  const ticket = readPlannerTicket();
  try {
    if (ticket) {
      await fetch("/api/planner/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${ticket}` },
      });
    }
  } catch (error) {
    console.warn("[planner-auth] logout failed", error);
  } finally {
    clearPlannerAuth();
  }
}

export async function obtainAndPersistPlannerTicket(opts: {
  identifier: string;
  password: string;
  recaptchaToken?: string;
  companyId?: string | null;
}): Promise<void> {
  if (!opts.recaptchaToken?.trim()) {
    console.warn("[planner-auth] skipped: recaptcha token required");
    return;
  }
  try {
    const loginRes = await fetch("/api/planner/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: opts.identifier,
        password: opts.password,
        recaptchaToken: opts.recaptchaToken || undefined,
      }),
    });
    const data = (await loginRes.json().catch(() => ({}))) as PlannerAuthResponse;
    if (data.status === "COMPANY_SELECTION_REQUIRED") {
      if (!opts.companyId || !data.selectionToken) {
        console.warn(
          "[planner-auth] COMPANY_SELECTION_REQUIRED without companyId/selectionToken",
        );
        return;
      }
      const companyRes = await fetch("/api/planner/auth/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectionToken: data.selectionToken,
          companyId: opts.companyId,
        }),
      });
      const companyData = (await companyRes
        .json()
        .catch(() => ({}))) as PlannerAuthResponse;
      persistPlannerAuth(companyData);
      return;
    }
    persistPlannerAuth(data);
  } catch (error) {
    console.warn("[planner-auth] ticket fetch failed", error);
  }
}
