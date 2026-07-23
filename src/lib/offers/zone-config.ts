import { isRawZoneAreaName, zoneAreaNumber } from "@/lib/material-zone";
import type { MaterialZoneArea, MaterialZoneOption } from "@/lib/material-zone";
import type { QuoteVariantSelection } from "./types";

/** Build offer variantSelections + note from kumas zone picks. */
export function zoneSelectionsToConfig(
  areas: MaterialZoneArea[],
  selectionByArea: Record<string, MaterialZoneOption | null>,
  regionLabel: (n: number) => string,
): { variantSelections: QuoteVariantSelection[]; note: string } {
  const variantSelections: QuoteVariantSelection[] = [];
  const noteParts: string[] = [];

  areas.forEach((area, index) => {
    const selected = selectionByArea[area.name];
    if (!selected) return;
    const n = zoneAreaNumber(area.name, index + 1);
    const optionName =
      area.label && !isRawZoneAreaName(area.label)
        ? area.label
        : regionLabel(n);
    const valueName = selected.materialName?.trim() || selected.code;
    variantSelections.push({
      optionName,
      valueName,
      valuePathName: selected.code,
      displayOrder: index + 1,
    });
    noteParts.push(`${optionName}: ${valueName}`);
  });

  return {
    variantSelections,
    note: noteParts.join("; "),
  };
}

export function formatConfigNote(selections: QuoteVariantSelection[]): string {
  return selections
    .map((s) => `${s.optionName}: ${s.valueName}`)
    .filter(Boolean)
    .join("; ");
}
