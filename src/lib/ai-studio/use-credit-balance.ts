"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalCrmError } from "@/lib/portal-crm";
import { getCreditBalance } from "./ai-studio-api";
import type { CreditBalanceResponse } from "./types";

export function useCreditBalance(enabled = true) {
  const router = useRouter();
  const [balance, setBalance] = useState<CreditBalanceResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    setLoading(true);
    setError(null);
    try {
      const next = await getCreditBalance(router);
      setBalance(next);
      return next;
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return null;
      setError(err instanceof Error ? err.message : "credits");
      setBalance(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, router]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const availableCredit = balance?.availableCredit ?? null;
  const depleted = Boolean(balance?.depleted) || (availableCredit != null && availableCredit <= 0);
  const lowCredit = Boolean(balance?.lowCredit) && !depleted;

  return {
    balance,
    availableCredit,
    depleted,
    lowCredit,
    loading,
    error,
    refresh,
  };
}
