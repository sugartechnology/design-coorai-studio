import type {
  MaterialZoneArea,
  MaterialZoneOption,
  MaterialZoneResponse,
} from "./types";

/** API alan adı önek uzunluğu (color1 → grup soneki "1") — viewer ile aynı */
export const MATERIAL_ZONE_AREA_NAME_PREFIX_LENGTH = 5;

export const ZONE_COLORS_43: Record<number, string> = {
  1: "#C5230F",
  2: "#0044CC",
  3: "#531D1D",
  4: "#267041",
  5: "#8330B5",
  6: "#C08A0E",
  7: "#11928B",
  8: "#767417",
  9: "#C46251",
  10: "#43464B",
};

/** Company 42 legend colors (viewer zoneColors ile aynı) */
export const ZONE_COLORS_42: Record<number, string> = {
  1: "#538DD5",
  2: "#948A54",
  3: "#963634",
  4: "#92CDDC",
  5: "#FF3300",
  6: "#E6B8B7",
  7: "#E26B0A",
  8: "#0F243E",
  9: "#76933C",
  10: "#FFFF00",
  11: "#FF66CC",
  12: "#66FF66",
  13: "#60497A",
  14: "#57DC28",
  15: "#F2A636",
};

export const ZONE_COLORS_DEFAULT: Record<number, string> = {
  ...ZONE_COLORS_42,
};

export function resolveZoneColors(
  companyId?: string | number | null,
): Record<number, string> {
  switch (String(companyId ?? "")) {
    case "43":
      return ZONE_COLORS_43;
    case "42":
      return ZONE_COLORS_42;
    default:
      return ZONE_COLORS_DEFAULT;
  }
}

export function zoneColorForArea(
  areaName: string,
  companyId: string | number = 42,
): string {
  const n = parseInt(areaName.match(/\d+/)?.[0] ?? "0", 10);
  return resolveZoneColors(companyId)[n] ?? "#999999";
}

export function zoneAreaNameToGroupCode(areaName: string): string | null {
  if (areaName.length <= MATERIAL_ZONE_AREA_NAME_PREFIX_LENGTH) return null;
  return areaName.slice(MATERIAL_ZONE_AREA_NAME_PREFIX_LENGTH);
}

export function sortAreasByName(areas: MaterialZoneArea[]): MaterialZoneArea[] {
  return [...areas].sort((a, b) => {
    const na = parseInt(a.name.match(/\d+/)?.[0] ?? "0", 10);
    const nb = parseInt(b.name.match(/\d+/)?.[0] ?? "0", 10);
    return na - nb;
  });
}

export function zoneAreaNumber(areaName: string, fallback = 0): number {
  const n = parseInt(areaName.match(/\d+/)?.[0] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Raw API name/label — prefer localized regionLabel in UI */
export function areaDisplayLabel(area: MaterialZoneArea): string {
  return (area.label || area.name || "").trim() || area.name;
}

/** True when label is missing or just another colorN token */
export function isRawZoneAreaName(value?: string | null): boolean {
  if (!value?.trim()) return true;
  return /^color\d+$/i.test(value.trim());
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

/** names[0..idx-1] korunur + names[idx]=code; altı temizlenir */
export function rebuildCodesOnPick(
  areaName: string,
  code: string,
  names: string[],
  prev: Record<string, string>,
): Record<string, string> {
  const idx = names.indexOf(areaName);
  const next: Record<string, string> = {};
  if (idx < 0) {
    next[areaName] = code;
    return next;
  }
  for (let i = 0; i < idx; i++) {
    const val = prev[names[i]];
    if (val) next[names[i]] = val;
  }
  next[areaName] = code;
  return next;
}
