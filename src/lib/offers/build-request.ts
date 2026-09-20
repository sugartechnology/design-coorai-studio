import type {
  OfferCreateRequest,
  OfferProductRequest,
  QuoteDraft,
  QuoteLineItem,
  RapidRenderQuoteCreateRequest,
  RapidRenderQuoteCustomerRequest,
  RapidRenderQuoteProductImageRequest,
  RapidRenderQuoteProductRequest,
} from "./types";
import { formatConfigNote } from "./zone-config";

const CRM_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRapidRenderQuoteDraft(draft: QuoteDraft): boolean {
  return (
    draft.lines.length > 0 &&
    draft.lines.every((line) => Number(line.rapidRenderProductId) > 0)
  );
}

export function splitPersonName(raw?: string | null): {
  first: string;
  last: string;
} {
  const parts = (raw ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function toOfferProductRequest(
  line: QuoteLineItem,
  productOrder: number,
): OfferProductRequest {
  const selections = line.variantSelections ?? [];
  const note =
    line.note?.trim() ||
    (selections.length ? formatConfigNote(selections) : null);

  return {
    productId: line.productId,
    sku: line.sku ?? undefined,
    name: line.name,
    note: note || undefined,
    variantSelections: selections.map((s) => ({
      optionName: s.optionName,
      valueName: s.valueName,
      valuePathName: s.valuePathName,
      displayOrder: s.displayOrder,
    })),
    catalogVariantSelections: [],
    price: line.price,
    currency: line.currency,
    discount: 0,
    discountType: "PERCENTAGE",
    quantity: line.quantity,
    productOrder,
  };
}

export function buildOfferCreateRequest(draft: QuoteDraft): OfferCreateRequest {
  if (!draft.customerId) {
    throw new Error("customerId is required");
  }
  if (!draft.lines.length) {
    throw new Error("At least one product line is required");
  }

  return {
    title: draft.title || draft.section.name,
    notes: draft.notes,
    currency: draft.currency,
    language: draft.language,
    status: "PENDING",
    customerId: draft.customerId,
    vatIncludedInPrice: false,
    showUnitPrice: true,
    showUnitPriceWithVat: false,
    showTax: true,
    showExtraDiscount: false,
    sections: [
      {
        name: draft.section.name,
        sectionOrder: 0,
        roomType: draft.section.roomType ?? undefined,
        promptNotes: draft.section.promptNotes ?? undefined,
        sceneLayout: draft.section.sceneLayout ?? undefined,
        images: draft.section.images ?? [],
        products: draft.lines.map((line, i) => toOfferProductRequest(line, i + 1)),
      },
    ],
  };
}

function quoteCustomerFromDraft(
  draft: QuoteDraft,
): RapidRenderQuoteCustomerRequest | undefined {
  const fromLabel = splitPersonName(draft.customerLabel);
  const first = draft.customerFirstName?.trim() || fromLabel.first;
  const last = draft.customerLastName?.trim() || fromLabel.last;
  if (!first || !last) return undefined;
  return {
    firstName: first,
    lastName: last,
    email: draft.customerEmail?.trim() || undefined,
    phone: draft.customerPhone?.trim() || undefined,
    company: draft.customerCompany?.trim() || undefined,
  };
}

function productImages(
  line: QuoteLineItem,
): RapidRenderQuoteProductImageRequest[] | undefined {
  const url = line.imageUrl?.trim();
  if (!url) return undefined;
  return [
    {
      imageUrl: url,
      thumbnailUrl: url,
      caption: line.name,
      altText: line.name,
    },
  ];
}

function toRapidRenderProduct(
  line: QuoteLineItem,
  companyId?: number | null,
): RapidRenderQuoteProductRequest {
  const sugarId = Number(line.rapidRenderProductId);
  const crmId = CRM_UUID.test(line.productId) ? line.productId : undefined;
  return {
    crmProductId: crmId,
    rapidRenderProductId: sugarId,
    productModalId: sugarId,
    rapidRenderCompanyId:
      line.rapidRenderCompanyId ??
      (companyId && companyId > 0 ? companyId : undefined),
    name: line.name,
    sku: line.sku ?? undefined,
    quantity: line.quantity,
    configuration: line.variantSelections,
    images: productImages(line),
  };
}

export function buildRapidRenderQuoteRequest(
  draft: QuoteDraft,
  options?: { rapidRenderCompanyId?: number | null },
): RapidRenderQuoteCreateRequest {
  if (!draft.lines.length) {
    throw new Error("At least one product line is required");
  }
  const products = draft.lines.map((line) =>
    toRapidRenderProduct(line, options?.rapidRenderCompanyId),
  );
  const sectionImages = (draft.section.images ?? [])
    .filter((image) => image.imageUrl?.trim())
    .map((image) => ({
      imageUrl: image.imageUrl,
      thumbnailUrl: image.thumbnailUrl,
      caption: image.caption,
      altText: image.altText,
    }));

  return {
    idempotencyKey:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `oda-${Date.now()}`,
    language: draft.language,
    currency: draft.currency,
    customer: quoteCustomerFromDraft(draft),
    sections: [
      {
        name: draft.section.name,
        sectionOrder: 0,
        images: sectionImages.length ? sectionImages : undefined,
        products,
        sceneLayout: draft.section.sceneLayout ?? undefined,
      },
    ],
    note: draft.notes,
    scene: draft.section.sceneLayout ?? undefined,
  };
}
