"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "/vendor/sugar-model-viewer.js";
/** İstikbal / Sugar catalog company for model fetch */
export const SUGAR_MODEL_VIEWER_COMPANY_ID = 42;

export type SugarModelViewerElement = HTMLElement & {
  sugarProductId?: number;
  productId?: string;
  companyId?: number;
  ar?: boolean;
};

type ModelViewerHostProps = {
  /** CRM `productModalId` — Sugar numeric `sugarProductId`. */
  sugarProductId: string | number;
  companyId?: number;
  className?: string;
  /** Enables built-in AR action inside the viewer. */
  ar?: boolean;
};

declare global {
  interface Window {
    __sugarModelViewerLoading?: Promise<void>;
  }
}

function loadModelViewerBundle(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("sugar-model-viewer")) return Promise.resolve();
  if (!window.__sugarModelViewerLoading) {
    window.__sugarModelViewerLoading = import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      SCRIPT_SRC
    ).then(async () => {
      await customElements.whenDefined("sugar-model-viewer");
    });
  }
  return window.__sugarModelViewerLoading;
}

export function ModelViewerHost({
  sugarProductId,
  companyId = SUGAR_MODEL_VIEWER_COMPANY_ID,
  className,
  ar = true,
}: ModelViewerHostProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const elRef = useRef<SugarModelViewerElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadModelViewerBundle();
        if (!cancelled) setReady(true);
      } catch (err) {
        console.error("[ModelViewerHost] failed to load", err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={className} style={{ position: "relative", minHeight: 0 }}>
      {!ready && !failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50/80 text-sm text-[color:var(--istikbal-blue)]/60">
          3D görüntüleyici yükleniyor…
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 px-6 text-center text-sm text-red-600">
          3D görüntüleyici yüklenemedi. `npm run sync:model-viewer` çalıştırıp
          sayfayı yenileyin.
        </div>
      )}

      {ready && (
        <sugar-model-viewer
          ref={(node: SugarModelViewerElement | null) => {
            elRef.current = node;
          }}
          sugar-product-id={String(sugarProductId)}
          company-id={String(companyId)}
          {...(ar ? { ar: "" } : {})}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
