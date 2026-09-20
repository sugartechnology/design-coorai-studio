import { getPortalSessionView } from "@/lib/portal-crm";
import {
  buildOfferCreateRequest,
  buildRapidRenderQuoteRequest,
  isRapidRenderQuoteDraft,
} from "./build-request";
import { createOffer, createRapidRenderQuote, createShareLink } from "./api";
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

/**
 * Create PENDING offer (full draft) + share link URLs for preview/edit.
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
  const origin = crmWebOrigin();
  const editUrl = buildOfferEditUrl(offer.id, session.companySlug);

  let shareToken = "";
  let shareUrl = "";
  try {
    const share = await createShareLink(offer.id, router);
    shareToken = share.token;
    shareUrl = origin ? `${origin}/share/${share.token}` : `/share/${share.token}`;
  } catch {
    // Share is optional; draft + editUrl still usable.
  }

  return { offer, shareToken, shareUrl, editUrl };
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
