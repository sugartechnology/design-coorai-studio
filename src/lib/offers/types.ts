export type QuoteVariantSelection = {
  optionName: string;
  valueName: string;
  valuePathName?: string;
  displayOrder?: number;
};

export type QuoteLineItem = {
  productId: string;
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
  section: QuoteSectionMeta;
  lines: QuoteLineItem[];
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

export type OfferCustomerResponse = {
  firstName?: string;
  lastName?: string;
  customerCompanyName?: string;
  phoneNumber?: string;
  email?: string;
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
  note?: string | null;
  variantSelections?: OfferProductVariantSelection[];
};

export type OfferSectionResponse = {
  id?: string;
  name?: string;
  sectionOrder?: number;
  roomType?: string | null;
  promptNotes?: string | null;
  sceneLayout?: string | null;
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
  shareToken: string;
  shareUrl: string;
  editUrl: string;
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
