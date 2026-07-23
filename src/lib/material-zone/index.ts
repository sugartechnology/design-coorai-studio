export type {
  MaterialZoneArea,
  MaterialZoneOption,
  MaterialZoneResponse,
  ZoneSelectionPayload,
} from "./types";

export {
  MATERIAL_ZONE_AREA_NAME_PREFIX_LENGTH,
  areaDisplayLabel,
  optionSwatchBackground,
  resolveOptionForArea,
  selectedCodesFromZones,
  zoneAreaNameToGroupCode,
} from "./helpers";

export { useProductZones } from "./use-product-zones";
