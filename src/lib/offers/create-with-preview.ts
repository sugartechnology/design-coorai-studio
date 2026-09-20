import { getPortalSessionView } from "@/lib/portal-crm";
import {
  buildOfferCreateRequest,
  buildRapidRenderQuoteRequest,
  isRapidRenderQuoteDraft,
} from "./build-request";
import { createOffer, createRapidRenderQuote } from "./api";
import type { CreateOfferResult, OfferResponse, QuoteDraft } from "./types";

export function crmWebOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_CRM_WEB_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_CRM_WEB_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
}

/** CRM proposal editor URL for an existing offer. */
export function buildOfferEditUrl(offerId: string, companySlug: string): string {
  const origin = crmWebOrigin();
  const path = `/${companySlug}/proposals/new?id=${encodeURIComponent(offerId)}`;
  return origin ? `${origin}${path}` : path;
}

type RouterLike = { replace: (href: string) => void };

/** Public CRM share page for PDF viewing. */
export function buildOfferShareUrl(token: string): string {
  const origin = crmWebOrigin();
  const path = `/share/${encodeURIComponent(token)}`;
  return origin ? `${origin}${path}` : path;
}

/**
 * Create PENDING offer. View/edit continues in DSP `/teklifler/[id]`.
 */
export async function createOfferWithPreview(
  draft: QuoteDraft,
  router?: RouterLike,
): Promise<CreateOfferResult> {
  const session = await getPortalSessionView();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const offer = isRapidRenderQuoteDraft(draft)
    ? await createRoomRapidRenderOffer(draft, session.rrCompanyId, router)
    : await createOffer(buildOfferCreateRequest(draft), router);

  return { offer };
}

async function createRoomRapidRenderOffer(
  draft: QuoteDraft,
  rrCompanyId: number | null | undefined,
  router?: RouterLike,
): Promise<OfferResponse> {
  const created = await createRapidRenderQuote(
    buildRapidRenderQuoteRequest(draft, { rapidRenderCompanyId: rrCompanyId }),
    router,
  );
  if (!created.offerId) {
    throw new Error(created.message || "Teklif oluşturulamadı.");
  }
  return {
    id: created.offerId,
    offerNumber: created.offerNumber,
    status: created.status,
    customer: created.customerId ? { firstName: draft.customerFirstName ?? undefined } : undefined,
  };
}
