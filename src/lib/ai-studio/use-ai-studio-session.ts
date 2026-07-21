"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getPortalSessionView } from "@/lib/portal-crm";
import { getOrCreateAiStudioSessionId } from "./ai-studio-api";

export function useAiStudioSession() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await getPortalSessionView();
      if (!session) {
        router.replace("/login");
        return;
      }
      if (cancelled) return;
      setCompanyId(session.companyId);
      setSessionId(getOrCreateAiStudioSessionId(session.companyId));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const resetSession = useCallback(() => {
    if (!companyId) return;
    const key = `ai-studio:portal:${companyId}`;
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    const next = getOrCreateAiStudioSessionId(companyId);
    setSessionId(next);
  }, [companyId]);

  return { sessionId, companyId, ready, resetSession };
}
