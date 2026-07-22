"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";

const SCRIPT_SRC = "/vendor/sugar-room-designer.js";
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
  onReady?: (el: SugarRoomDesignerElement) => void;
};

declare global {
  interface Window {
    __sugarRoomDesignerLoading?: Promise<void>;
  }
}

function loadRoomDesignerBundle(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("sugar-room-designer")) return Promise.resolve();
  if (!window.__sugarRoomDesignerLoading) {
    window.__sugarRoomDesignerLoading = import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      SCRIPT_SRC
    ).then(async () => {
      await customElements.whenDefined("sugar-room-designer");
    });
  }
  return window.__sugarRoomDesignerLoading;
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
    onReady,
  },
  ref,
) {
  const t = useTranslations("hosts");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const elRef = useRef<SugarRoomDesignerElement | null>(null);

  useImperativeHandle(ref, () => elRef.current as SugarRoomDesignerElement, [
    ready,
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadRoomDesignerBundle();
        if (!cancelled) setReady(true);
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
    if (!ready) return;
    const el = elRef.current;
    if (!el) return;

    const notify = () => onReady?.(el);
    el.addEventListener("ready", notify);
    // Already ready if attribute/bootstrap finished before listener.
    notify();
    return () => el.removeEventListener("ready", notify);
  }, [ready, onReady]);

  return (
    <div className={className} style={{ position: "relative", minHeight: 0 }}>
      {!ready && !failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 text-sm text-[color:var(--istikbal-blue)]/60">
          {t("roomDesignerLoading")}
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 px-6 text-center text-sm text-red-600">
          {t("roomDesignerFailed")}
        </div>
      )}

      {ready && (
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
