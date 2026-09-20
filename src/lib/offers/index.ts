export type {
  CreateOfferResult,
  CustomerQuickCreateInput,
  CustomerResponse,
  CustomerSearchHit,
  OfferCreateRequest,
  OfferImageResponse,
  OfferProductResponse,
  OfferResponse,
  OfferSectionResponse,
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
  createRapidRenderQuote,
  createShareLink,
  formatCustomerLabel,
  getOfferById,
  quickCreateCustomer,
  resolveCustomerId,
  resolveOfferSceneLayout,
  searchCustomersCompletion,
  searchOffers,
  toOfferProductUpdateRequest,
  updateOfferProduct,
} from "./api";
export {
  applyOfferSceneToDesigner,
  clearRoomDesignerLastScene,
  ROOM_DESIGNER_LAST_SCENE_KEY,
  type ApplyOfferSceneResult,
  type OfferSceneHost,
} from "./apply-offer-scene";
export {
  buildOfferCreateRequest,
  buildRapidRenderQuoteRequest,
  isRapidRenderQuoteDraft,
  splitPersonName,
  toOfferProductRequest,
} from "./build-request";
export {
  createOfferWithPreview,
  buildOfferEditUrl,
  buildOfferShareUrl,
} from "./create-with-preview";
export { lineFromCatalogProduct, resolveCatalogUnitPrice } from "./pricing";
export { attachQuoteViewImages, type QuoteCaptureViews } from "./quote-view-images";
export { formatConfigNote, zoneSelectionsToConfig } from "./zone-config";
