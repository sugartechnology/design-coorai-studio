"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const SCRIPT_ID = "sugar-recaptcha-api";
const READY_CALLBACK = "sugarRecaptchaReady";

declare global {
  interface Window {
    grecaptcha?: {
      ready(cb: () => void): void;
      render(
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
        },
      ): number;
      getResponse(widgetId?: number): string;
      reset(widgetId?: number): void;
    };
    [READY_CALLBACK]?: () => void;
  }
}

let loadingScript: Promise<void> | null = null;

async function loadRecaptchaScript(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.grecaptcha?.render) {
    await new Promise<void>((resolve) => window.grecaptcha!.ready(() => resolve()));
    return;
  }
  if (!loadingScript) {
    loadingScript = new Promise<void>((resolve, reject) => {
      window[READY_CALLBACK] = () => {
        if (window.grecaptcha?.ready) {
          window.grecaptcha.ready(() => resolve());
          return;
        }
        resolve();
      };
      const existing = document.getElementById(SCRIPT_ID);
      if (existing) {
        if (window.grecaptcha?.ready) {
          window.grecaptcha.ready(() => resolve());
        }
        return;
      }
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src =
        "https://www.google.com/recaptcha/api.js?render=explicit&onload=" +
        READY_CALLBACK;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("recaptcha"));
      document.head.appendChild(script);
    }).catch((error) => {
      loadingScript = null;
      throw error;
    });
  }
  await loadingScript;
}

export type PlannerRecaptchaHandle = {
  getToken: () => string;
  reset: () => void;
};

type PlannerRecaptchaProps = {
  onStatusChange?: (status: "loading" | "ready" | "unavailable") => void;
  onSolvedChange?: (solved: boolean) => void;
};

export const PlannerRecaptcha = forwardRef<
  PlannerRecaptchaHandle,
  PlannerRecaptchaProps
>(function PlannerRecaptcha({ onStatusChange, onSolvedChange }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  const onSolvedChangeRef = useRef(onSolvedChange);
  onStatusChangeRef.current = onStatusChange;
  onSolvedChangeRef.current = onSolvedChange;

  useEffect(() => {
    let cancelled = false;
    onStatusChangeRef.current?.("loading");
    void (async () => {
      try {
        const response = await fetch("/api/planner/auth/recaptcha");
        const data = (await response.json().catch(() => ({}))) as {
          siteKey?: string;
        };
        const siteKey = data.siteKey?.trim() || "";
        if (!siteKey || cancelled) {
          if (!cancelled) {
            onStatusChangeRef.current?.("unavailable");
          }
          return;
        }
        await loadRecaptchaScript();
        if (cancelled || !hostRef.current || !window.grecaptcha?.render) {
          if (!cancelled) {
            onStatusChangeRef.current?.("unavailable");
          }
          return;
        }
        hostRef.current.replaceChildren();
        widgetIdRef.current = window.grecaptcha.render(hostRef.current, {
          sitekey: siteKey,
          callback: () => onSolvedChangeRef.current?.(true),
          "expired-callback": () => onSolvedChangeRef.current?.(false),
        });
        onStatusChangeRef.current?.("ready");
      } catch (error) {
        console.warn("[planner-auth] recaptcha unavailable", error);
        if (!cancelled) {
          onStatusChangeRef.current?.("unavailable");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    getToken: () => {
      if (widgetIdRef.current == null || !window.grecaptcha?.getResponse) {
        return "";
      }
      return window.grecaptcha.getResponse(widgetIdRef.current) || "";
    },
    reset: () => {
      onSolvedChangeRef.current?.(false);
      if (widgetIdRef.current == null || !window.grecaptcha?.reset) return;
      window.grecaptcha.reset(widgetIdRef.current);
    },
  }));

  return (
    <div className="flex justify-center min-h-[78px]">
      <div ref={hostRef} />
    </div>
  );
});
