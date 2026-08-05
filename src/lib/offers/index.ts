export type {
  CreateOfferResult,
  CustomerQuickCreateInput,
  CustomerResponse,
  CustomerSearchHit,
  OfferCreateRequest,
  OfferResponse,
  OfferSearchCriteria,
  OfferSearchPage,
  OfferSearchResponse,
  QuoteDraft,
  QuoteLineItem,
  QuoteSectionMeta,
  QuoteVariantSelection,
} from "./types";

export {
  createOffer,
  createShareLink,
  formatCustomerLabel,
  getOfferById,
  quickCreateCustomer,
  resolveCustomerId,
  resolveOfferSceneLayout,
  searchCustomersCompletion,
  searchOffers,
} from "./api";
export {
  applyOfferSceneToDesigner,
  clearRoomDesignerLastScene,
  ROOM_DESIGNER_LAST_SCENE_KEY,
  type ApplyOfferSceneResult,
  type OfferSceneHost,
} from "./apply-offer-scene";
export { buildOfferCreateRequest, toOfferProductRequest } from "./build-request";
export { createOfferWithPreview, buildOfferEditUrl } from "./create-with-preview";
export { lineFromCatalogProduct, resolveCatalogUnitPrice } from "./pricing";
export { formatConfigNote, zoneSelectionsToConfig } from "./zone-config";
