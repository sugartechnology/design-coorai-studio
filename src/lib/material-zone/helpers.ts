import type {
  MaterialZoneArea,
  MaterialZoneOption,
  MaterialZoneResponse,
} from "./types";

/** API alan adı önek uzunluğu (color1 → grup soneki "1") — viewer ile aynı */
export const MATERIAL_ZONE_AREA_NAME_PREFIX_LENGTH = 5;

export function zoneAreaNameToGroupCode(areaName: string): string | null {
  if (areaName.length <= MATERIAL_ZONE_AREA_NAME_PREFIX_LENGTH) return null;
  return areaName.slice(MATERIAL_ZONE_AREA_NAME_PREFIX_LENGTH);
}

export function areaDisplayLabel(area: MaterialZoneArea): string {
  return (area.label || area.name || "").trim() || area.name;
}

export function optionSwatchBackground(
  option?: MaterialZoneOption | null,
): string {
  if (option?.image) return `center / cover no-repeat url(${option.image})`;
  return "repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 4px,#f3f4f6 4px,#f3f4f6 8px)";
}

export function selectedCodesFromZones(
  zones: MaterialZoneResponse,
  fallback: Record<string, string> = {},
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const area of zones.areas) {
    const code = area.selected?.code || fallback[area.name];
    if (code) next[area.name] = code;
  }
  return next;
}

export function resolveOptionForArea(
  area: MaterialZoneArea,
  selectedCode?: string,
): MaterialZoneOption | null {
  if (selectedCode) {
    const match = area.options.find((o) => o.code === selectedCode);
    if (match) return match;
  }
  return area.selected || null;
}
