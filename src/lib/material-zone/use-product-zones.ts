"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyViewerMaterial,
  fetchViewerZones,
  PRODUCT_READY_EVENT,
  requestViewerZoneGuide,
  type SugarModelViewerElement,
} from "@/components/ModelViewerHost";
import {
  rebuildCodesOnPick,
  resolveOptionForArea,
  selectedCodesFromZones,
  sortAreasByName,
  zoneAreaNameToGroupCode,
} from "./helpers";
import type {
  MaterialZoneArea,
  MaterialZoneOption,
  MaterialZoneResponse,
} from "./types";

type UseProductZonesOptions = {
  sugarProductId: string | null;
  stockCode?: string;
  companyId?: number | string;
  fallbackError?: string;
};

function applyZonesToViewer(
  el: SugarModelViewerElement | null,
  zones: MaterialZoneResponse,
) {
  if (!el) return;
  for (const area of zones.areas) {
    const code = area.selected?.code;
    if (!code) continue;
    const groupCode = zoneAreaNameToGroupCode(area.name);
    if (!groupCode) continue;
    applyViewerMaterial(el, { groupCode, materialCode: code });
  }
}

async function resolveGuideImage(
  el: SugarModelViewerElement,
  fallbackImage?: string,
): Promise<string | null> {
  // Model henüz hazır olmayabilir — birkaç deneme
  for (let i = 0; i < 6; i++) {
    const dataUrl = await requestViewerZoneGuide(el);
    if (dataUrl) return dataUrl;
    await new Promise((r) => setTimeout(r, 400 + i * 200));
  }
  return fallbackImage || null;
}

/**
 * Zone data comes from sugar-model-viewer (MaterialZoneApi + catalog merge)
 * via CustomEvent — portal does not call the Rapid API directly.
 */
export function useProductZones({
  sugarProductId,
  stockCode,
  companyId,
  fallbackError = "Could not load fabric regions.",
}: UseProductZonesOptions) {
  const [zones, setZones] = useState<MaterialZoneResponse | null>(null);
  const [guideImage, setGuideImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Record<string, string>>(
    {},
  );
  const [pickerAreaName, setPickerAreaName] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const viewerElRef = useRef<SugarModelViewerElement | null>(null);
  const areaNamesRef = useRef<string[]>([]);
  const zonesRef = useRef(zones);
  const fallbackErrorRef = useRef(fallbackError);
  const loadGenRef = useRef(0);
  const guideGenRef = useRef(0);

  const areas = useMemo(
    () => (zones ? sortAreasByName(zones.areas) : []),
    [zones],
  );
  areaNamesRef.current = areas.map((a) => a.name);
  zonesRef.current = zones;
  fallbackErrorRef.current = fallbackError;

  const sku = zones?.sku?.trim() || null;

  const selectionByArea = useMemo(() => {
    const map: Record<string, MaterialZoneOption | null> = {};
    for (const area of areas) {
      map[area.name] = resolveOptionForArea(area, selectedCodes[area.name]);
    }
    return map;
  }, [areas, selectedCodes]);

  const allSelected =
    areas.length > 0 && areas.every((a) => Boolean(selectedCodes[a.name]));

  const pickerArea = areas.find((a) => a.name === pickerAreaName) ?? null;

  const refreshGuide = useCallback(async (fallbackImage?: string) => {
    const el = viewerElRef.current;
    if (!el) return;
    const gen = ++guideGenRef.current;
    const image = await resolveGuideImage(el, fallbackImage);
    if (gen !== guideGenRef.current) return;
    setGuideImage(image);
  }, []);

  const loadZones = useCallback(
    async (codes: Record<string, string>) => {
      const el = viewerElRef.current;
      if (!el || !sugarProductId) return;

      const gen = ++loadGenRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchViewerZones(el, {
          codes,
          areaNames: areaNamesRef.current,
        });
        if (gen !== loadGenRef.current) return;
        setZones(res);
        setSelectedCodes(selectedCodesFromZones(res, codes));
        applyZonesToViewer(el, res);
        if (Object.keys(codes).length === 0) {
          void refreshGuide(res.image);
        } else {
          setGuideImage((prev) => prev || res.image || null);
        }
      } catch (err) {
        if (gen !== loadGenRef.current) return;
        setError(
          err instanceof Error ? err.message : fallbackErrorRef.current,
        );
      } finally {
        if (gen === loadGenRef.current) setLoading(false);
      }
    },
    [sugarProductId, refreshGuide],
  );

  useEffect(() => {
    if (!sugarProductId) {
      setZones(null);
      setGuideImage(null);
      setSelectedCodes({});
      setError(null);
      setPickerAreaName(null);
      setViewerReady(false);
      viewerElRef.current = null;
      return;
    }
    if (!viewerReady) return;
    void loadZones({});
  }, [sugarProductId, stockCode, companyId, viewerReady, loadZones]);

  const onViewerReady = useCallback(
    (el: SugarModelViewerElement) => {
      viewerElRef.current = el;
      setViewerReady(true);
      if (zonesRef.current) applyZonesToViewer(el, zonesRef.current);

      const onProductReady = () => {
        void refreshGuide(zonesRef.current?.image);
      };
      el.addEventListener(PRODUCT_READY_EVENT, onProductReady);
      // Stale listener cleanup via element replace (key=sugarProductId)
    },
    [refreshGuide],
  );

  const pickOption = useCallback(
    async (area: MaterialZoneArea, option: MaterialZoneOption) => {
      const nextCodes = rebuildCodesOnPick(
        area.name,
        option.code,
        areaNamesRef.current,
        selectedCodes,
      );
      setSelectedCodes(nextCodes);
      setPickerAreaName(null);

      const groupCode = zoneAreaNameToGroupCode(area.name);
      if (groupCode) {
        applyViewerMaterial(viewerElRef.current, {
          groupCode,
          materialCode: option.code,
        });
      }
      await loadZones(nextCodes);
    },
    [selectedCodes, loadZones],
  );

  return {
    areas,
    zones,
    sku,
    guideImage,
    loading,
    error,
    selectedCodes,
    selectionByArea,
    allSelected,
    pickerArea,
    setPickerAreaName,
    onViewerReady,
    pickOption,
  };
}
