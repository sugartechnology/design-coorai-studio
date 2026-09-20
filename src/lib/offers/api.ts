import { portalCrmFetch } from "@/lib/portal-crm";
import type {
  CustomerQuickCreateInput,
  CustomerResponse,
  CustomerSearchHit,
  OfferCreateRequest,
  OfferProductRequest,
  OfferProductResponse,
  OfferResponse,
  OfferSearchCriteria,
  OfferSearchPage,
  OfferShareLinkResponse,
  RapidRenderQuoteCreateRequest,
  RapidRenderQuoteCreateResponse,
} from "./types";

type RouterLike = { replace: (href: string) => void };

export async function searchCustomersCompletion(
  query: string,
  limit = 10,
  router?: RouterLike,
): Promise<CustomerSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  return portalCrmFetch<CustomerSearchHit[]>("customers/search-completion", {
    searchParams: { query: q, limit },
    router,
  });
}

export async function quickCreateCustomer(
  input: CustomerQuickCreateInput,
  router?: RouterLike,
): Promise<CustomerResponse> {
  return portalCrmFetch<CustomerResponse>("customers/quick-create", {
    method: "POST",
    body: input,
    router,
  });
}

export async function createOffer(
  request: OfferCreateRequest,
  router?: RouterLike,
): Promise<OfferResponse> {
  return portalCrmFetch<OfferResponse>("offers/create", {
    method: "POST",
    body: request,
    searchParams: { response: "full" },
    router,
  });
}

/** Authenticated RapidRender quote create — not pricing-preview / calculate. */
export async function createRapidRenderQuote(
  request: RapidRenderQuoteCreateRequest,
  router?: RouterLike,
): Promise<RapidRenderQuoteCreateResponse> {
  return portalCrmFetch<RapidRenderQuoteCreateResponse>(
    "integrations/proposals/quote/requests",
    {
      method: "POST",
      body: request,
      router,
    },
  );
}

export async function createShareLink(
  offerId: string,
  router?: RouterLike,
): Promise<OfferShareLinkResponse> {
  return portalCrmFetch<OfferShareLinkResponse>(`offers/${offerId}/share`, {
    method: "POST",
    body: {},
    router,
  });
}

export async function searchOffers(
  criteria: OfferSearchCriteria,
  router?: RouterLike,
): Promise<OfferSearchPage> {
  return portalCrmFetch<OfferSearchPage>("offers/search", {
    method: "POST",
    body: {
      query: criteria.query?.trim() || undefined,
      page: criteria.page,
      size: criteria.size,
      sort: criteria.sort ?? [{ field: "createdAt", order: "DESC" }],
      filters: [],
      includeImages: false,
      groupBy: null,
    },
    router,
  });
}

export async function getOfferById(
  offerId: string,
  router?: RouterLike,
): Promise<OfferResponse> {
  return portalCrmFetch<OfferResponse>(
    `offers/${encodeURIComponent(offerId)}`,
    { router },
  );
}

export function toOfferProductUpdateRequest(
  product: OfferProductResponse,
  patch: { quantity?: number; price?: number; note?: string | null },
): OfferProductRequest {
  const productId = product.productId || product.id || "";
  return {
    productId,
    sku: product.sku ?? undefined,
    name: product.name || "",
    note: patch.note !== undefined ? patch.note : product.note ?? null,
    variantSelections: product.variantSelections,
    catalogVariantSelections: [],
    price: patch.price ?? product.price ?? 0,
    currency: product.currency || "TRY",
    discount: product.discount ?? 0,
    discountType: product.discountType || "PERCENTAGE",
    quantity: patch.quantity ?? product.quantity ?? 1,
    productOrder: product.productOrder,
  };
}

export async function updateOfferProduct(
  offerId: string,
  productId: string,
  request: OfferProductRequest,
  router?: RouterLike,
): Promise<OfferResponse> {
  return portalCrmFetch<OfferResponse>(
    `offers/${encodeURIComponent(offerId)}/products/${encodeURIComponent(productId)}/update`,
    {
      method: "POST",
      body: request,
      router,
    },
  );
}

/** First section that has a non-empty room designer sceneLayout JSON. */
export function resolveOfferSceneLayout(offer: OfferResponse): string | null {
  const sections = offer.sections ?? [];
  for (const section of sections) {
    const raw =
      section.sceneLayout?.trim() ||
      (typeof (section as { scene?: unknown }).scene === "string"
        ? String((section as { scene?: string }).scene).trim()
        : "");
    if (raw) return raw;
  }
  return null;
}

export function resolveCustomerId(hit: CustomerSearchHit): string | null {
  return hit.customerId || hit.id || null;
}

export function formatCustomerLabel(hit: CustomerSearchHit): string {
  const name = hit.name?.trim();
  const phone = hit.mobileNumber || hit.phoneNumber;
  if (name && phone) return `${name} · ${phone}`;
  return name || phone || hit.email || hit.id || "";
}
