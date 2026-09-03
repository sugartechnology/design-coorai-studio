"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { loadVendorCustomElement } from "@/lib/load-vendor-element";

const SCRIPT_SRC = "/vendor/sugar-model-viewer.js?v=20260903-byid";
const TAG_NAME = "sugar-model-viewer";
/** Fallback when host does not pass companyId. Prefer template `rrCompanyId`. */
export const SUGAR_MODEL_VIEWER_COMPANY_ID = 42;

export const APPLY_MATERIAL_EVENT = "sugar-model-viewer-apply-material";
export const FETCH_ZONES_EVENT = "sugar-model-viewer-fetch-zones";
export const ZONES_EVENT = "sugar-model-viewer-zones";
export const ZONES_ERROR_EVENT = "sugar-model-viewer-zones-error";
export const REQUEST_ZONE_GUIDE_EVENT =
  "sugar-model-viewer-request-zone-guide";
export const ZONE_GUIDE_EVENT = "sugar-model-viewer-zone-guide";
export const PRODUCT_READY_EVENT = "sugar-model-viewer-product-ready";

export type ApplyMaterialDetail = {
  groupCode: string;
  materialCode: string;
};

export type FetchZonesDetail = {
  codes?: Record<string, string>;
  areaNames?: string[];
};

export type MaterialZoneResponse = {
  areas: Array<{
    name: string;
    label?: string;
    options: Array<{
      code: string;
      image?: string;
      materialId: number;
      materialName?: string;
      selectable: boolean;
      selected: boolean;
      type: string;
    }>;
    selected: {
      code: string;
      image?: string;
      materialId: number;
      materialName?: string;
      selectable: boolean;
      selected: boolean;
      type: string;
    };
    hexCode: string | null;
  }>;
  image?: string;
  productId: number;
  sku: string;
};

export type SugarModelViewerElement = HTMLElement & {
  sugarProductId?: number;
  productId?: string;
  companyId?: number;
  ar?: boolean;
};

type ModelViewerHostProps = {
  /** CRM `productModalId` — Sugar numeric `sugarProductId`. */
  sugarProductId: string | number;
  /** Fabric catalog stock code (`product-id` → `stockCode`). */
  stockCode?: string;
  companyId?: number;
  className?: string;
  /** Enables built-in AR action inside the viewer. */
  ar?: boolean;
  /**
   * `panel` — built-in material panel (default).
   * `host` — panel hidden; host applies via CustomEvent.
   */
  materialUi?: "panel" | "host";
  /** Sol altta render settings menüsü. */
  settings?: boolean;
  /** Called when the custom element is in the DOM and defined. */
  onElementReady?: (el: SugarModelViewerElement) => void;
};

function loadModelViewerBundle(): Promise<void> {
  return loadVendorCustomElement(SCRIPT_SRC, TAG_NAME);
}

/** Dispatch apply-material to the viewer element (no class methods). */
export function applyViewerMaterial(
  el: EventTarget | null | undefined,
  detail: ApplyMaterialDetail,
): void {
  if (!el) return;
  el.dispatchEvent(
    new CustomEvent(APPLY_MATERIAL_EVENT, {
      detail,
      bubbles: true,
      composed: true,
    }),
  );
}

/**
 * Ask the viewer (MaterialZoneApi inside the bundle) to fetch zones.
 * stockCode/companyId come from the element's attributes.
 */
export function fetchViewerZones(
  el: EventTarget,
  detail: FetchZonesDetail = {},
): Promise<MaterialZoneResponse> {
  return new Promise((resolve, reject) => {
    const onOk = (event: Event) => {
      cleanup();
      const zones = (event as CustomEvent<{ zones: MaterialZoneResponse }>)
        .detail?.zones;
      if (!zones) {
        reject(new Error("empty zones response"));
        return;
      }
      resolve(zones);
    };
    const onErr = (event: Event) => {
      cleanup();
      const message =
        (event as CustomEvent<{ error: string }>).detail?.error ||
        "material-zone fetch failed";
      reject(new Error(message));
    };
    const cleanup = () => {
      el.removeEventListener(ZONES_EVENT, onOk);
      el.removeEventListener(ZONES_ERROR_EVENT, onErr);
    };
    el.addEventListener(ZONES_EVENT, onOk);
    el.addEventListener(ZONES_ERROR_EVENT, onErr);
    el.dispatchEvent(
      new CustomEvent(FETCH_ZONES_EVENT, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  });
}

/** Ask viewer for zone-legend screenshot (dataUrl may be null if model not ready). */
export function requestViewerZoneGuide(
  el: EventTarget,
): Promise<string | null> {
  return new Promise((resolve) => {
    const onGuide = (event: Event) => {
      el.removeEventListener(ZONE_GUIDE_EVENT, onGuide);
      const dataUrl =
        (event as CustomEvent<{ dataUrl: string | null }>).detail?.dataUrl ??
        null;
      resolve(dataUrl);
    };
    el.addEventListener(ZONE_GUIDE_EVENT, onGuide);
    el.dispatchEvent(
      new CustomEvent(REQUEST_ZONE_GUIDE_EVENT, {
        bubbles: true,
        composed: true,
      }),
    );
  });
}

export function ModelViewerHost({
  sugarProductId,
  stockCode,
  companyId = SUGAR_MODEL_VIEWER_COMPANY_ID,
  className,
  ar = true,
  materialUi = "panel",
  settings = true,
  onElementReady,
}: ModelViewerHostProps) {
  const t = useTranslations("hosts");
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

  useEffect(() => {
    if (!ready || !elRef.current) return;
    onElementReady?.(elRef.current);
  }, [ready, sugarProductId, stockCode, companyId, materialUi, settings, onElementReady]);

  return (
    <div className={className} style={{ position: "relative", minHeight: 0 }}>
      {!ready && !failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50/80 text-sm text-[color:var(--brand-primary)]/60">
          {t("modelViewerLoading")}
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 px-6 text-center text-sm text-red-600">
          {t("modelViewerFailed")}
        </div>
      )}

      {ready && (
        <sugar-model-viewer
          ref={(node: SugarModelViewerElement | null) => {
            elRef.current = node;
          }}
          sugar-product-id={String(sugarProductId)}
          {...(stockCode ? { "product-id": stockCode } : {})}
          company-id={String(companyId)}
          material-ui={materialUi}
          {...(ar ? { ar: true } : {})}
          {...(settings ? { settings: true } : {})}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
