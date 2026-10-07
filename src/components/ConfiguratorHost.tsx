"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { loadVendorCustomElement } from "@/lib/load-vendor-element";

/** Prefer local sync (`npm run sync:configurator`); CDN lags behind host APIs. */
const SCRIPT_SRC = "/vendor/sugar-configurator.js";
const TAG_NAME = "sugar-configurator";

export type SugarConfiguratorElement = HTMLElement & {
  configuratorId?: string;
};

type ConfiguratorHostProps = {
  configuratorId: string;
  className?: string;
  onReady?: (el: SugarConfiguratorElement) => void;
};

function loadConfiguratorBundle(): Promise<void> {
  return loadVendorCustomElement(SCRIPT_SRC, TAG_NAME);
}

export function ConfiguratorHost({
  configuratorId,
  className,
  onReady,
}: ConfiguratorHostProps) {
  const t = useTranslations("hosts");
  const [bundleReady, setBundleReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const elRef = useRef<SugarConfiguratorElement | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await loadConfiguratorBundle();
        if (!cancelled) setBundleReady(true);
      } catch (err) {
        console.error("[ConfiguratorHost] failed to load", err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bundleReady || !elRef.current) return;
    onReadyRef.current?.(elRef.current);
  }, [bundleReady, configuratorId]);

  return (
    <div className={className} style={{ position: "relative", minHeight: 0 }}>
      {!bundleReady && !failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 text-sm text-[color:var(--brand-primary)]/60">
          {t("configuratorLoading")}
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 px-6 text-center text-sm text-red-600">
          {t("configuratorFailed")}
        </div>
      )}

      {bundleReady && (
        <sugar-configurator
          key={configuratorId}
          ref={(node: SugarConfiguratorElement | null) => {
            elRef.current = node;
          }}
          configurator-id={configuratorId}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
