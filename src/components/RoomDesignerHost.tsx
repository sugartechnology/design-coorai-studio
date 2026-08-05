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

const SCRIPT_SRC = "/vendor/sugar-room-designer.js";
const TAG_NAME = "sugar-room-designer";
const APP_IDENTIFIER = "10203";

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
  applyRoomShape: (shape: string) => void;
  addProduct: (
    productIdOrPayload:
      | number
      | { productId?: number; product?: unknown },
  ) => Promise<unknown>;
  beginProductDrag: (payload: {
    productId?: number;
    product?: unknown;
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
   * Clear room-designer last-scene localStorage before mounting the element
   * so controller auto-restore cannot race an external scene.import.
   */
  clearLastSceneOnMount?: boolean;
  onReady?: (el: SugarRoomDesignerElement) => void;
};

const ROOM_LAST_SCENE_KEY = "sugartech:room-designer:last-scene:v1";

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
  // design-menu appears only after full bootstrap (_ok + renderHtml).
  const menu = el.shadowRoot?.querySelector("design-menu");
  return Boolean(menu);
}

export const RoomDesignerHost = forwardRef<
  SugarRoomDesignerElement | null,
  RoomDesignerHostProps
>(function RoomDesignerHost(
  {
    className,
    appIdentifier = APP_IDENTIFIER,
    welcomeMenu = true,
    ui = "none",
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
    try {
      window.localStorage.removeItem(ROOM_LAST_SCENE_KEY);
    } catch {
      // ignore
    }
    try {
      window.sessionStorage.setItem(
        "sugartech:room-designer:suppress-last-scene",
        "1",
      );
    } catch {
      // ignore
    }
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

  // Sync element instance after mount (ref is set before layout/passive effects).
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
      console.info("[RoomDesignerHost] onReady");
      onReadyRef.current?.(el);
    };

    const onDomReady = () => {
      console.info("[RoomDesignerHost] DOM ready event");
      notify();
    };
    el.addEventListener("ready", onDomReady);

    // Soft-nav: cached catalog/bootstrap can emit "ready" before this effect runs.
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
      el.removeEventListener("ready", onDomReady);
      if (pollId) window.clearInterval(pollId);
      window.clearTimeout(stopPoll);
      if (notifiedElRef.current === el) notifiedElRef.current = null;
    };
  }, [hostEl]);

  return (
    <div className={className} style={{ position: "relative", minHeight: 0 }}>
      {!bundleReady && !failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 text-sm text-[color:var(--istikbal-blue)]/60">
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
          app-identifier={appIdentifier}
          welcome-menu={welcomeMenu ? "true" : "false"}
          ui={ui}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
});
