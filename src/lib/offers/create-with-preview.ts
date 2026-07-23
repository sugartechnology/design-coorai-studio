import { getPortalSessionView } from "@/lib/portal-crm";
import { buildOfferCreateRequest } from "./build-request";
import { createOffer, createShareLink } from "./api";
import type { CreateOfferResult, QuoteDraft } from "./types";

function crmWebOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_CRM_WEB_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_CRM_WEB_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
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

  const request = buildOfferCreateRequest(draft);
  const offer = await createOffer(request, router);
  const origin = crmWebOrigin();
  const editUrl = origin
    ? `${origin}/${session.companySlug}/proposals/new?id=${offer.id}`
    : `/${session.companySlug}/proposals/new?id=${offer.id}`;

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
