export type MaterialZoneOption = {
  code: string;
  image?: string;
  materialId: number;
  materialName?: string;
  selectable: boolean;
  selected: boolean;
  type: string;
};

export type MaterialZoneArea = {
  name: string;
  label?: string;
  options: MaterialZoneOption[];
  selected: MaterialZoneOption;
  hexCode: string | null;
};

export type MaterialZoneResponse = {
  areas: MaterialZoneArea[];
  image?: string;
  productId: number;
  sku: string;
};

/** @deprecated Payload is built inside sugar-model-viewer. */
export type ZoneSelectionPayload = {
  companyId: string;
  productId?: number | string;
  stockCode?: string;
} & Record<string, string | number | undefined>;
