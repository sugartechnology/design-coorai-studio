import type { CatalogProductDetail, CatalogProductPrice } from "@/lib/catalog/catalog-types";

function currencyCode(raw: CatalogProductPrice["currency"]): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  return raw.currencyCode ?? null;
}

/** Prefer matching currency; else first positive amount. */
export function resolveCatalogUnitPrice(
  prices: CatalogProductPrice[] | undefined,
  preferredCurrency: string,
): { amount: number; currency: string } {
  const list = prices ?? [];
  const preferred = preferredCurrency.toUpperCase();
  const match = list.find((p) => {
    const code = currencyCode(p.currency)?.toUpperCase();
    return code === preferred && typeof p.amount === "number" && p.amount >= 0;
  });
  if (match && typeof match.amount === "number") {
    return { amount: match.amount, currency: preferred };
  }
  const any = list.find((p) => typeof p.amount === "number" && p.amount > 0);
  if (any && typeof any.amount === "number") {
    return {
      amount: any.amount,
      currency: currencyCode(any.currency)?.toUpperCase() || preferred,
    };
  }
  return { amount: 0, currency: preferred };
}

export function lineFromCatalogProduct(
  product: Pick<CatalogProductDetail, "id" | "name" | "sku" | "thumbnailUrl" | "prices">,
  options: {
    quantity?: number;
    currency: string;
    note?: string | null;
    variantSelections?: import("./types").QuoteVariantSelection[];
  },
) {
  const priced = resolveCatalogUnitPrice(product.prices, options.currency);
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku ?? null,
    quantity: options.quantity ?? 1,
    price: priced.amount,
    currency: priced.currency,
    note: options.note ?? null,
    imageUrl: product.thumbnailUrl ?? null,
    variantSelections: options.variantSelections ?? [],
  };
}
