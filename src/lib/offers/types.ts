export type QuoteVariantSelection = {
  optionName: string;
  valueName: string;
  valuePathName?: string;
  displayOrder?: number;
};

export type QuoteLineItem = {
  productId: string;
  /** Sugar / RapidRender numeric id — room-designer quote create. */
  rapidRenderProductId?: number;
  rapidRenderCompanyId?: number;
  name: string;
  sku?: string | null;
  quantity: number;
  price: number;
  currency: string;
  note?: string | null;
  imageUrl?: string | null;
  variantSelections?: QuoteVariantSelection[];
};

export type QuoteSectionMeta = {
  name: string;
  roomType?: string | null;
  promptNotes?: string | null;
  sceneLayout?: string | null;
  images?: Array<{
    imageUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    altText?: string;
    imageOrder?: number;
  }>;
};

export type QuoteDraft = {
  title?: string;
  notes?: string;
  currency: string;
  language: string;
  customerId?: string | null;
  customerLabel?: string | null;
  customerFirstName?: string | null;
  customerLastName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerCompany?: string | null;
  section: QuoteSectionMeta;
  lines: QuoteLineItem[];
};

export type RapidRenderQuoteCustomerRequest = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  city?: string;
};

export type RapidRenderQuoteProductImageRequest = {
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
};

export type RapidRenderQuoteProductRequest = {
  crmProductId?: string;
  rapidRenderProductId?: number;
  productModalId?: number;
  rapidRenderCompanyId?: number;
  name?: string;
  sku?: string;
  quantity: number;
  configuration?: QuoteVariantSelection[];
  images?: RapidRenderQuoteProductImageRequest[];
};

export type RapidRenderQuoteSectionRequest = {
  name?: string;
  sectionOrder?: number;
  images?: RapidRenderQuoteProductImageRequest[];
  products: RapidRenderQuoteProductRequest[];
  sceneLayout?: string;
};

export type RapidRenderQuoteCreateRequest = {
  idempotencyKey: string;
  language?: string;
  currency?: string;
  customer?: RapidRenderQuoteCustomerRequest;
  products?: RapidRenderQuoteProductRequest[];
  sections?: RapidRenderQuoteSectionRequest[];
  note?: string;
  scene?: string;
};

export type RapidRenderQuoteCreateResponse = {
  success?: boolean;
  message?: string;
  requestId?: string;
  offerId?: string;
  offerNumber?: string;
  customerId?: string;
  status?: string;
  mailSent?: boolean;
};

export type OfferProductVariantSelection = QuoteVariantSelection & {
  optionId?: string | null;
  valueId?: string | null;
};

export type OfferProductRequest = {
  productId: string;
  sku?: string | null;
  name: string;
  note?: string | null;
  variantSelections?: OfferProductVariantSelection[];
  catalogVariantSelections?: OfferProductVariantSelection[];
  price: number;
  currency: string;
  discount: number;
  discountType: string;
  quantity: number;
  productOrder?: number;
};

export type OfferSectionRequest = {
  name: string;
  sectionOrder: number;
  roomType?: string | null;
  promptNotes?: string | null;
  sceneLayout?: string | null;
  images?: QuoteSectionMeta["images"];
  products: OfferProductRequest[];
};

export type OfferCreateRequest = {
  title?: string;
  notes?: string;
  currency: string;
  language: string;
  status: "PENDING";
  customerId: string;
  sections: OfferSectionRequest[];
  vatIncludedInPrice?: boolean;
  showUnitPrice?: boolean;
  showUnitPriceWithVat?: boolean;
  showTax?: boolean;
  showExtraDiscount?: boolean;
};

export type OfferUpdateRequest = {
  title?: string;
  notes?: string;
  currency: string;
  language: string;
  status?: string;
  customerId?: string | null;
  sections: OfferSectionRequest[];
  vatIncludedInPrice?: boolean;
  showUnitPrice?: boolean;
  showUnitPriceWithVat?: boolean;
  showTax?: boolean;
  showExtraDiscount?: boolean;
};

export type OfferCustomerResponse = {
  id?: string;
  customerId?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  customerCompanyName?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  email?: string;
};

export type OfferImageResponse = {
  imageUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
  imageOrder?: number;
};

export type OfferProductResponse = {
  id?: string;
  productId?: string;
  name?: string;
  sku?: string;
  quantity?: number;
  price?: number;
  totalPrice?: number;
  currency?: string;
  discount?: number;
  discountType?: string;
  productOrder?: number;
  note?: string | null;
  imageUrl?: string | null;
  variantSelections?: OfferProductVariantSelection[];
};

export type OfferSectionResponse = {
  id?: string;
  name?: string;
  sectionOrder?: number;
  roomType?: string | null;
  promptNotes?: string | null;
  sceneLayout?: string | null;
  images?: OfferImageResponse[];
  products?: OfferProductResponse[];
};

export type OfferResponse = {
  id: string;
  offerNumber?: string;
  title?: string;
  status?: string;
  currency?: string;
  language?: string;
  totalPrice?: number;
  notes?: string;
  customer?: OfferCustomerResponse;
  sections?: OfferSectionResponse[];
};

export type OfferSearchResponse = {
  id: string;
  offerNumber?: string;
  title?: string;
  customerName?: string;
  customerId?: string;
  totalPrice?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  updatedBy?: string;
};

export type OfferSearchCriteria = {
  query?: string;
  page: number;
  size: number;
  sort?: Array<{ field: string; order: "ASC" | "DESC" }>;
};

export type OfferSearchPage = {
  content?: OfferSearchResponse[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  query?: string | null;
};

export type OfferShareLinkResponse = {
  token: string;
  includeCollectionHistory?: boolean;
};

export type CreateOfferResult = {
  offer: OfferResponse;
  shareToken?: string;
  shareUrl?: string;
  editUrl?: string;
};

export type CustomerSearchHit = {
  id?: string;
  customerId?: string;
  name?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  email?: string;
  customerCompanyName?: string;
};

export type CustomerQuickCreateInput = {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  customerCompanyName?: string;
  sourceId?: string;
};

export type CustomerSourceResponse = {
  id: string;
  title?: string;
  type?: string | null;
};

export type CustomerResponse = {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  email?: string;
  customerCompanyName?: string;
};
