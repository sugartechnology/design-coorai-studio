"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { loadVendorCustomElement } from "@/lib/load-vendor-element";
import { clearRoomDesignerLastScene } from "@/lib/offers";

const SCRIPT_SRC =
  "https://s3.eu-central-1.amazonaws.com/cdn.sugartech/mottobucket/CDN/sugar-planner/sugar-room-designer.js";
const TAG_NAME = "sugar-room-designer";

export type SugarRoomDesignerElement = HTMLElement & {
  ui?: "builtin" | "none";
  api?: {
    execute: (name: string, request: unknown) => unknown;
    store: (name: string) => {
      snapshot: unknown;
      subscribe: (listener: (value: unknown) => void) => () => void;
    };
    on: (name: string, listener: (detail: unknown) => void) => () => void;
  };
  setRenderMode: (mode: "2d" | "3d" | string) => void;
  setTool: (tool: string) => void;
  undo: () => void;
  redo: () => void;
  newScene: () => Promise<void>;
  applyRoomShape: (
    shape: string | { specs: unknown[] } | { shape: unknown },
  ) => void;
  addProduct: (
    productIdOrPayload:
      | number
      | { productId?: number; product?: unknown; companyId?: number },
  ) => Promise<unknown>;
  beginProductDrag: (payload: {
    productId?: number;
    product?: unknown;
    companyId?: number;
  }) => void;
  cancelProductDrag: () => void;
  deleteSelection: () => boolean;
};

export const SUGAR_PRODUCT_MIME = "application/x-sugar-product";

type RoomDesignerHostProps = {
  className?: string;
  appIdentifier?: string;
  welcomeMenu?: boolean;
  /** builtin = full chrome; none = canvas only (default for studio host). */
  ui?: "builtin" | "none";
  /**
   * Clear room-designer last-scene localStorage before mounting so controller
   * auto-restore cannot overwrite an offer restore.
   */
  clearLastSceneOnMount?: boolean;
  onReady?: (el: SugarRoomDesignerElement) => void;
};

function loadRoomDesignerBundle(): Promise<void> {
  return loadVendorCustomElement(SCRIPT_SRC, TAG_NAME);
}

/** True once scene.* commands are registered and UI host is mounted. */
function isSceneApiReady(el: SugarRoomDesignerElement | null): boolean {
  if (!el?.api) return false;
  try {
    el.api.execute("scene.export", undefined);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("no owner") || msg.includes("not registered")) return false;
  }
  return Boolean(el.shadowRoot?.querySelector("design-menu"));
}

export const RoomDesignerHost = forwardRef<
  SugarRoomDesignerElement | null,
  RoomDesignerHostProps
>(function RoomDesignerHost(
  {
    className,
    welcomeMenu = true,
    clearLastSceneOnMount = false,
    onReady,
  },
  ref,
) {
  const t = useTranslations("hosts");
  const [bundleReady, setBundleReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hostEl, setHostEl] = useState<SugarRoomDesignerElement | null>(null);
  const elRef = useRef<SugarRoomDesignerElement | null>(null);
  const onReadyRef = useRef(onReady);
  const notifiedElRef = useRef<SugarRoomDesignerElement | null>(null);
  const clearedLastSceneRef = useRef(false);
  onReadyRef.current = onReady;

  if (clearLastSceneOnMount && !clearedLastSceneRef.current) {
    clearedLastSceneRef.current = true;
    clearRoomDesignerLastScene();
  }

  useImperativeHandle(ref, () => elRef.current as SugarRoomDesignerElement, [
    hostEl,
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadRoomDesignerBundle();
        if (!cancelled) setBundleReady(true);
      } catch (err) {
        console.error("[RoomDesignerHost] failed to load", err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bundleReady) {
      setHostEl(null);
      return;
    }
    setHostEl(elRef.current);
  }, [bundleReady]);

  useEffect(() => {
    const el = hostEl;
    if (!el) return;

    let cancelled = false;
    let pollId = 0;

    const notify = () => {
      if (cancelled) return;
      if (!isSceneApiReady(el)) return;
      if (notifiedElRef.current === el) return;
      notifiedElRef.current = el;
      onReadyRef.current?.(el);
    };

    el.addEventListener("ready", notify);
    // Soft-nav: "ready" may fire before this effect attaches.
    notify();
    pollId = window.setInterval(() => {
      notify();
      if (notifiedElRef.current === el) {
        window.clearInterval(pollId);
        pollId = 0;
      }
    }, 50);
    const stopPoll = window.setTimeout(() => {
      if (pollId) window.clearInterval(pollId);
      pollId = 0;
    }, 30_000);

    return () => {
      cancelled = true;
      el.removeEventListener("ready", notify);
      if (pollId) window.clearInterval(pollId);
      window.clearTimeout(stopPoll);
      if (notifiedElRef.current === el) notifiedElRef.current = null;
    };
  }, [hostEl]);

  return (
    <div className={className} style={{ position: "relative", minHeight: 0 }}>
      {!bundleReady && !failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 text-sm text-[color:var(--brand-primary)]/60">
          {t("roomDesignerLoading")}
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 px-6 text-center text-sm text-red-600">
          {t("roomDesignerFailed")}
        </div>
      )}

      {bundleReady && (
        <sugar-room-designer
          ref={(node: SugarRoomDesignerElement | null) => {
            elRef.current = node;
          }}
          welcome-menu={welcomeMenu ? "true" : "false"}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
});
