"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyViewerMaterial,
  fetchViewerZones,
  type SugarModelViewerElement,
} from "@/components/ModelViewerHost";
import {
  resolveOptionForArea,
  selectedCodesFromZones,
  zoneAreaNameToGroupCode,
} from "./helpers";
import type {
  MaterialZoneArea,
  MaterialZoneOption,
  MaterialZoneResponse,
} from "./types";

type UseProductZonesOptions = {
  sugarProductId: string | null;
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

/**
 * Zone data comes from sugar-model-viewer (MaterialZoneApi inside the bundle)
 * via CustomEvent — portal does not call the Rapid API directly.
 */
export function useProductZones({
  sugarProductId,
  fallbackError = "Could not load fabric regions.",
}: UseProductZonesOptions) {
  const [zones, setZones] = useState<MaterialZoneResponse | null>(null);
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

  const areas = zones?.areas ?? [];
  areaNamesRef.current = areas.map((a) => a.name);
  zonesRef.current = zones;
  fallbackErrorRef.current = fallbackError;

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

  const loadZones = useCallback(async (codes: Record<string, string>) => {
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
    } catch (err) {
      if (gen !== loadGenRef.current) return;
      setError(err instanceof Error ? err.message : fallbackErrorRef.current);
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  }, [sugarProductId]);

  useEffect(() => {
    if (!sugarProductId) {
      setZones(null);
      setSelectedCodes({});
      setError(null);
      setPickerAreaName(null);
      setViewerReady(false);
      viewerElRef.current = null;
      return;
    }
    if (!viewerReady) return;
    void loadZones({});
  }, [sugarProductId, viewerReady, loadZones]);

  const onViewerReady = useCallback((el: SugarModelViewerElement) => {
    viewerElRef.current = el;
    setViewerReady(true);
    if (zonesRef.current) applyZonesToViewer(el, zonesRef.current);
  }, []);

  const pickOption = useCallback(
    async (area: MaterialZoneArea, option: MaterialZoneOption) => {
      if (!option.selectable && !option.selected) return;

      const nextCodes = { ...selectedCodes, [area.name]: option.code };
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
