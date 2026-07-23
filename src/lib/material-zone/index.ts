export type {
  MaterialZoneArea,
  MaterialZoneOption,
  MaterialZoneResponse,
  ZoneSelectionPayload,
} from "./types";

export {
  MATERIAL_ZONE_AREA_NAME_PREFIX_LENGTH,
  ZONE_COLORS_42,
  areaDisplayLabel,
  isRawZoneAreaName,
  optionSwatchBackground,
  rebuildCodesOnPick,
  resolveOptionForArea,
  selectedCodesFromZones,
  sortAreasByName,
  zoneAreaNameToGroupCode,
  zoneAreaNumber,
  zoneColorForArea,
} from "./helpers";

export { useProductZones } from "./use-product-zones";
