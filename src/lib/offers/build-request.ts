import type {
  OfferCreateRequest,
  OfferProductRequest,
  QuoteDraft,
  QuoteLineItem,
} from "./types";
import { formatConfigNote } from "./zone-config";

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
