import { portalCrmFetch } from "@/lib/portal-crm";
import type {
  CustomerQuickCreateInput,
  CustomerResponse,
  CustomerSearchHit,
  OfferCreateRequest,
  OfferResponse,
  OfferSearchCriteria,
  OfferSearchPage,
  OfferShareLinkResponse,
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

/** First section that has a non-empty room designer sceneLayout JSON. */
export function resolveOfferSceneLayout(offer: OfferResponse): string | null {
  const sections = offer.sections ?? [];
  for (const section of sections) {
    const raw = section.sceneLayout?.trim();
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
